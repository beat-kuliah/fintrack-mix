package models

type TransactionSummary struct {
	TotalIncome  float64 `json:"total_income"`
	TotalExpense float64 `json:"total_expense"`
	Balance      float64 `json:"balance"`
}

type DashboardStats struct {
	TotalAccounts    int                 `json:"total_accounts"`
	TotalBalance     float64             `json:"total_balance"`
	TotalIncome      float64             `json:"total_income"`
	TotalExpense     float64             `json:"total_expense"`
	TotalBudgets     int                 `json:"total_budgets"`
	TotalCreditCards int                 `json:"total_credit_cards"`
	RecentTransactions []Transaction     `json:"recent_transactions"`
}
