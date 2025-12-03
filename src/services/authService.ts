import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import type {
  UserProfile,
  AuthState,
  Permission,
  ApiResponse
} from '../types';

const USERS_COLLECTION = 'users';

export const AuthService = {

  // ==================== AUTHENTICATION METHODS ====================
  signIn: async (email: string, password: string): Promise<ApiResponse<UserProfile>> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      if (!firebaseUser) {
        throw new Error('No user found in credential');
      }
      
      // Get user profile from Firestore
      const userProfile = await (this as any).getUserProfile(firebaseUser.uid);
      
      if (!userProfile) {
        // Create profile if it doesn't exist
        const newProfile = await (this as any).createUserProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
          role: 'operator'
        });
        
        if (!newProfile.success || !newProfile.data) {
          throw new Error('Failed to create user profile');
        }
        
        return {
          success: true,
          data: newProfile.data
        };
      }
      
      // Update last login
      await (this as any).updateLastLogin(userProfile.id);
      
      return {
        success: true,
        data: userProfile
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed'
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
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update Firebase profile
      await updateProfile(firebaseUser, { displayName });
      
      // Create user profile in Firestore
      const profileResult = await (this as any).createUserProfile({
        uid: firebaseUser.uid,
        email,
        displayName,
        role
      });
      
      if (!profileResult.success || !profileResult.data) {
        // Clean up Firebase user if profile creation fails
        await firebaseUser.delete();
        throw new Error('Failed to create user profile');
      }
      
      return {
        success: true,
        data: profileResult.data
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign up failed'
      };
    }
  },

  signInWithGoogle: async (): Promise<ApiResponse<UserProfile>> => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;
      
      // Get or create user profile
      let userProfile = await (this as any).getUserProfile(firebaseUser.uid);
      
      if (!userProfile) {
        const newProfile = await (this as any).createUserProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
          role: 'operator'
        });
        
        if (!newProfile.success || !newProfile.data) {
          throw new Error('Failed to create user profile');
        }
        
        userProfile = newProfile.data;
      }
      
      // Update last login
      await (this as any).updateLastLogin(userProfile.id);
      
      return {
        success: true,
        data: userProfile
      };
    } catch (error) {
      console.error('Google sign in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Google sign in failed'
      };
    }
  },

  signOut: async (): Promise<ApiResponse<void>> => {
    try {
      await signOut(auth);
      return {
        success: true
      };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign out failed'
      };
    }
  },

  resetPassword: async (email: string): Promise<ApiResponse<void>> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: 'Password reset email sent'
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password reset failed'
      };
    }
  },

  // ==================== USER PROFILE MANAGEMENT ====================
  createUserProfile: async (userData: {
    uid: string;
    email: string;
    displayName: string;
    role: UserProfile['role'];
  }): Promise<ApiResponse<UserProfile>> => {
    try {
      const defaultPermissions = (this as any).getDefaultPermissions(userData.role);
      
      const profile: Omit<UserProfile, 'id'> = {
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        permissions: defaultPermissions,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, USERS_COLLECTION), {
        ...profile,
        uid: userData.uid // Store Firebase UID for reference
      });
      
      const createdProfile: UserProfile = {
        id: docRef.id,
        ...profile
      };
      
      return {
        success: true,
        data: createdProfile
      };
    } catch (error) {
      console.error('Error creating user profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user profile'
      };
    }
  },

  getUserProfile: async (uid: string): Promise<UserProfile | null> => {
    try {
      const q = query(
        collection(db, USERS_COLLECTION),
        where('uid', '==', uid),
        limit(1)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as UserProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },

  updateUserProfile: async (
    userId: string, 
    updates: Partial<UserProfile>
  ): Promise<ApiResponse<UserProfile>> => {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(userRef, updateData);
      
      // Return updated profile
      const updatedProfile = await (this as any).getUserProfileById(userId);
      
      if (!updatedProfile) {
        throw new Error('Failed to fetch updated profile');
      }
      
      return {
        success: true,
        data: updatedProfile
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user profile'
      };
    }
  },

  getUserProfileById: async (userId: string): Promise<UserProfile | null> => {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return null;
      }
      
      return {
        id: userDoc.id,
        ...userDoc.data()
      } as UserProfile;
    } catch (error) {
      console.error('Error fetching user profile by ID:', error);
      return null;
    }
  },

  updateLastLogin: async (userId: string): Promise<void> => {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      await updateDoc(userRef, {
        lastLogin: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  },

  // ==================== AUTH STATE MONITORING ====================
  onAuthStateChange: (
    callback: (authState: AuthState) => void
  ): (() => void) => {
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in
        const userProfile = await (this as any).getUserProfile(firebaseUser.uid);
        
        callback({
          user: userProfile,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
      } else {
        // User is signed out
        callback({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      }
    });
  },

  // ==================== USER MANAGEMENT (ADMIN ONLY) ====================
  getAllUsers: async (): Promise<UserProfile[]> => {
    try {
      const q = query(
        collection(db, USERS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  },

  getUsersByRole: async (role: UserProfile['role']): Promise<UserProfile[]> => {
    try {
      const q = query(
        collection(db, USERS_COLLECTION),
        where('role', '==', role),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];
    } catch (error) {
      console.error('Error fetching users by role:', error);
      return [];
    }
  },

  deactivateUser: async (userId: string): Promise<boolean> => {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      await updateDoc(userRef, {
        isActive: false,
        updatedAt: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Error deactivating user:', error);
      return false;
    }
  },

  activateUser: async (userId: string): Promise<boolean> => {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      await updateDoc(userRef, {
        isActive: true,
        updatedAt: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Error activating user:', error);
      return false;
    }
  },

  updateUserRole: async (
    userId: string, 
    newRole: UserProfile['role']
  ): Promise<boolean> => {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      const newPermissions = (this as any).getDefaultPermissions(newRole);
      
      await updateDoc(userRef, {
        role: newRole,
        permissions: newPermissions,
        updatedAt: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      return false;
    }
  },

  // ==================== PERMISSION MANAGEMENT ====================
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
    if (!user || !user.isActive) {
      return false;
    }

    const permission = user.permissions.find(p => p.resource === resource);
    return permission ? permission.actions.includes(action) : false;
  },

  canAccessResource: (
    user: UserProfile | null, 
    resource: string
  ): boolean => {
    return user ? user.permissions.some(p => p.resource === resource) : false;
  },

  // ==================== UTILITY METHODS ====================
  getCurrentUser: async (): Promise<UserProfile | null> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return null;
      }
      
      return await (this as any).getUserProfile(currentUser.uid);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  isEmailRegistered: async (email: string): Promise<boolean> => {
    try {
      const q = query(
        collection(db, USERS_COLLECTION),
        where('email', '==', email),
        limit(1)
      );

      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking if email is registered:', error);
      return false;
    }
  },

  validatePassword: (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};