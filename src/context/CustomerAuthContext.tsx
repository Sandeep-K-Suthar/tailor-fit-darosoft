import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface SavedMeasurement {
  _id: string;
  label: string;
  chest?: number;
  waist?: number;
  hips?: number;
  shoulders?: number;
  sleeveLength?: number;
  shirtLength?: number;
  neck?: number;
  inseam?: number;
  thigh?: number;
  isDefault?: boolean;
  createdAt: string;
}

interface SavedDesign {
  _id: string;
  name?: string; // User-defined name for the design
  productId: string;
  productName: string;
  productCategory: string;
  baseImage: string;
  fabric: { id: string; name: string; image: string } | null;
  styles: Record<string, any>;
  measurements: Record<string, any>;
  totalPrice: number;
  savedAt: string;
}

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: Address;
  savedMeasurements?: SavedMeasurement[];
  savedDesigns?: SavedDesign[];
  orderCount?: number;
  createdAt?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  items: any[];
  total: number;
  status: string;
  createdAt: string;
}

interface CustomerAuthContextType {
  customer: Customer | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  orders: Order[];
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfile: (data: Partial<Customer>) => Promise<{ success: boolean; message: string }>;
  fetchOrders: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  saveDesign: (design: Omit<SavedDesign, '_id' | 'savedAt'>) => Promise<{ success: boolean; message: string }>;
  deleteDesign: (id: string) => Promise<{ success: boolean; message: string }>;
  saveMeasurements: (data: Omit<SavedMeasurement, '_id' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
  deleteMeasurements: (id: string) => Promise<{ success: boolean; message: string }>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

const STORAGE_KEY = 'tailor_fit_customer';

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  // Load saved auth on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const { customer: savedCustomer, token: savedToken } = JSON.parse(savedData);
        setCustomer(savedCustomer);
        setToken(savedToken);
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Save auth to localStorage
  const saveAuth = (customer: Customer, token: string) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ customer, token }));
    setCustomer(customer);
    setToken(token);
  };

  // Clear auth
  const clearAuth = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCustomer(null);
    setToken(null);
    setOrders([]);
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/customers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.message || 'Login failed' };
      }

      saveAuth(data.data, data.data.token);
      return { success: true, message: 'Login successful' };
    } catch (error) {
      return { success: false, message: 'Login failed. Please try again.' };
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/customers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.message || 'Registration failed' };
      }

      saveAuth(data.data, data.data.token);
      return { success: true, message: 'Account created successfully' };
    } catch (error) {
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  };

  const logout = () => {
    clearAuth();
  };

  const fetchProfile = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch('/api/customers/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.data) {
        const updatedCustomer = { ...customer, ...data.data };
        setCustomer(updatedCustomer);
        // Also update localStorage with full profile data
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            customer: updatedCustomer,
            token: parsed.token
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  }, [token, customer]);

  const updateProfile = async (updates: Partial<Customer>): Promise<{ success: boolean; message: string }> => {
    if (!token) return { success: false, message: 'Not authenticated' };

    try {
      const res = await fetch('/api/customers/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.message || 'Update failed' };
      }

      setCustomer(prev => prev ? { ...prev, ...data.data } : null);
      return { success: true, message: 'Profile updated' };
    } catch (error) {
      return { success: false, message: 'Update failed. Please try again.' };
    }
  };

  const fetchOrders = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch('/api/customers/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        setOrders(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  }, [token]);

  const saveDesign = async (design: Omit<SavedDesign, '_id' | 'savedAt'>): Promise<{ success: boolean; message: string }> => {
    if (!token) return { success: false, message: 'Please login to save designs' };

    try {
      const res = await fetch('/api/customers/designs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(design),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.message || 'Failed to save design' };
      }

      // Update customer state with new saved designs
      setCustomer(prev => {
        if (!prev) return null;
        const updatedCustomer = { ...prev, savedDesigns: data.data };
        // Also update localStorage
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            customer: updatedCustomer,
            token: parsed.token
          }));
        }
        return updatedCustomer;
      });
      return { success: true, message: 'Design saved to your account' };
    } catch (error) {
      return { success: false, message: 'Failed to save design' };
    }
  };

  const deleteDesign = async (id: string): Promise<{ success: boolean; message: string }> => {
    if (!token) return { success: false, message: 'Not authenticated' };

    try {
      const res = await fetch(`/api/customers/designs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.message || 'Failed to delete design' };
      }

      // Update customer state and localStorage
      setCustomer(prev => {
        if (!prev) return null;
        const updatedCustomer = { ...prev, savedDesigns: data.data };
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            customer: updatedCustomer,
            token: parsed.token
          }));
        }
        return updatedCustomer;
      });
      return { success: true, message: 'Design deleted' };
    } catch (error) {
      return { success: false, message: 'Failed to delete design' };
    }
  };

  const saveMeasurements = async (measurements: Omit<SavedMeasurement, '_id' | 'createdAt'>): Promise<{ success: boolean; message: string }> => {
    if (!token) return { success: false, message: 'Please login to save measurements' };

    try {
      const res = await fetch('/api/customers/measurements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(measurements),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.message || 'Failed to save measurements' };
      }

      // Update customer state with new saved measurements
      setCustomer(prev => {
        if (!prev) return null;
        const updatedCustomer = { ...prev, savedMeasurements: data.data };
        // Also update localStorage
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            customer: updatedCustomer,
            token: parsed.token
          }));
        }
        return updatedCustomer;
      });
      return { success: true, message: 'Measurements saved' };
    } catch (error) {
      return { success: false, message: 'Failed to save measurements' };
    }
  };

  const deleteMeasurements = async (id: string): Promise<{ success: boolean; message: string }> => {
    if (!token) return { success: false, message: 'Not authenticated' };

    try {
      const res = await fetch(`/api/customers/measurements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.message || 'Failed to delete measurements' };
      }

      // Update customer state and localStorage
      setCustomer(prev => {
        if (!prev) return null;
        const updatedCustomer = { ...prev, savedMeasurements: data.data };
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            customer: updatedCustomer,
            token: parsed.token
          }));
        }
        return updatedCustomer;
      });
      return { success: true, message: 'Measurements deleted' };
    } catch (error) {
      return { success: false, message: 'Failed to delete measurements' };
    }
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        token,
        isAuthenticated: !!customer && !!token,
        isLoading,
        orders,
        login,
        register,
        logout,
        updateProfile,
        fetchOrders,
        fetchProfile,
        saveDesign,
        deleteDesign,
        saveMeasurements,
        deleteMeasurements,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}
