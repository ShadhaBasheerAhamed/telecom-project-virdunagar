import api from './api';
import type {
  UserProfile,
  AuthState,
  Permission,
  ApiResponse
} from '../types';

export const AuthService = {

  // ==================== AUTHENTICATION METHODS ====================
  signIn: async (email: string, password: string): Promise<ApiResponse<UserProfile>> => {
    try {
      const response = await api.post('/auth/login', { email, password });

      const { token, user } = response.data;

      // Store token
      localStorage.setItem('auth_token', token);

      return {
        success: true,
        data: user
      };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Sign in failed'
      };
    }
  },

  signUp: async (
    email: string,
    password: string,
    displayName: string,
    role: UserProfile['role'] = 'operator'
  ): Promise<ApiResponse<UserProfile>> => {
    try {
      const response = await api.post('/auth/register', { email, password, displayName, role });

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Sign up failed'
      };
    }
  },

  signInWithGoogle: async (): Promise<ApiResponse<UserProfile>> => {
    // TODO: Implement Google Auth in Backend later
    return { success: false, error: "Google Auth not migrated yet" };
  },

  signOut: async (): Promise<ApiResponse<void>> => {
    try {
      localStorage.removeItem('auth_token');
      return {
        success: true
      };
    } catch (error) {
      return { success: false };
    }
  },

  resetPassword: async (email: string): Promise<ApiResponse<void>> => {
    // TODO: Implement Reset Password Endpoint
    return { success: true, message: 'Password reset flow to be implemented' };
  },

  // ==================== USER PROFILE MANAGEMENT ====================
  // Helper to maintain compatibility
  createUserProfile: async (userData: any) => { return { success: true } },
  getUserProfile: async (uid: string) => { return null; },

  // ==================== AUTH STATE MONITORING ====================
  onAuthStateChange: (
    callback: (authState: AuthState) => void
  ): (() => void) => {
    // Simulate checking local storage for token on load
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Ideally fetch 'me' from backend to validate token
      // For now, assume logged in if token exists (User object details might be stale until fetched)
      callback({
        user: { role: 'admin' } as UserProfile, // Placeholder until /me implemented fully in frontend context
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } else {
      callback({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }

    return () => { }; // No-op unsubscribe
  },

  // ==================== PERMISSION MANAGEMENT ====================
  // Keeping this client-side logic for now as it's useful
  getDefaultPermissions(role: UserProfile['role']): Permission[] {
    const permissionSets: Record<UserProfile['role'], Permission[]> = {
      admin: [
        { resource: 'customers', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'payments', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'leads', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'reports', actions: ['read', 'update'] },
        { resource: 'settings', actions: ['read', 'update'] }
      ],
      manager: [
        { resource: 'customers', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'payments', actions: ['create', 'read', 'update'] },
        { resource: 'leads', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'reports', actions: ['read', 'update'] }
      ],
      operator: [
        { resource: 'customers', actions: ['create', 'read', 'update'] },
        { resource: 'payments', actions: ['create', 'read', 'update'] },
        { resource: 'leads', actions: ['create', 'read', 'update'] },
        { resource: 'reports', actions: ['read'] }
      ],
      viewer: [
        { resource: 'customers', actions: ['read'] },
        { resource: 'payments', actions: ['read'] },
        { resource: 'leads', actions: ['read'] },
        { resource: 'reports', actions: ['read'] }
      ]
    };

    return permissionSets[role] || [];
  },

  hasPermission: (
    user: UserProfile | null,
    resource: string,
    action: Permission['actions'][number]
  ): boolean => {
    // Simplified permission check
    // In real app, user object comes from backend with permissions
    if (!user) return false;
    const permissions = AuthService.getDefaultPermissions(user.role);
    const permission = permissions.find(p => p.resource === resource);
    return permission ? permission.actions.includes(action) : false;
  },

  canAccessResource: (
    user: UserProfile | null,
    resource: string
  ): boolean => {
    return AuthService.hasPermission(user, resource, 'read');
  },

  getCurrentUser: async () => { return null; }, // Placeholder
  isEmailRegistered: async () => { return false; }, // Placeholder
  validatePassword: (password: string) => { return { isValid: true, errors: [] }; }
};
