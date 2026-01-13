import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeadService } from '../services/leadService';
import { ComplaintsService } from '../services/complaintsService';
import { InventoryService } from '../services/inventoryService';
import { NetworkProviderService } from '../services/networkProviderService';
import { ExpenseService } from '../services/expenseService';
import { SalesService } from '../services/salesService';
import { MasterRecordService } from '../services/masterRecordService';
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
            expect(result).toBe('l2');
        });

        it('should update a lead', async () => {
            (api.put as any).mockResolvedValue({ data: { success: true } });
            await LeadService.updateLead('l1', { status: 'Success' });
            expect(api.put).toHaveBeenCalledWith('/leads/l1', { status: 'Success' });
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
            expect(result).toBe('c2');
        });

        it('should update a complaint', async () => {
            (api.put as any).mockResolvedValue({ data: { success: true } });
            await ComplaintsService.updateComplaint('c1', { status: 'Resolved' });
            expect(api.put).toHaveBeenCalledWith('/complaints/c1', { status: 'Resolved' });
        });

        it('should delete a complaint', async () => {
            (api.delete as any).mockResolvedValue({ data: { success: true } });
            await ComplaintsService.deleteComplaint('c1');
            expect(api.delete).toHaveBeenCalledWith('/complaints/c1');
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
            expect(result).toBe('i2');
        });

        it('should update an inventory item', async () => {
            (api.put as any).mockResolvedValue({ data: { success: true } });
            await InventoryService.updateItem('i1', { quantity: 20 });
            expect(api.put).toHaveBeenCalledWith('/inventory/i1', { quantity: 20 });
        });

        it('should delete an inventory item', async () => {
            (api.delete as any).mockResolvedValue({ data: { success: true } });
            await InventoryService.deleteItem('i1');
            expect(api.delete).toHaveBeenCalledWith('/inventory/i1');
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

        it('should update a network provider', async () => {
            (api.put as any).mockResolvedValue({ data: { success: true } });
            await NetworkProviderService.updateNetworkProvider('np1', { status: 'Inactive' });
            expect(api.put).toHaveBeenCalledWith('/network-providers/np1', { status: 'Inactive' });
        });

        it('should delete a network provider', async () => {
            (api.delete as any).mockResolvedValue({ data: { success: true } });
            await NetworkProviderService.deleteNetworkProvider('np1');
            expect(api.delete).toHaveBeenCalledWith('/network-providers/np1');
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

        it('should update an expense', async () => {
            (api.put as any).mockResolvedValue({ data: { success: true } });
            await ExpenseService.updateExpense('e1', { amount: 6000 });
            expect(api.put).toHaveBeenCalledWith('/expenses/e1', { amount: 6000 });
        });

        it('should delete an expense', async () => {
            (api.delete as any).mockResolvedValue({ data: { success: true } });
            await ExpenseService.deleteExpense('e1');
            expect(api.delete).toHaveBeenCalledWith('/expenses/e1');
        });
    });

    // ==================== SALES SERVICE TESTS ====================
    describe('SalesService', () => {
        it('should fetch sales', async () => {
            const mockSales = [{ id: 's1', customer_name: 'John', total_amount: 100 }];
            (api.get as any).mockResolvedValue({ data: mockSales });
            const result = await SalesService.getSales();
            expect(api.get).toHaveBeenCalledWith('/sales');
            expect(result).toEqual(mockSales);
        });

        it('should create a sale', async () => {
            const newSale = { customer_name: 'Alice', total_amount: 200 };
            (api.post as any).mockResolvedValue({ data: { id: 's2', ...newSale } });
            const result = await SalesService.createSale(newSale as any);
            expect(api.post).toHaveBeenCalledWith('/sales', newSale);
            expect(result).toBe('s2');
        });

        it('should delete a sale', async () => {
            (api.delete as any).mockResolvedValue({ data: { success: true } });
            await SalesService.deleteSale('s1');
            expect(api.delete).toHaveBeenCalledWith('/sales/s1');
        });
    });

    // ==================== MASTER RECORD SERVICE TESTS ====================
    describe('MasterRecordService', () => {
        it('should fetch master records (plans)', async () => {
            const mockPlans = [{ id: 'm1', name: 'Plan A' }];
            (api.get as any).mockResolvedValue({ data: mockPlans });
            const result = await MasterRecordService.getRecords('plan');
            expect(api.get).toHaveBeenCalledWith('/master-records/plans');
            expect(result).toEqual(mockPlans);
        });

        it('should add a master record', async () => {
            const newPlan = { name: 'Plan B' };
            (api.post as any).mockResolvedValue({ data: { id: 'm2', ...newPlan } });
            await MasterRecordService.addRecord('plan', newPlan);
            // MasterRecordService adds 'status' default
            expect(api.post).toHaveBeenCalledWith('/master-records/plans', { ...newPlan, status: 'Active' });
        });

        it('should update a master record', async () => {
            (api.put as any).mockResolvedValue({ data: { success: true } });
            await MasterRecordService.updateRecord('plan', 'm1', { name: 'Plan A Updated' });
            expect(api.put).toHaveBeenCalledWith('/master-records/plans/m1', { name: 'Plan A Updated' });
        });

        it('should delete a master record', async () => {
            (api.delete as any).mockResolvedValue({ data: { success: true } });
            await MasterRecordService.deleteRecord('plan', 'm1');
            expect(api.delete).toHaveBeenCalledWith('/master-records/plans/m1');
        });
    });

});
