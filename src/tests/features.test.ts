import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeadService } from '../services/leadService';
import { ComplaintsService } from '../services/complaintsService';
import { InventoryService } from '../services/inventoryService';
import { NetworkProviderService } from '../services/networkProviderService';
import { ExpenseService } from '../services/expenseService';
import api from '../services/api';

// Mock the API module
vi.mock('../services/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        defaults: { headers: { common: {} } }
    }
}));

describe('Feature Services Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ==================== LEAD SERVICE TESTS ====================
    describe('LeadService', () => {
        it('should fetch leads', async () => {
            const mockLeads = [{ id: 'l1', name: 'Potential Client', status: 'New' }];
            (api.get as any).mockResolvedValue({ data: mockLeads });

            const result = await LeadService.getLeads();

            expect(api.get).toHaveBeenCalledWith('/leads');
            expect(result).toEqual(mockLeads);
        });

        it('should add a lead', async () => {
            const newLead = { name: 'Interest Corp', status: 'New' };
            (api.post as any).mockResolvedValue({ data: { id: 'l2', ...newLead } });

            const result = await LeadService.addLead(newLead as any);

            expect(api.post).toHaveBeenCalledWith('/leads', newLead);
            expect(result).toBe('l2'); // Expecting ID string
        });

        it('should delete a lead', async () => {
            (api.delete as any).mockResolvedValue({ data: { success: true } });
            await LeadService.deleteLead('l1');
            expect(api.delete).toHaveBeenCalledWith('/leads/l1');
        });
    });

    // ==================== COMPLAINTS SERVICE TESTS ====================
    describe('ComplaintsService', () => {
        it('should fetch complaints', async () => {
            const mockComplaints = [{ id: 'c1', issue: 'No Internet', status: 'Open' }];
            (api.get as any).mockResolvedValue({ data: mockComplaints });

            const result = await ComplaintsService.getComplaints();

            expect(api.get).toHaveBeenCalledWith('/complaints');
            expect(result).toEqual(mockComplaints);
        });

        it('should add a complaint', async () => {
            const newComplaint = { issue: 'Slow Speed', status: 'Open' };
            (api.post as any).mockResolvedValue({ data: { id: 'c2', ...newComplaint } });

            const result = await ComplaintsService.addComplaint(newComplaint as any);

            expect(api.post).toHaveBeenCalledWith('/complaints', newComplaint);
            expect(result).toBe('c2'); // Expecting ID string
        });
    });

    // ==================== INVENTORY SERVICE TESTS ====================
    describe('InventoryService', () => {
        it('should fetch inventory items', async () => {
            const mockItems = [{ id: 'i1', name: 'Router X', quantity: 10 }];
            (api.get as any).mockResolvedValue({ data: mockItems });

            const result = await InventoryService.getItems();

            expect(api.get).toHaveBeenCalledWith('/inventory');
            expect(result).toEqual(mockItems);
        });

        it('should add an inventory item', async () => {
            const newItem = { name: 'Fiber Cable', quantity: 100 };
            (api.post as any).mockResolvedValue({ data: { id: 'i2', ...newItem } });

            const result = await InventoryService.addItem(newItem as any);

            expect(api.post).toHaveBeenCalledWith('/inventory', newItem);
            expect(result).toBe('i2'); // Expecting ID string
        });
    });

    // ==================== NETWORK PROVIDER SERVICE TESTS ====================
    describe('NetworkProviderService', () => {
        it('should fetch network providers', async () => {
            const mockProviders = [{ id: 'np1', name: 'Provider A', status: 'Active' }];
            (api.get as any).mockResolvedValue({ data: mockProviders });

            const result = await NetworkProviderService.getNetworkProviders();

            expect(api.get).toHaveBeenCalledWith('/network-providers');
            expect(result).toEqual(mockProviders);
        });

        it('should add a network provider', async () => {
            const newProvider = { name: 'Provider B', status: 'Active' };
            (api.post as any).mockResolvedValue({ data: { id: 'np2', ...newProvider } });

            const result = await NetworkProviderService.addNetworkProvider(newProvider as any);

            expect(api.post).toHaveBeenCalledWith('/network-providers', newProvider);
            expect(result).toBe('np2');
        });
    });

    // ==================== EXPENSE SERVICE TESTS ====================
    describe('ExpenseService', () => {
        it('should fetch expenses', async () => {
            const mockExpenses = [{ id: 'e1', category: 'Rent', amount: 5000 }];
            (api.get as any).mockResolvedValue({ data: mockExpenses });

            const result = await ExpenseService.getExpenses();

            expect(api.get).toHaveBeenCalledWith('/expenses');
            expect(result).toEqual(mockExpenses);
        });

        it('should add an expense', async () => {
            const newExpense = { category: 'Utilities', amount: 1000 };
            (api.post as any).mockResolvedValue({ data: { id: 'e2', ...newExpense } });

            const result = await ExpenseService.addExpense(newExpense as any);

            expect(api.post).toHaveBeenCalledWith('/expenses', newExpense);
            expect(result).toBe('e2');
        });
    });

});
