"""
Financial Tracker Backend API Tests
Tests for: Accounts (with sub-accounts/pockets), Budgets (month-year with copy), Gold (assets and price)
"""
import pytest
import requests
import os
import uuid

BASE_URL = "http://localhost:8001/api"

# Test credentials
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "password123"

class TestAuth:
    """Authentication tests"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401


class TestGoldPrice:
    """Gold price API tests (public endpoint)"""
    
    def test_get_gold_price(self):
        """Test getting current gold price"""
        response = requests.get(f"{BASE_URL}/gold/price")
        assert response.status_code == 200
        data = response.json()
        assert "price_per_gram" in data
        assert data["price_per_gram"] > 0
        # Verify seeded price is around 1,450,000
        assert data["price_per_gram"] == 1450000
        
    def test_get_gold_price_history(self):
        """Test getting gold price history"""
        response = requests.get(f"{BASE_URL}/gold/price/history")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for protected endpoints"""
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture
def auth_headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestAccounts:
    """Account CRUD tests - verifying no initial_balance field and sub-accounts (pockets)"""
    
    def test_get_accounts(self, auth_headers):
        """Test getting all accounts"""
        response = requests.get(f"{BASE_URL}/accounts", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
    def test_create_account_without_initial_balance(self, auth_headers):
        """Test creating account - should NOT require initial_balance"""
        unique_name = f"TEST_Account_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/accounts", headers=auth_headers, json={
            "name": unique_name,
            "type": "bank",
            "currency": "IDR"
            # Note: NO initial_balance field - this is the requirement
        })
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == unique_name
        assert data["type"] == "bank"
        assert data["balance"] == 0  # Should default to 0
        
        # Cleanup
        if "id" in data:
            requests.delete(f"{BASE_URL}/accounts/{data['id']}", headers=auth_headers)
            
    def test_create_account_types(self, auth_headers):
        """Test valid account types: bank, wallet, cash, paylater (no credit_card, no investment)"""
        valid_types = ["bank", "wallet", "cash", "paylater"]
        created_ids = []
        
        for acc_type in valid_types:
            unique_name = f"TEST_{acc_type}_{uuid.uuid4().hex[:8]}"
            response = requests.post(f"{BASE_URL}/accounts", headers=auth_headers, json={
                "name": unique_name,
                "type": acc_type,
                "currency": "IDR"
            })
            assert response.status_code == 201, f"Failed to create {acc_type} account"
            data = response.json()
            assert data["type"] == acc_type
            created_ids.append(data["id"])
            
        # Cleanup
        for acc_id in created_ids:
            requests.delete(f"{BASE_URL}/accounts/{acc_id}", headers=auth_headers)
            
    def test_create_sub_account_pocket(self, auth_headers):
        """Test creating sub-account (pocket) under parent account"""
        # Create parent account
        parent_name = f"TEST_Parent_{uuid.uuid4().hex[:8]}"
        parent_response = requests.post(f"{BASE_URL}/accounts", headers=auth_headers, json={
            "name": parent_name,
            "type": "bank",
            "currency": "IDR"
        })
        assert parent_response.status_code == 201
        parent_id = parent_response.json()["id"]
        
        # Create sub-account (pocket)
        pocket_name = f"TEST_Pocket_{uuid.uuid4().hex[:8]}"
        pocket_response = requests.post(f"{BASE_URL}/accounts", headers=auth_headers, json={
            "name": pocket_name,
            "type": "bank",
            "currency": "IDR",
            "parent_account_id": parent_id
        })
        assert pocket_response.status_code == 201
        pocket_data = pocket_response.json()
        assert pocket_data["name"] == pocket_name
        assert pocket_data.get("parent_account_id") == parent_id
        
        # Cleanup
        requests.delete(f"{BASE_URL}/accounts/{pocket_data['id']}", headers=auth_headers)
        requests.delete(f"{BASE_URL}/accounts/{parent_id}", headers=auth_headers)


class TestBudgets:
    """Budget tests - month/year based with copy feature"""
    
    def test_get_budgets(self, auth_headers):
        """Test getting all budgets"""
        response = requests.get(f"{BASE_URL}/budgets", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # API returns null for empty list
        assert data is None or isinstance(data, list)
        
    def test_create_budget_with_month_year(self, auth_headers):
        """Test creating budget with month/year (not date range)"""
        unique_category = f"TEST_Category_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/budgets", headers=auth_headers, json={
            "category": unique_category,
            "amount": 1000000,
            "budget_month": 1,  # January
            "budget_year": 2026
        })
        assert response.status_code == 201
        data = response.json()
        assert data["category"] == unique_category
        assert data["amount"] == 1000000
        assert data["budget_month"] == 1
        assert data["budget_year"] == 2026
        
        # Cleanup
        if "id" in data:
            requests.delete(f"{BASE_URL}/budgets/{data['id']}", headers=auth_headers)
            
    def test_get_budgets_by_month_year(self, auth_headers):
        """Test filtering budgets by month/year"""
        response = requests.get(f"{BASE_URL}/budgets?month=1&year=2026", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # API returns null for empty list
        assert data is None or isinstance(data, list)
        
    def test_copy_budgets_from_previous_month(self, auth_headers):
        """Test copying budgets from one month to another"""
        # First create a budget in source month
        unique_category = f"TEST_CopySource_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/budgets", headers=auth_headers, json={
            "category": unique_category,
            "amount": 500000,
            "budget_month": 12,  # December
            "budget_year": 2025
        })
        assert create_response.status_code == 201
        source_budget_id = create_response.json()["id"]
        
        # Copy to target month
        copy_response = requests.post(f"{BASE_URL}/budgets/copy", headers=auth_headers, json={
            "from_month": 12,
            "from_year": 2025,
            "to_month": 1,
            "to_year": 2026
        })
        assert copy_response.status_code == 200
        copy_data = copy_response.json()
        assert "copied" in copy_data
        
        # Cleanup source budget
        requests.delete(f"{BASE_URL}/budgets/{source_budget_id}", headers=auth_headers)
        
        # Cleanup copied budgets
        target_budgets = requests.get(f"{BASE_URL}/budgets?month=1&year=2026", headers=auth_headers)
        if target_budgets.status_code == 200:
            for budget in target_budgets.json():
                if budget["category"] == unique_category:
                    requests.delete(f"{BASE_URL}/budgets/{budget['id']}", headers=auth_headers)


class TestGoldAssets:
    """Gold asset CRUD tests"""
    
    def test_get_gold_assets(self, auth_headers):
        """Test getting all gold assets"""
        response = requests.get(f"{BASE_URL}/gold/assets", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # API returns null for empty list
        assert data is None or isinstance(data, list)
        
    def test_create_gold_asset(self, auth_headers):
        """Test creating gold asset with weight, type, purchase price"""
        unique_name = f"TEST_Gold_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/gold/assets", headers=auth_headers, json={
            "name": unique_name,
            "gold_type": "antam",
            "weight_gram": 10.0,
            "purchase_price_per_gram": 1400000,
            "purchase_date": "2025-12-01",
            "storage_location": "Safe",
            "notes": "Test gold"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == unique_name
        assert data["gold_type"] == "antam"
        assert data["weight_gram"] == 10.0
        assert data["purchase_price_per_gram"] == 1400000
        
        # Verify calculated values
        assert "current_value" in data
        assert "purchase_value" in data
        assert "profit_loss" in data
        
        # Cleanup
        if "id" in data:
            requests.delete(f"{BASE_URL}/gold/assets/{data['id']}", headers=auth_headers)
            
    def test_gold_types(self, auth_headers):
        """Test valid gold types: antam, ubs, galeri24, pegadaian, other"""
        valid_types = ["antam", "ubs", "galeri24", "pegadaian", "other"]
        created_ids = []
        
        for gold_type in valid_types:
            unique_name = f"TEST_{gold_type}_{uuid.uuid4().hex[:8]}"
            response = requests.post(f"{BASE_URL}/gold/assets", headers=auth_headers, json={
                "name": unique_name,
                "gold_type": gold_type,
                "weight_gram": 1.0,
                "purchase_price_per_gram": 1400000,
                "purchase_date": "2025-12-01"
            })
            assert response.status_code == 201, f"Failed to create {gold_type} gold"
            data = response.json()
            assert data["gold_type"] == gold_type
            created_ids.append(data["id"])
            
        # Cleanup
        for gold_id in created_ids:
            requests.delete(f"{BASE_URL}/gold/assets/{gold_id}", headers=auth_headers)
            
    def test_get_gold_summary(self, auth_headers):
        """Test getting gold summary with current price"""
        response = requests.get(f"{BASE_URL}/gold/summary", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_weight_gram" in data
        assert "total_purchase_value" in data
        assert "total_current_value" in data
        assert "total_profit_loss" in data
        assert "current_price_per_gram" in data
        # Verify current price matches seeded value
        assert data["current_price_per_gram"] == 1450000


class TestCreditCards:
    """Credit card tests - separate from accounts"""
    
    def test_get_credit_cards(self, auth_headers):
        """Test getting all credit cards"""
        response = requests.get(f"{BASE_URL}/credit-cards", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # API returns null for empty list
        assert data is None or isinstance(data, list)
        
    def test_create_credit_card(self, auth_headers):
        """Test creating credit card"""
        unique_name = f"TEST_CC_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/credit-cards", headers=auth_headers, json={
            "card_name": unique_name,
            "last_four_digits": "1234",
            "credit_limit": 10000000,
            "current_balance": 0,
            "billing_date": 15,
            "payment_due_date": 25
        })
        assert response.status_code == 201
        data = response.json()
        assert data["card_name"] == unique_name
        
        # Cleanup
        if "id" in data:
            requests.delete(f"{BASE_URL}/credit-cards/{data['id']}", headers=auth_headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
