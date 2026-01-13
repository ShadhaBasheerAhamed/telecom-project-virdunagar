import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../services/authService';
import { CustomerService } from '../services/customerService';
import { PaymentService } from '../services/paymentService';
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

describe('Core Services Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('AuthService', () => {
        it('should login successfully', async () => {
            const mockUser = { id: '1', name: 'Admin', role: 'Super Admin', token: 'fake-token' };
            // API call returns { data: { user, token } }
            (api.post as any).mockResolvedValue({ data: { user: mockUser, token: 'fake-token' } });

            const result = await AuthService.signIn('admin@example.com', 'password');

            expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'admin@example.com', password: 'password' });

            // AuthService.signIn returns { success: true, data: user }
            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockUser);

            expect(localStorage.getItem('auth_token')).toBe('fake-token');
        });

        it('should logout correctly', () => {
            AuthService.signOut();
            expect(localStorage.getItem('auth_token')).toBeNull();
        });
    });

    describe('CustomerService', () => {
        it('should fetch customers', async () => {
            const mockCustomers = [{ id: '1', name: 'John Doe' }];
            (api.get as any).mockResolvedValue({ data: mockCustomers });

            const result = await CustomerService.getCustomers();

            expect(api.get).toHaveBeenCalledWith('/customers');
            expect(result).toEqual(mockCustomers);
        });

        it('should add a customer', async () => {
            const newCustomer = { name: 'Jane Doe', mobileNo: '9876543210' };
            (api.post as any).mockResolvedValue({ data: { id: '2', ...newCustomer } });

            const result = await CustomerService.addCustomer(newCustomer as any);

            expect(api.post).toHaveBeenCalledWith('/customers', newCustomer);
            // CustomerService.addCustomer returns ONLY the ID string
            expect(result).toBe('2');
        });
    });

    describe('PaymentService', () => {
        it('should fetch payments', async () => {
            const mockPayments = [{ id: 'p1', amount: 500 }];
            (api.get as any).mockResolvedValue({ data: mockPayments });

            const result = await PaymentService.getPayments();

            expect(api.get).toHaveBeenCalledWith('/payments');
            expect(result).toEqual(mockPayments);
        });

        it('should add a payment', async () => {
            const newPayment = { amount: 100 };
            const customerId = '1';
            (api.post as any).mockResolvedValue({ data: { id: 'p2', ...newPayment, customerId } });

            const result = await PaymentService.addPayment(newPayment as any, customerId);

            // PaymentService adds customer_id property
            expect(api.post).toHaveBeenCalledWith('/payments', expect.objectContaining({
                ...newPayment,
                customer_id: customerId
            }));

            expect(result.id).toBe('p2');
        });
    });

});
