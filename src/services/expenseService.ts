import api from './api';

export interface Expense {
    id: string;
    category: string;
    description: string;
    amount: number;
    date: string;
    payment_mode?: string;
}

export interface ProfitLossSummary {
    total_income: number;
    total_expenses: number;
    net_profit: number;
    profit_margin: string;
    payment_count: number;
    expense_count: number;
}

export const ExpenseService = {

    getExpenses: async (month?: number, year?: number): Promise<Expense[]> => {
        try {
            let url = '/expenses';
            if (month && year) {
                url += `?month=${month}&year=${year}`;
            }
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            console.error('Error fetching expenses:', error);
            return [];
        }
    },

    addExpense: async (expense: Omit<Expense, 'id'>): Promise<string> => {
        try {
            const response = await api.post('/expenses', expense);
            return response.data.id;
        } catch (error) {
            console.error('Error adding expense:', error);
            throw error;
        }
    },

    updateExpense: async (id: string, updates: Partial<Expense>): Promise<void> => {
        try {
            await api.put(`/expenses/${id}`, updates);
        } catch (error) {
            console.error('Error updating expense:', error);
            throw error;
        }
    },

    deleteExpense: async (id: string): Promise<void> => {
        try {
            await api.delete(`/expenses/${id}`);
        } catch (error) {
            console.error('Error deleting expense:', error);
            throw error;
        }
    },

    getProfitLossSummary: async (month?: number, year?: number): Promise<ProfitLossSummary> => {
        try {
            let url = '/expenses/profit-loss';
            if (month && year) {
                url += `?month=${month}&year=${year}`;
            }
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            console.error('Error fetching profit/loss summary:', error);
            return {
                total_income: 0,
                total_expenses: 0,
                net_profit: 0,
                profit_margin: '0',
                payment_count: 0,
                expense_count: 0
            };
        }
    }
};
