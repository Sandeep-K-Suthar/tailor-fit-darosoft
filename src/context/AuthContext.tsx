import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Legacy admin credentials (fallback for offline/development)
const LEGACY_ADMIN = {
  username: 'admin',
  password: '#MiAdmin$',
};

interface Admin {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
}

interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (name: string, email: string, password: string, inviteCode: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string; resetToken?: string }>;
  resetPassword: (email: string, resetToken: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'tailor_fit_admin';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved auth on mount
  useEffect(() => {
    // Check for new admin auth
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const { admin: savedAdmin, token: savedToken } = JSON.parse(savedData);
        if (savedAdmin && savedToken) {
          setAdmin(savedAdmin);
          setToken(savedToken);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    
    // Check for legacy auth
    const legacyAuth = localStorage.getItem('admin-auth');
    if (legacyAuth === 'true') {
      // Create a mock admin for legacy auth
      const legacyAdmin: Admin = {
        _id: 'legacy-admin',
        name: 'Admin',
        email: 'admin@tailorfit.local',
        role: 'super_admin',
        isActive: true,
      };
      setAdmin(legacyAdmin);
      setToken('legacy-token');
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    // Check for legacy admin credentials first
    if (email === LEGACY_ADMIN.username && password === LEGACY_ADMIN.password) {
      const legacyAdmin: Admin = {
        _id: 'legacy-admin',
        name: 'Admin',
        email: 'admin@tailorfit.local',
        role: 'super_admin',
        isActive: true,
      };
      setAdmin(legacyAdmin);
      setToken('legacy-token');
      localStorage.setItem('admin-auth', 'true');
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ admin: legacyAdmin, token: 'legacy-token' }));
      return { success: true, message: 'Login successful' };
    }
    
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const responseData = await res.json();
      
      if (!res.ok || !responseData.success) {
        return { success: false, message: responseData.message || 'Login failed' };
      }

      // API returns { success, message, data: { _id, name, email, role, token } }
      const { token: newToken, ...adminData } = responseData.data;
      const adminObj: Admin = {
        _id: adminData._id,
        name: adminData.name,
        email: adminData.email,
        role: adminData.role,
        isActive: true,
      };
      
      setAdmin(adminObj);
      setToken(newToken);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ admin: adminObj, token: newToken }));
      // Also set legacy auth for backwards compatibility
      localStorage.setItem('admin-auth', 'true');
      
      return { success: true, message: 'Login successful' };
    } catch (error) {
      return { success: false, message: 'Failed to connect to server' };
    }
  };

  const register = async (
    name: string, 
    email: string, 
    password: string, 
    inviteCode: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, inviteCode }),
      });
      const responseData = await res.json();
      
      if (!res.ok || !responseData.success) {
        return { success: false, message: responseData.message || 'Registration failed' };
      }

      // API returns { success, message, data: { _id, name, email, role, token } }
      const { token: newToken, ...adminData } = responseData.data;
      const adminObj: Admin = {
        _id: adminData._id,
        name: adminData.name,
        email: adminData.email,
        role: adminData.role,
        isActive: true,
      };
      
      setAdmin(adminObj);
      setToken(newToken);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ admin: adminObj, token: newToken }));
      // Also set legacy auth for backwards compatibility
      localStorage.setItem('admin-auth', 'true');
      
      return { success: true, message: 'Registration successful' };
    } catch (error) {
      return { success: false, message: 'Failed to connect to server' };
    }
  };

  const logout = () => {
    setAdmin(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('admin-auth');
  };

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    
    try {
      const res = await fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok && data.data) {
        setAdmin(data.data);
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
            admin: data.data, 
            token: parsed.token 
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch admin profile:', error);
    }
  }, [token]);

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!token) return { success: false, message: 'Not authenticated' };
    
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, message: data.message || 'Failed to change password' };
      }
      
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to connect to server' };
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string; resetToken?: string }> => {
    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, message: data.message || 'Failed to process request' };
      }
      
      // In development, the reset token is returned for testing
      return { 
        success: true, 
        message: data.message,
        resetToken: data.resetToken, // Only available in development
      };
    } catch (error) {
      return { success: false, message: 'Failed to connect to server' };
    }
  };

  const resetPassword = async (email: string, resetToken: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetToken, newPassword }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, message: data.message || 'Failed to reset password' };
      }
      
      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to connect to server' };
    }
  };

  const isAuthenticated = !!admin && !!token;
  const isSuperAdmin = admin?.role === 'super_admin';

  return (
    <AuthContext.Provider 
      value={{ 
        admin,
        token,
        isAuthenticated, 
        isLoading,
        isSuperAdmin,
        login, 
        register,
        logout,
        fetchProfile,
        changePassword,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
