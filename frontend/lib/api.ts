// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// Types
export interface LoginRequest {
  username_or_email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  full_name: string;
}

export interface User {
  id: string;
  email: string;
  username?: string | null;
  full_name: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  error?: string;
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  
  const data = isJson ? await response.json() : await response.text();
  
  if (!response.ok) {
    const error: ApiError = isJson 
      ? data 
      : { message: data || `HTTP error! status: ${response.status}` };
    throw error;
  }
  
  return data as T;
}

// API Client
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      return handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error) {
        throw { message: error.message };
      }
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: RegisterRequest): Promise<{ message: string; user: User }> {
    return this.request<{ message: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/api/auth/me', {
      method: 'GET',
    });
  }

  // Account endpoints (Wallets)
  async getAccounts(): Promise<Account[]> {
    return this.request<Account[]>('/api/accounts', {
      method: 'GET',
    });
  }

  async createAccount(data: {
    name: string;
    type: 'bank' | 'wallet' | 'cash' | 'paylater';
    currency?: string;
    parent_account_id?: string;
  }): Promise<Account> {
    return this.request<Account>('/api/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAccount(id: string): Promise<Account> {
    return this.request<Account>(`/api/accounts/${id}`, {
      method: 'GET',
    });
  }

  async deleteAccount(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/accounts/${id}`, {
      method: 'DELETE',
    });
  }

  // Transaction endpoints
  async createTransaction(data: {
    account_id: string;
    type: 'income' | 'expense';
    category: string;
    amount: number;
    description?: string;
    transaction_date?: string;
  }): Promise<Transaction> {
    return this.request<Transaction>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTransactions(params?: {
    limit?: number;
    offset?: number;
  }): Promise<Transaction[]> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    const url = query ? `/api/transactions?${query}` : '/api/transactions';
    return this.request<Transaction[]>(url, {
      method: 'GET',
    });
  }

  async getTransaction(id: string): Promise<Transaction> {
    return this.request<Transaction>(`/api/transactions/${id}`, {
      method: 'GET',
    });
  }

  async deleteTransaction(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  async getTransactionSummary(): Promise<TransactionSummary> {
    return this.request<TransactionSummary>('/api/transactions/summary', {
      method: 'GET',
    });
  }

  // Budget endpoints
  async getBudgets(params?: {
    month?: number;
    year?: number;
  }): Promise<Budget[]> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    const url = query ? `/api/budgets?${query}` : '/api/budgets';
    return this.request<Budget[]>(url, {
      method: 'GET',
    });
  }

  async createBudget(data: {
    category: string;
    amount: number;
    budget_month: number;
    budget_year: number;
  }): Promise<Budget> {
    return this.request<Budget>('/api/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBudget(id: string): Promise<Budget> {
    return this.request<Budget>(`/api/budgets/${id}`, {
      method: 'GET',
    });
  }

  async deleteBudget(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/budgets/${id}`, {
      method: 'DELETE',
    });
  }

  async copyBudget(data: {
    from_month: number;
    from_year: number;
    to_month: number;
    to_year: number;
  }): Promise<{ message: string; copied: number }> {
    return this.request<{ message: string; copied: number }>('/api/budgets/copy', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Credit Card endpoints
  async getCreditCards(): Promise<CreditCard[]> {
    return this.request<CreditCard[]>('/api/credit-cards', {
      method: 'GET',
    });
  }

  async createCreditCard(data: {
    card_name: string;
    last_four_digits: string;
    credit_limit: number;
    current_balance?: number;
    billing_date: number;
    payment_due_date: number;
  }): Promise<CreditCard> {
    return this.request<CreditCard>('/api/credit-cards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCreditCard(id: string): Promise<CreditCard> {
    return this.request<CreditCard>(`/api/credit-cards/${id}`, {
      method: 'GET',
    });
  }

  async deleteCreditCard(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/credit-cards/${id}`, {
      method: 'DELETE',
    });
  }

  // Gold endpoints
  async getGoldPrice(): Promise<GoldPrice> {
    return this.request<GoldPrice>('/api/gold/price', {
      method: 'GET',
    });
  }

  async getGoldPriceHistory(limit?: number): Promise<GoldPrice[]> {
    const url = limit ? `/api/gold/price/history?limit=${limit}` : '/api/gold/price/history';
    return this.request<GoldPrice[]>(url, {
      method: 'GET',
    });
  }

  async getGoldAssets(): Promise<GoldAsset[]> {
    return this.request<GoldAsset[]>('/api/gold/assets', {
      method: 'GET',
    });
  }

  async createGoldAsset(data: {
    name: string;
    gold_type: 'antam' | 'ubs' | 'galeri24' | 'pegadaian' | 'other';
    weight_gram: number;
    purchase_price_per_gram: number;
    purchase_date: string;
    storage_location?: string;
    notes?: string;
  }): Promise<GoldAsset> {
    return this.request<GoldAsset>('/api/gold/assets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGoldAsset(id: string): Promise<GoldAsset> {
    return this.request<GoldAsset>(`/api/gold/assets/${id}`, {
      method: 'GET',
    });
  }

  async deleteGoldAsset(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/gold/assets/${id}`, {
      method: 'DELETE',
    });
  }

  async getGoldSummary(): Promise<GoldSummary> {
    return this.request<GoldSummary>('/api/gold/summary', {
      method: 'GET',
    });
  }
}

// Account types (Wallets)
export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'bank' | 'wallet' | 'cash' | 'paylater';
  balance: number;
  currency: string;
  parent_account_id?: string;
  created_at: string;
  updated_at: string;
  sub_accounts?: Account[];
}

// Transaction types
export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionSummary {
  total_income: number;
  total_expense: number;
  balance: number;
  income_by_category: Array<{ category: string; total: number }>;
  expense_by_category: Array<{ category: string; total: number }>;
}

// Budget types
export interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  budget_month: number;
  budget_year: number;
  created_at: string;
  updated_at: string;
}

// Credit Card types
export interface CreditCard {
  id: string;
  user_id: string;
  card_name: string;
  last_four_digits: string;
  credit_limit: number;
  current_balance: number;
  billing_date: number;
  payment_due_date: number;
  created_at: string;
  updated_at: string;
}

// Gold types
export interface GoldAsset {
  id: string;
  user_id: string;
  name: string;
  gold_type: 'antam' | 'ubs' | 'galeri24' | 'pegadaian' | 'other';
  weight_gram: number;
  purchase_price_per_gram: number;
  purchase_date: string;
  storage_location: string;
  notes: string;
  created_at: string;
  updated_at: string;
  current_price_per_gram?: number;
  current_value?: number;
  purchase_value?: number;
  profit_loss?: number;
  profit_loss_percent?: number;
}

export interface GoldPrice {
  id: string;
  price_date: string;
  price_per_gram: number;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface GoldSummary {
  total_weight_gram: number;
  total_purchase_value: number;
  total_current_value: number;
  total_profit_loss: number;
  profit_loss_percent: number;
  current_price_per_gram: number;
  price_date: string;
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

