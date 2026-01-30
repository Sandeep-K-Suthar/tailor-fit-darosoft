import React, { useEffect, useState, useRef } from 'react';
import { useCustomization as useShirt } from '@/context/CustomizationContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Scissors, LogOut, Plus, Trash2, Edit, Upload, Layers,
  Shirt, Square, PanelTop, Disc, ArrowLeftRight, LayoutDashboard,
  Menu, X, Home, Package, ChevronRight, Search, ShoppingCart, Eye, Clock, CheckCircle2, Truck,
  Users, Shield, KeyRound, UserCog, Ban, CheckCircle, Mail, Phone, Sparkles, Palette
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { FabricOption, CustomizationOption } from '@/types/shirt';
import { Product } from '@/types/product';
import type { Fabric3D, FabricCategory } from '@/types/fabric';
import { FABRIC_CATEGORIES } from '@/types/fabric';
import { Box } from 'lucide-react';

interface CustomerData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: { street?: string; city?: string; state?: string; postalCode?: string };
  savedDesigns?: any[];
  savedMeasurements?: any[];
  orderCount?: number;
  createdAt: string;
}

interface AdminData {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export function AdminDashboard() {
  const { logout, admin, token, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const {
    fabrics, collars, cuffs, pockets, buttons, sleeves, plackets, backs, neckties, bowties,
    addFabric, addCustomization, removeFabric, removeCustomization,
    updateFabric, updateCustomization,
  } = useShirt();
  // State for active tab (synced with URL)
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'orders';

  useEffect(() => {
    console.log('AdminDashboard: activeTab changed to:', activeTab);
    console.log('AdminDashboard: URL Search Params:', searchParams.toString());
  }, [activeTab, searchParams]);

  const setActiveTab = (tab: string) => {
    console.log('AdminDashboard: Setting active tab to:', tab);
    setSearchParams({ tab });
  };
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState('');
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [productForm, setProductForm] = useState<any>({
    _id: '', name: '', description: '', category: 'shirt', basePrice: 0,
    images: { baseImage: '', backImage: '', thumbnailImage: '' },
    customizationOptions: { fabrics: [], optionGroups: [] },
  });

  // Customer management state
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [newCustomerPassword, setNewCustomerPassword] = useState('');

  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  const [advancedConfigJson, setAdvancedConfigJson] = useState('');

  // Admin management state
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);

  // 3D Fabrics state
  const [fabrics3D, setFabrics3D] = useState<Fabric3D[]>([]);
  const [fabrics3DLoading, setFabrics3DLoading] = useState(false);
  const [is3DFabricDialogOpen, setIs3DFabricDialogOpen] = useState(false);
  const [editing3DFabric, setEditing3DFabric] = useState<Fabric3D | null>(null);
  const [fabric3DForm, setFabric3DForm] = useState({
    name: '',
    category: 'cotton' as FabricCategory,
    colorMapUrl: '',
    normalMapUrl: '',
    roughnessMapUrl: '',
    baseColor: '#FFFFFF',
    roughness: 0.8,
    metalness: 0.0,
    normalScale: 1.0,
    price: 0,
  });

  const [newName, setNewName] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newPreviewImage, setNewPreviewImage] = useState('');
  const [newFabricPreviews, setNewFabricPreviews] = useState<Record<string, string>>({});
  const [newBackFabricHalfPreviews, setNewBackFabricHalfPreviews] = useState<Record<string, string>>({});
  const [newBackFabricFullPreviews, setNewBackFabricFullPreviews] = useState<Record<string, string>>({});
  const [newCategory, setNewCategory] = useState<string>('collar');
  const [newColors, setNewColors] = useState<string[]>(['#FFFFFF']);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);
  const fabricPreviewRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const fabricBackHalfRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const fabricBackFullRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const productBaseRef = useRef<HTMLInputElement>(null);
  const productBackRef = useRef<HTMLInputElement>(null);
  const productThumbRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/admin');
    toast.success('Logged out successfully');
  };

  const productCategories = [
    { id: 'shirt', label: 'Dress Shirts' },
    { id: 'suit', label: 'Suits' },
    { id: 'pants', label: 'Dress Pants' },
    { id: 'blazer', label: 'Blazers' },
    { id: 'vest', label: 'Vests' },
    { id: 'tuxedo', label: 'Tuxedos' },
  ];

  const allCategories = [
    { id: 'orders', label: 'Orders', icon: ShoppingCart, items: orders },
    { id: 'products', label: 'Products', icon: Package, items: products },
    { id: '3d-fabrics', label: '3D Fabrics', icon: Box, items: fabrics3D },
    { id: 'customers', label: 'Customers', icon: Users, items: customers },
    ...(isSuperAdmin ? [{ id: 'admins', label: 'Admins', icon: Shield, items: admins }] : []),
  ];

  // Organize menu items based on access
  const getGroupedCategories = () => {
    if (isSuperAdmin) {
      return {
        group1: allCategories.filter(c => c.id === 'customers' || c.id === 'admins'),
        group2: allCategories.filter(c => c.id === 'orders' || c.id === 'products' || c.id === '3d-fabrics'),
        group3: allCategories.filter(c => !['customers', 'admins', 'orders', 'products', '3d-fabrics'].includes(c.id)),
      };
    } else {
      return {
        group1: allCategories.filter(c => c.id === 'orders' || c.id === 'products' || c.id === '3d-fabrics'),
        group2: [],
      };
    }
  };

  const categories = allCategories; // Backwards compatible

  const fetchProducts = async () => {
    setProductsLoading(true);
    setProductsError('');
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data.data || []);
    } catch (err: any) {
      setProductsError(err.message || 'Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    if (!token || token === 'legacy-token') {
      // Silently skip - not authenticated properly
      return;
    }
    setCustomersLoading(true);
    try {
      const res = await fetch('/api/admin/customers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load customers');
      const data = await res.json();
      setCustomers(data.data || []);
    } catch (err: any) {
      console.error('[Admin] fetchCustomers error:', err.message);
      // Silently fail - no toast to avoid spam
    } finally {
      setCustomersLoading(false);
    }
  };

  const fetchAdmins = async () => {
    if (!token || token === 'legacy-token' || !isSuperAdmin) {
      // Silently skip - not super admin
      return;
    }
    setAdminsLoading(true);
    try {
      const res = await fetch('/api/admin/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load admins');
      const data = await res.json();
      setAdmins(data.data || []);
    } catch (err: any) {
      console.error('[Admin] fetchAdmins error:', err.message);
      // Silently fail - no toast to avoid spam
    } finally {
      setAdminsLoading(false);
    }
  };

  // Fetch 3D Fabrics
  const fetch3DFabrics = async () => {
    setFabrics3DLoading(true);
    try {
      const res = await fetch('/api/fabrics');
      if (!res.ok) throw new Error('Failed to load 3D fabrics');
      const data = await res.json();
      setFabrics3D(data.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load 3D fabrics');
    } finally {
      setFabrics3DLoading(false);
    }
  };

  // 3D Fabric CRUD
  const reset3DFabricForm = () => {
    setFabric3DForm({
      name: '',
      category: 'cotton',
      colorMapUrl: '',
      normalMapUrl: '',
      roughnessMapUrl: '',
      baseColor: '#FFFFFF',
      roughness: 0.8,
      metalness: 0.0,
      normalScale: 1.0,
      price: 0,
    });
    setEditing3DFabric(null);
  };

  const open3DFabricDialog = (fabric?: Fabric3D) => {
    if (fabric) {
      setEditing3DFabric(fabric);
      setFabric3DForm({
        name: fabric.name,
        category: fabric.category,
        colorMapUrl: fabric.colorMapUrl,
        normalMapUrl: fabric.normalMapUrl || '',
        roughnessMapUrl: fabric.roughnessMapUrl || '',
        baseColor: fabric.baseColor,
        roughness: fabric.roughness,
        metalness: fabric.metalness,
        normalScale: fabric.normalScale,
        price: fabric.price,
      });
    } else {
      reset3DFabricForm();
    }
    setIs3DFabricDialogOpen(true);
  };

  const handle3DFabricTextureUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'colorMapUrl' | 'normalMapUrl' | 'roughnessMapUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const path = await uploadFile(file);
    if (path) setFabric3DForm(prev => ({ ...prev, [field]: path }));
  };

  const save3DFabric = async () => {
    if (!fabric3DForm.name || !fabric3DForm.colorMapUrl) {
      toast.error('Name and Color Map are required');
      return;
    }
    try {
      const method = editing3DFabric ? 'PUT' : 'POST';
      const url = editing3DFabric ? `/api/fabrics/${editing3DFabric._id}` : '/api/fabrics';

      // For new fabrics, we need to use FormData
      if (!editing3DFabric) {
        // Note: The API expects FormData for POST, but we've already uploaded textures
        // So we'll just send JSON with the paths
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...fabric3DForm,
            price: Number(fabric3DForm.price),
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to save fabric');
        }
      } else {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...fabric3DForm,
            price: Number(fabric3DForm.price),
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to save fabric');
        }
      }

      toast.success(editing3DFabric ? '3D Fabric updated' : '3D Fabric added');
      setIs3DFabricDialogOpen(false);
      reset3DFabricForm();
      fetch3DFabrics();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const delete3DFabric = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fabric?')) return;
    try {
      const res = await fetch(`/api/fabrics/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete fabric');
      toast.success('3D Fabric deleted');
      fetch3DFabrics();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const resetCustomerPassword = async (customerId: string, newPassword: string) => {
    if (!token || token === 'legacy-token') {
      toast.error('Admin authentication required');
      return;
    }
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password');
      toast.success('Customer password reset successfully');
      setNewCustomerPassword('');
      setIsCustomerDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleAdminStatus = async (adminId: string, activate: boolean) => {
    if (!token || token === 'legacy-token') {
      toast.error('Admin authentication required');
      return;
    }
    try {
      const endpoint = activate ? 'activate' : 'deactivate';
      const res = await fetch(`/api/admin/${adminId}/${endpoint}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Failed to ${endpoint} admin`);
      toast.success(`Admin ${activate ? 'activated' : 'deactivated'} successfully`);
      fetchAdmins();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const [activeVariantOption, setActiveVariantOption] = useState<{ gi: number; oi: number } | null>(null);

  // Fetch initial stats
  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetch3DFabrics();
    if (isSuperAdmin) {
      fetchCustomers();
      fetchAdmins();
    }
  }, [token, isSuperAdmin]);

  useEffect(() => {
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === '3d-fabrics') fetch3DFabrics();
    if (activeTab === 'customers') fetchCustomers();
    if (activeTab === 'admins') fetchAdmins();
  }, [activeTab, token, isSuperAdmin]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    setOrdersError('');
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(data.data || []);
    } catch (err: any) {
      setOrdersError(err.message || 'Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleGroupOptionVariantUpload = async (groupIndex: number, optionIndex: number, fabricId: string, view: 'front' | 'back', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const imageUrl = data.path;

      setProductForm((prev: any) => {
        // Deep copy the structure to ensure immutability
        const groups = [...(prev.customizationOptions?.optionGroups || [])];
        const group = { ...groups[groupIndex] };
        const options = [...(group.options || [])];
        const option = { ...options[optionIndex] };

        // Ensure layersByFabric is a new object
        const existingLayers = option.layersByFabric || {};
        const newLayers = { ...existingLayers };

        // Handle legacy string format if exists
        const currentFabricLayer = typeof newLayers[fabricId] === 'string'
          ? { front: newLayers[fabricId] }
          : { ...newLayers[fabricId] };

        // Update specific key
        newLayers[fabricId] = {
          ...currentFabricLayer,
          [view]: imageUrl
        };

        // Reassign back up the tree
        option.layersByFabric = newLayers;
        options[optionIndex] = option;
        group.options = options;
        groups[groupIndex] = group;

        return {
          ...prev,
          customizationOptions: {
            ...prev.customizationOptions,
            optionGroups: groups
          }
        };
      });

      toast.success(`${view === 'front' ? 'Front' : 'Back'} variant uploaded`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast.success('Order status updated');
      fetchOrders();
      setIsOrderDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_production: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      shipped: 'bg-cyan-100 text-cyan-800',
      delivered: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const orderStatuses = ['pending', 'confirmed', 'in_production', 'ready', 'shipped', 'delivered', 'cancelled'];

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      return data.path;
    } catch (err) {
      toast.error('Upload failed');
      return null;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isPreview = false, fabricId?: string, variant?: 'half' | 'full') => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const path = await uploadFile(file);
    if (!path) return;
    if (fabricId && variant === 'half') setNewBackFabricHalfPreviews(prev => ({ ...prev, [fabricId]: path }));
    else if (fabricId && variant === 'full') setNewBackFabricFullPreviews(prev => ({ ...prev, [fabricId]: path }));
    else if (fabricId) setNewFabricPreviews(prev => ({ ...prev, [fabricId]: path }));
    else if (isPreview) setNewPreviewImage(path);
    else setNewImage(path);
  };

  const resetForm = () => {
    setNewName(''); setNewImage(''); setNewPreviewImage('');
    setNewFabricPreviews({}); setNewBackFabricHalfPreviews({}); setNewBackFabricFullPreviews({});
    setNewColors(['#FFFFFF']); setEditingItem(null);
  };

  const resetProductForm = () => {
    setProductForm({
      _id: '', name: '', description: '', category: 'shirt', basePrice: 0,
      images: { baseImage: '', backImage: '', thumbnailImage: '' },
      customizationOptions: { fabrics: [], optionGroups: [] },
    });
  };

  const handleOpenProductDialog = (product?: Product) => {
    if (product) {
      setProductForm({
        ...product,
        customizationOptions: {
          fabrics: product.customizationOptions?.fabrics || [],
          optionGroups: product.customizationOptions?.optionGroups || [],
        },
      });
      // Initialize advanced config JSON
      setAdvancedConfigJson(JSON.stringify(product.customizationOptions?.optionGroups || [], null, 2));
    } else {
      resetProductForm();
      setAdvancedConfigJson('[]');
    }
    setShowAdvancedConfig(false);
    setIsProductDialogOpen(true);
  };


  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'baseImage' | 'backImage' | 'thumbnailImage') => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const path = await uploadFile(file);
    if (path) setProductForm((prev: any) => ({ ...prev, images: { ...prev.images, [field]: path } }));
  };

  const handleProductSave = async () => {
    if (!productForm.name || !productForm.description) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      let payload = { ...productForm, basePrice: Number(productForm.basePrice || 0) };

      // If advanced config is open, try to parse JSON and use that for optionGroups
      if (showAdvancedConfig) {
        try {
          const parsedGroups = JSON.parse(advancedConfigJson);
          payload.customizationOptions.optionGroups = parsedGroups;
        } catch (e) {
          toast.error('Invalid JSON in Advanced Config');
          return;
        }
      }

      const res = await fetch(productForm._id ? `/api/products/${productForm._id}` : '/api/products', {
        method: productForm._id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save product');
      toast.success(productForm._id ? 'Product updated' : 'Product created');
      setIsProductDialogOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save product');
    }
  };

  const handleProductDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Product deleted');
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const addProductFabric = () => {
    setProductForm((prev: any) => ({
      ...prev,
      customizationOptions: {
        ...prev.customizationOptions,
        fabrics: [...(prev.customizationOptions?.fabrics || []), { id: `f${Date.now()}`, name: 'New Fabric', imageUrl: '', previewImage: '', priceModifier: 0, order: (prev.customizationOptions?.fabrics || []).length }],
      },
    }));
  };

  const updateProductFabric = (index: number, field: string, value: any) => {
    setProductForm((prev: any) => {
      const updated = [...(prev.customizationOptions?.fabrics || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, customizationOptions: { ...prev.customizationOptions, fabrics: updated } };
    });
  };

  const removeProductFabric = (index: number) => {
    setProductForm((prev: any) => {
      const updated = [...(prev.customizationOptions?.fabrics || [])];
      updated.splice(index, 1);
      return { ...prev, customizationOptions: { ...prev.customizationOptions, fabrics: updated } };
    });
  };

  const addOptionGroup = () => {
    setProductForm((prev: any) => ({
      ...prev,
      customizationOptions: {
        ...prev.customizationOptions,
        optionGroups: [...(prev.customizationOptions?.optionGroups || []), { id: `g${Date.now()}`, label: 'New Group', category: 'fit', order: (prev.customizationOptions?.optionGroups || []).length, options: [] }],
      },
    }));
  };

  const updateOptionGroup = (index: number, field: string, value: any) => {
    setProductForm((prev: any) => {
      const updated = [...(prev.customizationOptions?.optionGroups || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, customizationOptions: { ...prev.customizationOptions, optionGroups: updated } };
    });
  };

  const removeOptionGroup = (index: number) => {
    setProductForm((prev: any) => {
      const updated = [...(prev.customizationOptions?.optionGroups || [])];
      updated.splice(index, 1);
      return { ...prev, customizationOptions: { ...prev.customizationOptions, optionGroups: updated } };
    });
  };

  const addGroupOption = (groupIndex: number) => {
    setProductForm((prev: any) => {
      const groups = [...(prev.customizationOptions?.optionGroups || [])];
      const group = groups[groupIndex];
      groups[groupIndex] = { ...group, options: [...(group.options || []), { id: `o${Date.now()}`, name: 'New Option', category: group.category, image: '', previewImage: '', priceModifier: 0, order: (group.options || []).length, isDefault: false }] };
      return { ...prev, customizationOptions: { ...prev.customizationOptions, optionGroups: groups } };
    });
  };

  const updateGroupOption = (groupIndex: number, optionIndex: number, field: string, value: any) => {
    setProductForm((prev: any) => {
      const groups = [...(prev.customizationOptions?.optionGroups || [])];
      const group = groups[groupIndex];
      const options = [...(group.options || [])];
      options[optionIndex] = { ...options[optionIndex], [field]: value };
      groups[groupIndex] = { ...group, options };
      return { ...prev, customizationOptions: { ...prev.customizationOptions, optionGroups: groups } };
    });
  };

  const removeGroupOption = (groupIndex: number, optionIndex: number) => {
    setProductForm((prev: any) => {
      const groups = [...(prev.customizationOptions?.optionGroups || [])];
      const group = groups[groupIndex];
      const options = [...(group.options || [])];
      options.splice(optionIndex, 1);
      groups[groupIndex] = { ...group, options };
      return { ...prev, customizationOptions: { ...prev.customizationOptions, optionGroups: groups } };
    });
  };

  const handleGroupOptionImageUpload = async (groupIndex: number, optionIndex: number, field: 'image' | 'previewImage', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const path = await uploadFile(file);
    if (path) updateGroupOption(groupIndex, optionIndex, field, path);
  };

  const handleProductFabricImageUpload = async (index: number, field: 'imageUrl' | 'previewImage' | 'backPreviewImage', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const path = await uploadFile(file);
    if (path) updateProductFabric(index, field, path);
  };

  const handleOpenAddDialog = () => { resetForm(); setIsAddDialogOpen(true); };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setNewName(item.name);
    setNewImage(item.image);
    setNewPreviewImage(item.previewImage || '');
    setNewFabricPreviews(item.fabricPreviewImages || {});
    setNewBackFabricHalfPreviews(item.backHalfFabricPreviewImages || {});
    setNewBackFabricFullPreviews(item.backFullFabricPreviewImages || {});
    if (activeTab === 'fabrics') setNewColors(item.colors || ['#FFFFFF']);
    else setNewCategory(item.category);
    setIsAddDialogOpen(true);
  };

  const handleSaveItem = () => {
    if (!newName || !newImage) { toast.error('Please fill all required fields'); return; }
    if (editingItem) {
      if (activeTab === 'fabrics') {
        updateFabric(editingItem.id, { name: newName, image: newImage, previewImage: newPreviewImage || undefined, colors: newColors });
        toast.success('Fabric updated');
      } else {
        updateCustomization(editingItem.id, editingItem.category, { name: newName, image: newImage, previewImage: newPreviewImage || undefined, fabricPreviewImages: newFabricPreviews, backHalfFabricPreviewImages: newBackFabricHalfPreviews, backFullFabricPreviewImages: newBackFabricFullPreviews, category: newCategory as any });
        toast.success('Option updated');
      }
    } else {
      if (activeTab === 'fabrics') {
        addFabric({ id: `f${Date.now()}`, name: newName, image: newImage, previewImage: newPreviewImage || undefined, colors: newColors });
        toast.success('Fabric added');
      } else {
        addCustomization({ id: `${newCategory[0]}${Date.now()}`, name: newName, image: newImage, previewImage: newPreviewImage || undefined, fabricPreviewImages: newFabricPreviews, backHalfFabricPreviewImages: newBackFabricHalfPreviews, backFullFabricPreviewImages: newBackFabricFullPreviews, category: newCategory as any });
        toast.success('Option added');
      }
    }
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleDelete = (id: string, category?: string) => {
    if (activeTab === 'fabrics') { removeFabric(id); toast.success('Fabric removed'); }
    else if (category) { removeCustomization(id, category); toast.success('Option removed'); }
  };

  const getCurrentItems = () => {
    const cat = categories.find(c => c.id === activeTab);
    const items = cat?.items || [];
    if (!searchTerm) return items;
    return items.filter((item: any) => item.name?.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const addColor = () => setNewColors([...newColors, '#FFFFFF']);
  const updateColor = (i: number, c: string) => { const u = [...newColors]; u[i] = c; setNewColors(u); };
  const removeColor = (i: number) => setNewColors(newColors.filter((_, idx) => idx !== i));

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-primary py-3 px-4 shadow-elevated">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-accent shadow-glow">
              <Scissors className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-white">Tailor Fit</h1>
              <p className="text-[11px] font-medium text-white/60">Admin Dashboard</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-72 bg-primary flex flex-col z-50 transition-transform duration-500 ease-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="h-20 flex items-center gap-3 px-6 border-b border-white/10">
          <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center shadow-glow">
            <Scissors className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold text-white">Tailor Fit</h1>
            <p className="text-xs text-white/60">Admin Dashboard</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/40">Management</p>
          {(() => {
            const grouped = getGroupedCategories();
            if (isSuperAdmin) {
              return (
                <>
                  {/* Group 1: Admin & Customers */}
                  <div className="space-y-1">
                    {grouped.group1.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { setActiveTab(cat.id); setIsSidebarOpen(false); setSearchTerm(''); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === cat.id
                          ? 'bg-accent text-primary shadow-glow'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                      >
                        <cat.icon className="w-5 h-5" />
                        <span className="flex-1 text-left">{cat.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === cat.id ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white/60'}`}>
                          {cat.items.length}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Spacing */}
                  <div className="h-2" />

                  {/* Group 2: Orders & Products */}
                  <div className="space-y-1">
                    {grouped.group2.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { setActiveTab(cat.id); setIsSidebarOpen(false); setSearchTerm(''); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === cat.id
                          ? 'bg-accent text-primary shadow-glow'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                      >
                        <cat.icon className="w-5 h-5" />
                        <span className="flex-1 text-left">{cat.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === cat.id ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white/60'}`}>
                          {cat.items.length}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Spacing */}
                  <div className="h-2" />

                  {/* Group 3: All Other Items */}
                  <div className="space-y-1">
                    {grouped.group3.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { setActiveTab(cat.id); setIsSidebarOpen(false); setSearchTerm(''); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === cat.id
                          ? 'bg-accent text-primary shadow-glow'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                      >
                        <cat.icon className="w-5 h-5" />
                        <span className="flex-1 text-left">{cat.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === cat.id ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white/60'}`}>
                          {cat.items.length}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              );
            } else {
              return (
                <>
                  {/* Group 1: Orders & Products */}
                  <div className="space-y-1">
                    {grouped.group1.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { setActiveTab(cat.id); setIsSidebarOpen(false); setSearchTerm(''); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === cat.id
                          ? 'bg-accent text-primary shadow-glow'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                      >
                        <cat.icon className="w-5 h-5" />
                        <span className="flex-1 text-left">{cat.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === cat.id ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white/60'}`}>
                          {cat.items.length}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Spacing */}
                  <div className="h-2" />

                  {/* Group 2: All Other Items */}
                  <div className="space-y-1">
                    {grouped.group2.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { setActiveTab(cat.id); setIsSidebarOpen(false); setSearchTerm(''); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === cat.id
                          ? 'bg-accent text-primary shadow-glow'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                      >
                        <cat.icon className="w-5 h-5" />
                        <span className="flex-1 text-left">{cat.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === cat.id ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white/60'}`}>
                          {cat.items.length}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              );
            }
          })()}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 space-y-2">
          {/* Admin Info */}
          {admin && (
            <div className="mb-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isSuperAdmin ? 'bg-amber-500/20' : 'bg-accent/20'}`}>
                  <Shield className={`w-4 h-4 ${isSuperAdmin ? 'text-amber-400' : 'text-accent'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{admin.name}</p>
                  <p className="text-xs text-white/50 truncate">{admin.email}</p>
                </div>
              </div>
              {isSuperAdmin && (
                <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400">
                  Super Admin
                </span>
              )}
            </div>
          )}
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all">
            <Home className="w-5 h-5" />
            View Site
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen pt-20 lg:pt-0">
        {/* Top Header Bar */}
        <div className="bg-white border-b border-border/50 px-6 lg:px-10 py-6">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span>Dashboard</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground font-medium">{categories.find(c => c.id === activeTab)?.label}</span>
              </div>
              <h1 className="font-display text-3xl lg:text-4xl font-semibold text-foreground">
                Manage {categories.find(c => c.id === activeTab)?.label}
              </h1>
              <p className="text-muted-foreground mt-1">
                {activeTab === 'products' ? 'Create and manage your product catalog' : `Add, edit, or remove ${activeTab} options`}
              </p>
            </div>

            <div className="flex gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 w-48 lg:w-64 pl-11 pr-4 rounded-xl bg-muted/50 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Add Button */}
              {activeTab === 'orders' ? (
                <Button onClick={fetchOrders} variant="outline" className="h-12 px-6 rounded-xl">
                  Refresh Orders
                </Button>
              ) : activeTab === 'customers' ? (
                <Button onClick={fetchCustomers} variant="outline" className="h-12 px-6 rounded-xl">
                  Refresh Customers
                </Button>
              ) : activeTab === 'admins' ? (
                <Button onClick={fetchAdmins} variant="outline" className="h-12 px-6 rounded-xl">
                  Refresh Admins
                </Button>
              ) : activeTab === '3d-fabrics' ? (
                <Dialog open={is3DFabricDialogOpen} onOpenChange={setIs3DFabricDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => open3DFabricDialog()} className="h-12 px-6 rounded-xl bg-gradient-luxury text-white shadow-soft hover:shadow-elevated transition-all">
                      <Plus className="w-4 h-4 mr-2" />
                      Add 3D Fabric
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-display text-xl">{editing3DFabric ? 'Edit 3D Fabric' : 'Add New 3D Fabric'}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                      {/* Basic Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Fabric Name *</Label>
                          <Input
                            value={fabric3DForm.name}
                            onChange={(e) => setFabric3DForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Navy Blue Cotton"
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Category *</Label>
                          <Select value={fabric3DForm.category} onValueChange={(v: FabricCategory) => setFabric3DForm(prev => ({ ...prev, category: v }))}>
                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {FABRIC_CATEGORIES.map(c => (
                                <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* PBR Textures */}
                      <div className="space-y-4">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <Layers className="w-4 h-4" /> PBR Texture Maps
                        </Label>
                        <div className="grid grid-cols-3 gap-4">
                          {/* Color Map */}
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Color Map *</Label>
                            <input id="colorMap3D" type="file" accept="image/*" onChange={(e) => handle3DFabricTextureUpload(e, 'colorMapUrl')} className="hidden" />
                            <Button variant="outline" className="w-full h-24 rounded-xl flex flex-col gap-2" onClick={() => document.getElementById('colorMap3D')?.click()}>
                              {fabric3DForm.colorMapUrl ? (
                                <img src={fabric3DForm.colorMapUrl} alt="" className="w-16 h-16 object-cover rounded-lg" />
                              ) : (
                                <>
                                  <Upload className="w-5 h-5" />
                                  <span className="text-xs">Color</span>
                                </>
                              )}
                            </Button>
                          </div>
                          {/* Normal Map */}
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Normal Map</Label>
                            <input id="normalMap3D" type="file" accept="image/*" onChange={(e) => handle3DFabricTextureUpload(e, 'normalMapUrl')} className="hidden" />
                            <Button variant="outline" className="w-full h-24 rounded-xl flex flex-col gap-2" onClick={() => document.getElementById('normalMap3D')?.click()}>
                              {fabric3DForm.normalMapUrl ? (
                                <img src={fabric3DForm.normalMapUrl} alt="" className="w-16 h-16 object-cover rounded-lg" />
                              ) : (
                                <>
                                  <Upload className="w-5 h-5" />
                                  <span className="text-xs">Normal</span>
                                </>
                              )}
                            </Button>
                          </div>
                          {/* Roughness Map */}
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Roughness Map</Label>
                            <input id="roughnessMap3D" type="file" accept="image/*" onChange={(e) => handle3DFabricTextureUpload(e, 'roughnessMapUrl')} className="hidden" />
                            <Button variant="outline" className="w-full h-24 rounded-xl flex flex-col gap-2" onClick={() => document.getElementById('roughnessMap3D')?.click()}>
                              {fabric3DForm.roughnessMapUrl ? (
                                <img src={fabric3DForm.roughnessMapUrl} alt="" className="w-16 h-16 object-cover rounded-lg" />
                              ) : (
                                <>
                                  <Upload className="w-5 h-5" />
                                  <span className="text-xs">Roughness</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Material Properties */}
                      <div className="space-y-4">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <Sparkles className="w-4 h-4" /> Material Properties
                        </Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Base Color</Label>
                            <div className="flex gap-2 items-center">
                              <input
                                type="color"
                                value={fabric3DForm.baseColor}
                                onChange={(e) => setFabric3DForm(prev => ({ ...prev, baseColor: e.target.value }))}
                                className="w-10 h-10 rounded-lg border cursor-pointer"
                              />
                              <Input
                                value={fabric3DForm.baseColor}
                                onChange={(e) => setFabric3DForm(prev => ({ ...prev, baseColor: e.target.value }))}
                                className="flex-1 rounded-xl"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Price (PKR) *</Label>
                            <Input
                              type="number"
                              value={fabric3DForm.price}
                              onChange={(e) => setFabric3DForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                              className="rounded-xl"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Roughness (0-1)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="1"
                              value={fabric3DForm.roughness}
                              onChange={(e) => setFabric3DForm(prev => ({ ...prev, roughness: Number(e.target.value) }))}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Metalness (0-1)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="1"
                              value={fabric3DForm.metalness}
                              onChange={(e) => setFabric3DForm(prev => ({ ...prev, metalness: Number(e.target.value) }))}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Normal Scale (0-2)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="2"
                              value={fabric3DForm.normalScale}
                              onChange={(e) => setFabric3DForm(prev => ({ ...prev, normalScale: Number(e.target.value) }))}
                              className="rounded-xl"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIs3DFabricDialogOpen(false)} className="rounded-xl">Cancel</Button>
                      <Button onClick={save3DFabric} className="rounded-xl bg-gradient-luxury text-white">
                        {editing3DFabric ? 'Update Fabric' : 'Add Fabric'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : activeTab === 'products' ? (
                <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleOpenProductDialog()} className="h-12 px-6 rounded-xl bg-gradient-luxury text-white shadow-soft hover:shadow-elevated transition-all">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-display text-xl">{productForm._id ? 'Edit Product' : 'New Product'}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-4">
                          <TabsTrigger value="general">General</TabsTrigger>
                          <TabsTrigger value="fabrics">Fabrics</TabsTrigger>
                          <TabsTrigger value="options">Options</TabsTrigger>
                          <TabsTrigger value="advanced">Advanced</TabsTrigger>
                        </TabsList>

                        <div className="h-[60vh] overflow-y-auto px-1 pr-2">
                          {/* General Tab */}
                          <TabsContent value="general" className="space-y-4">
                            <div className="space-y-2">
                              <Label>Product Name</Label>
                              <Input value={productForm.name} onChange={(e) => setProductForm((p: any) => ({ ...p, name: e.target.value }))} placeholder="Product Name" className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Input value={productForm.description} onChange={(e) => setProductForm((p: any) => ({ ...p, description: e.target.value }))} placeholder="Description" className="rounded-xl" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={productForm.category} onValueChange={(v) => setProductForm((p: any) => ({ ...p, category: v }))}>
                                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {productCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Base Price (PKR)</Label>
                                <Input type="number" value={productForm.basePrice} onChange={(e) => setProductForm((p: any) => ({ ...p, basePrice: e.target.value }))} className="rounded-xl" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Base Image (Default)</Label>
                              <input ref={productBaseRef} type="file" accept="image/*" onChange={(e) => handleProductImageUpload(e, 'baseImage')} className="hidden" />
                              <Button variant="outline" className="w-full rounded-xl" onClick={() => productBaseRef.current?.click()}>
                                <Upload className="w-4 h-4 mr-2" />Upload Base Image
                              </Button>
                              {productForm.images?.baseImage && <img src={productForm.images.baseImage} alt="" className="h-40 w-full object-contain rounded-lg mt-2 bg-muted/20 p-2" />}
                            </div>
                          </TabsContent>

                          {/* Fabrics Tab */}
                          <TabsContent value="fabrics" className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <Label className="text-base font-semibold">Product Fabrics</Label>
                                <p className="text-xs text-muted-foreground">Upload <strong>Seamless Pattern Tiles</strong> for dynamic tinting.</p>
                              </div>
                              <Button variant="outline" size="sm" onClick={addProductFabric} className="rounded-lg"><Plus className="w-3 h-3 mr-1" />Add Fabric</Button>
                            </div>
                            <div className="space-y-3">
                              {(productForm.customizationOptions?.fabrics || []).map((fabric: any, i: number) => (
                                <div key={fabric.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-white rounded-xl border border-border/50 items-center">
                                  <div className="md:col-span-4">
                                    <Label className="text-xs text-muted-foreground mb-1 block">Name</Label>
                                    <Input value={fabric.name || ''} onChange={(e) => updateProductFabric(i, 'name', e.target.value)} placeholder="Name" className="h-9 rounded-lg" />
                                  </div>
                                  <div className="md:col-span-4 space-y-2">
                                    {/* Pattern Tile */}
                                    <div>
                                      <Label className="text-xs text-muted-foreground mb-1 block">Pattern Tile</Label>
                                      <div className="flex gap-2 items-center">
                                        <input id={`pf-img-${i}`} type="file" accept="image/*" onChange={(e) => handleProductFabricImageUpload(i, 'imageUrl', e)} className="hidden" />
                                        <Button variant="outline" size="sm" className="flex-1 h-9 rounded-lg" onClick={() => document.getElementById(`pf-img-${i}`)?.click()}>
                                          <Upload className="w-3 h-3 mr-1" />Tile
                                        </Button>
                                        <div className="w-9 h-9 border rounded-lg overflow-hidden bg-muted shadow-sm shrink-0">
                                          {fabric.imageUrl && <img src={fabric.imageUrl} alt="" className="w-full h-full object-cover" />}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Front Preview */}
                                    <div>
                                      <Label className="text-xs text-muted-foreground mb-1 block">Base Front</Label>
                                      <div className="flex gap-2 items-center">
                                        <input id={`pf-prev-${i}`} type="file" accept="image/*" onChange={(e) => handleProductFabricImageUpload(i, 'previewImage', e)} className="hidden" />
                                        <Button variant="outline" size="sm" className="flex-1 h-9 rounded-lg" onClick={() => document.getElementById(`pf-prev-${i}`)?.click()}>
                                          <Upload className="w-3 h-3 mr-1" />Front
                                        </Button>
                                        <div className="w-9 h-9 border rounded-lg overflow-hidden bg-muted shadow-sm shrink-0">
                                          {fabric.previewImage && <img src={fabric.previewImage} alt="" className="w-full h-full object-contain" />}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Back Preview */}
                                    <div>
                                      <Label className="text-xs text-muted-foreground mb-1 block">Base Back</Label>
                                      <div className="flex gap-2 items-center">
                                        <input id={`pf-back-${i}`} type="file" accept="image/*" onChange={(e) => handleProductFabricImageUpload(i, 'backPreviewImage', e)} className="hidden" />
                                        <Button variant="outline" size="sm" className="flex-1 h-9 rounded-lg" onClick={() => document.getElementById(`pf-back-${i}`)?.click()}>
                                          <Upload className="w-3 h-3 mr-1" />Back
                                        </Button>
                                        <div className="w-9 h-9 border rounded-lg overflow-hidden bg-muted shadow-sm shrink-0">
                                          {fabric.backPreviewImage && <img src={fabric.backPreviewImage} alt="" className="w-full h-full object-contain" />}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="md:col-span-3">
                                    <Label className="text-xs text-muted-foreground mb-1 block">Price (+PKR)</Label>
                                    <Input type="number" value={fabric.priceModifier || 0} onChange={(e) => updateProductFabric(i, 'priceModifier', Number(e.target.value))} className="h-9 rounded-lg" />
                                  </div>
                                  <div className="md:col-span-1 flex items-end justify-center">
                                    <Button variant="ghost" size="icon" onClick={() => removeProductFabric(i)} className="rounded-lg text-destructive hover:bg-destructive/10 h-9 w-9"><Trash2 className="w-4 h-4" /></Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TabsContent>

                          {/* Options Tab */}
                          <TabsContent value="options" className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <Label className="text-base font-semibold">Customization Groups</Label>
                                <p className="text-xs text-muted-foreground">Collars, Cuffs, Sleeves etc.</p>
                              </div>
                              <Button variant="outline" size="sm" onClick={addOptionGroup} className="rounded-lg"><Plus className="w-3 h-3 mr-1" />Add Group</Button>
                            </div>

                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                              <p className="text-xs text-blue-800">
                                <strong>Dynamic Coloring Guide:</strong> For options (Collars, Cuffs), upload a <span className="font-semibold">Grayscale Mask</span> in the "Layer" field.
                                The system automatically applies the selected Fabric Pattern onto this mask.
                              </p>
                            </div>

                            <div className="space-y-6">
                              {(productForm.customizationOptions?.optionGroups || []).map((group: any, gi: number) => (
                                <div key={group.id} className="p-4 bg-muted/20 rounded-xl border border-border/50 space-y-4">
                                  <div className="flex gap-3 items-end">
                                    <div className="flex-1">
                                      <Label className="text-xs text-muted-foreground">Group Label (Visible to User)</Label>
                                      <Input value={group.label} onChange={(e) => updateOptionGroup(gi, 'label', e.target.value)} placeholder="e.g. Collar Style" className="rounded-lg bg-white" />
                                    </div>
                                    <div className="w-32">
                                      <Label className="text-xs text-muted-foreground">Internal Key</Label>
                                      <Input value={group.category} onChange={(e) => updateOptionGroup(gi, 'category', e.target.value)} placeholder="e.g. collar" className="rounded-lg bg-white" />
                                    </div>
                                    <Button variant="destructive" size="icon" onClick={() => removeOptionGroup(gi)} className="rounded-lg h-10 w-10"><Trash2 className="w-4 h-4" /></Button>
                                  </div>

                                  <div className="pl-4 border-l-2 border-border/50 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-sm font-medium">Options in this Group</Label>
                                      <Button variant="ghost" size="sm" onClick={() => addGroupOption(gi)} className="rounded-lg hover:bg-white"><Plus className="w-3 h-3 mr-1" />Add Option</Button>
                                    </div>

                                    {/* Options Table Header */}
                                    <div className="hidden md:grid grid-cols-12 gap-4 px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 rounded-lg">
                                      <div className="col-span-3">Name</div>
                                      <div className="col-span-2 text-center">UI Icon</div>
                                      <div className="col-span-2 text-center">Mask Layer</div>
                                      <div className="col-span-2">Price (+PKR)</div>
                                      <div className="col-span-2 text-center">Default</div>
                                      <div className="col-span-1"></div>
                                    </div>

                                    {(group.options || []).map((opt: any, oi: number) => (
                                      <React.Fragment key={opt.id}>
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 p-2 bg-white rounded-lg items-center border border-border/20 shadow-sm">
                                          <div className="md:col-span-3">
                                            <Input value={opt.name || ''} onChange={(e) => updateGroupOption(gi, oi, 'name', e.target.value)} placeholder="Name" className="h-8 text-sm rounded-md" />
                                          </div>

                                          {/* Thumbnail */}
                                          <div className="md:col-span-2 relative group">
                                            <input id={`go-img-${gi}-${oi}`} type="file" accept="image/*" onChange={(e) => handleGroupOptionImageUpload(gi, oi, 'image', e)} className="hidden" />
                                            <div
                                              className="h-16 w-16 mx-auto border shrink-0 rounded-md flex items-center justify-center cursor-pointer hover:bg-muted/50 overflow-hidden relative"
                                              onClick={() => document.getElementById(`go-img-${gi}-${oi}`)?.click()}
                                              title="Upload UI Icon (Thumbnail)"
                                            >
                                              {opt.image ? <img src={opt.image} className="w-full h-full object-contain" /> : <span className="text-[10px] text-muted-foreground flex gap-1"><Upload className="w-3 h-3" /> Icon</span>}
                                            </div>
                                          </div>

                                          {/* Layer */}
                                          <div className="md:col-span-2 relative group">
                                            <input id={`go-prev-${gi}-${oi}`} type="file" accept="image/*" onChange={(e) => handleGroupOptionImageUpload(gi, oi, 'previewImage', e)} className="hidden" />
                                            <div
                                              className="h-16 w-16 mx-auto border shrink-0 rounded-md flex items-center justify-center cursor-pointer hover:bg-muted/50 overflow-hidden relative"
                                              onClick={() => document.getElementById(`go-prev-${gi}-${oi}`)?.click()}
                                              title="Upload Grayscale Mask (Layer)"
                                            >
                                              {opt.previewImage ? <img src={opt.previewImage} className="w-full h-full object-contain" /> : <span className="text-[10px] text-muted-foreground flex gap-1"><Layers className="w-3 h-3" /> Mask</span>}
                                            </div>
                                          </div>

                                          <div className="md:col-span-2">
                                            <Input type="number" value={opt.priceModifier || 0} onChange={(e) => updateGroupOption(gi, oi, 'priceModifier', Number(e.target.value))} placeholder="+PKR" className="h-8 text-sm rounded-md" />
                                          </div>

                                          <div className="md:col-span-2 flex justify-center">
                                            <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                                              <input type="checkbox" checked={!!opt.isDefault} onChange={(e) => updateGroupOption(gi, oi, 'isDefault', e.target.checked)} className="rounded border-gray-300 w-3 h-3" />
                                              Default
                                            </label>
                                          </div>

                                          <div className="md:col-span-1 flex justify-end">
                                            <Button variant="ghost" size="icon" onClick={() => removeGroupOption(gi, oi)} className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                                            <Button
                                              variant={activeVariantOption?.gi === gi && activeVariantOption?.oi === oi ? "secondary" : "ghost"}
                                              size="icon"
                                              onClick={() => setActiveVariantOption(activeVariantOption?.gi === gi && activeVariantOption?.oi === oi ? null : { gi, oi })}
                                              className="h-8 w-8 text-muted-foreground"
                                              title="Manage Fabric Variants"
                                            >
                                              <Palette className="w-3.5 h-3.5" />
                                            </Button>
                                          </div>
                                        </div>

                                        {/* Variant Manager Expander */}
                                        {activeVariantOption?.gi === gi && activeVariantOption?.oi === oi && (
                                          <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 animate-in slide-in-from-top-2">
                                            <div className="flex items-center justify-between mb-2">
                                              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                {['belt', 'waist'].includes(group.category?.toLowerCase()) ? 'Fixed Variants (All Fabrics)' : `Fabric Variants for ${opt.name || 'this option'}`}
                                              </h4>
                                              <Button variant="ghost" size="sm" onClick={() => setActiveVariantOption(null)} className="h-6 text-xs text-muted-foreground">Close</Button>
                                            </div>

                                            {['belt', 'waist'].includes(group.category?.toLowerCase()) ? (
                                              // Fixed Color Uploads (Belts, etc.) -> Save to layersByView
                                              <div className="grid grid-cols-2 gap-3 max-w-xs">
                                                {(() => {
                                                  const frontImg = opt.layersByView?.front;
                                                  const backImg = opt.layersByView?.back;
                                                  return (
                                                    <>
                                                      {/* Front Upload */}
                                                      <div className="relative group">
                                                        <input
                                                          id={`var-front-fixed-${gi}-${oi}`}
                                                          type="file"
                                                          accept="image/*"
                                                          onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            // We'll reuse the handleGroupOptionVariantUpload but mock the fabricId or add a new handler
                                                            // Actually, let's just create a specific handler or specialized logic here? 
                                                            // Re-using the same handler is tricky because it expects fabricId.
                                                            // We will implement a specialized inline handler for simplicty since we are in the render loop or add a new function.
                                                            // Better: add a new support function or modify existing one. 
                                                            // For now, let's call a new prop path: 'layersByView.front'

                                                            // Since we can't easily add a new function in this replacement block without context, 
                                                            // we will assume we can modify handleGroupOptionVariantUpload or use a new one.
                                                            // Let's rely on a modified handleGroupOptionVariantUpload handling 'fixed' as fabricId.
                                                            handleGroupOptionVariantUpload(gi, oi, 'fixed', 'front', e);
                                                          }}
                                                          className="hidden"
                                                        />
                                                        <div
                                                          className={`aspect-square rounded border flex items-center justify-center cursor-pointer hover:bg-slate-50 relative overflow-hidden ${frontImg ? 'border-primary/50' : 'border-dashed'}`}
                                                          onClick={() => document.getElementById(`var-front-fixed-${gi}-${oi}`)?.click()}
                                                          title="Upload Front Variant"
                                                        >
                                                          {frontImg ? <img src={frontImg} className="w-full h-full object-contain" /> : <span className="text-[10px] text-center text-muted-foreground">Front View</span>}
                                                        </div>
                                                      </div>

                                                      {/* Back Upload */}
                                                      <div className="relative group">
                                                        <input
                                                          id={`var-back-fixed-${gi}-${oi}`}
                                                          type="file"
                                                          accept="image/*"
                                                          onChange={(e) => handleGroupOptionVariantUpload(gi, oi, 'fixed', 'back', e)}
                                                          className="hidden"
                                                        />
                                                        <div
                                                          className={`aspect-square rounded border flex items-center justify-center cursor-pointer hover:bg-slate-50 relative overflow-hidden ${backImg ? 'border-primary/50' : 'border-dashed'}`}
                                                          onClick={() => document.getElementById(`var-back-fixed-${gi}-${oi}`)?.click()}
                                                          title="Upload Back Variant"
                                                        >
                                                          {backImg ? <img src={backImg} className="w-full h-full object-contain" /> : <span className="text-[10px] text-center text-muted-foreground">Back View</span>}
                                                        </div>
                                                      </div>
                                                    </>
                                                  )
                                                })()}
                                              </div>
                                            ) : (
                                              // Standard Per-Fabric Uploads
                                              (!productForm.customizationOptions?.fabrics || productForm.customizationOptions.fabrics.length === 0) ? (
                                                <p className="text-xs text-muted-foreground italic">No fabrics defined in "Fabrics" tab yet.</p>
                                              ) : (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                  {productForm.customizationOptions.fabrics.map((fabric: any) => {
                                                    const variants = opt.layersByFabric?.[fabric.id] || opt.fabricPreviewImages?.[fabric.id] || {};
                                                    const frontImg = typeof variants === 'string' ? variants : variants.front;
                                                    const backImg = variants.back;

                                                    return (
                                                      <div key={fabric.id} className="bg-white border rounded-md p-2 flex flex-col gap-2 shadow-sm">
                                                        <div className="flex items-center gap-2 mb-1">
                                                          <div className="w-4 h-4 rounded-full border bg-muted overflow-hidden">
                                                            {fabric.imageUrl && <img src={fabric.imageUrl} className="w-full h-full object-cover" />}
                                                          </div>
                                                          <span className="text-[10px] font-medium truncate flex-1" title={fabric.name}>{fabric.name}</span>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2">
                                                          {/* Front Upload */}
                                                          <div className="relative group">
                                                            <input
                                                              id={`var-front-${gi}-${oi}-${fabric.id}`}
                                                              type="file"
                                                              accept="image/*"
                                                              onChange={(e) => handleGroupOptionVariantUpload(gi, oi, fabric.id, 'front', e)}
                                                              className="hidden"
                                                            />
                                                            <div
                                                              className={`aspect-square rounded border flex items-center justify-center cursor-pointer hover:bg-slate-50 relative overflow-hidden ${frontImg ? 'border-primary/50' : 'border-dashed'}`}
                                                              onClick={() => document.getElementById(`var-front-${gi}-${oi}-${fabric.id}`)?.click()}
                                                              title="Upload Front Variant"
                                                            >
                                                              {frontImg ? (
                                                                <img src={frontImg} className="w-full h-full object-contain" />
                                                              ) : (
                                                                <span className="text-[8px] text-center text-muted-foreground">Front</span>
                                                              )}
                                                            </div>
                                                          </div>

                                                          {/* Back Upload */}
                                                          <div className="relative group">
                                                            <input
                                                              id={`var-back-${gi}-${oi}-${fabric.id}`}
                                                              type="file"
                                                              accept="image/*"
                                                              onChange={(e) => handleGroupOptionVariantUpload(gi, oi, fabric.id, 'back', e)}
                                                              className="hidden"
                                                            />
                                                            <div
                                                              className={`aspect-square rounded border flex items-center justify-center cursor-pointer hover:bg-slate-50 relative overflow-hidden ${backImg ? 'border-primary/50' : 'border-dashed'}`}
                                                              onClick={() => document.getElementById(`var-back-${gi}-${oi}-${fabric.id}`)?.click()}
                                                              title="Upload Back Variant"
                                                            >
                                                              {backImg ? (
                                                                <img src={backImg} className="w-full h-full object-contain" />
                                                              ) : (
                                                                <span className="text-[8px] text-center text-muted-foreground">Back</span>
                                                              )}
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              )
                                            )}
                                          </div>
                                        )}
                                      </React.Fragment>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TabsContent>

                          {/* Advanced Tab */}
                          <TabsContent value="advanced" className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-base font-semibold">Advanced Configuration (JSON)</Label>
                              <p className="text-xs text-muted-foreground">
                                Expert Mode: Edit the raw JSON structure. Useful for bulk edits, fixing z-indexes, or copying configurations between products.
                              </p>
                              <textarea
                                value={advancedConfigJson || JSON.stringify(productForm.customizationOptions?.optionGroups || [], null, 2)}
                                onChange={(e) => setAdvancedConfigJson(e.target.value)}
                                className="w-full h-[50vh] font-mono text-xs p-4 rounded-xl bg-slate-950 text-slate-50 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Paste JSON configuration..."
                              />
                            </div>
                          </TabsContent>
                        </div>

                        <DialogFooter className="mt-4 border-t pt-4">
                          <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>Cancel</Button>
                          <Button onClick={handleProductSave} className="bg-gradient-luxury text-white">
                            {productForm._id ? 'Save Changes' : 'Create Product'}
                          </Button>
                        </DialogFooter>
                      </Tabs>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleOpenAddDialog} className="h-12 px-6 rounded-xl bg-gradient-luxury text-white shadow-soft hover:shadow-elevated transition-all">
                      <Plus className="w-4 h-4 mr-2" />
                      Add {activeTab === 'fabrics' ? 'Fabric' : 'Option'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="font-display text-xl">{editingItem ? 'Edit' : 'Add'} {activeTab === 'fabrics' ? 'Fabric' : 'Option'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Enter name" className="h-12 rounded-xl" />
                      </div>
                      {activeTab !== 'fabrics' && (
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select value={newCategory} onValueChange={setNewCategory}>
                            <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {['collar', 'cuff', 'chestpocket', 'button', 'sleeve', 'back', 'necktie', 'bowtie'].map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Thumbnail Image *</Label>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleImageUpload(e, false)} className="hidden" />
                        <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="w-4 h-4 mr-2" />Upload Thumbnail
                        </Button>
                        {newImage && <img src={newImage} alt="" className="h-24 w-full object-cover rounded-xl mt-2 border" />}
                      </div>
                      <div className="space-y-2">
                        <Label>Preview Layer (Overlay)</Label>
                        <input ref={previewInputRef} type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="hidden" />
                        <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => previewInputRef.current?.click()}>
                          <Upload className="w-4 h-4 mr-2" />Upload Layer
                        </Button>
                        {newPreviewImage && <img src={newPreviewImage} alt="" className="h-24 w-full object-contain rounded-xl mt-2 border bg-muted/30" />}
                      </div>
                      {activeTab === 'fabrics' && (
                        <div className="space-y-2 md:col-span-2">
                          <Label>Colors</Label>
                          <div className="flex flex-wrap gap-2">
                            {newColors.map((color, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <input type="color" value={color} onChange={(e) => updateColor(i, e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                                {newColors.length > 1 && <button onClick={() => removeColor(i)} className="p-1 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="w-3 h-3" /></button>}
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addColor} className="rounded-lg"><Plus className="w-3 h-3" /></Button>
                          </div>
                        </div>
                      )}
                      {activeTab !== 'fabrics' && activeTab !== 'backs' && (
                        <div className="space-y-4 md:col-span-2 p-4 bg-muted/30 rounded-2xl">
                          <Label className="text-base font-semibold">Fabric-Specific Previews</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {fabrics.map(fabric => (
                              <div key={fabric.id} className="p-3 bg-white rounded-xl border border-border/50 space-y-2">
                                <div className="flex items-center gap-2">
                                  {fabric.image && <img src={fabric.image} alt="" className="w-6 h-6 rounded-full object-cover" />}
                                  <span className="text-sm font-medium">{fabric.name}</span>
                                </div>
                                <input ref={el => fabricPreviewRefs.current[fabric.id] = el} type="file" accept="image/*" onChange={(e) => handleImageUpload(e, false, fabric.id)} className="hidden" />
                                <Button variant="outline" size="sm" className="w-full rounded-lg" onClick={() => fabricPreviewRefs.current[fabric.id]?.click()}>
                                  <Upload className="w-3 h-3 mr-1" />Upload
                                </Button>
                                {newFabricPreviews[fabric.id] && (
                                  <div className="relative">
                                    <img src={newFabricPreviews[fabric.id]} alt="" className="h-16 w-full object-contain rounded border bg-muted/30" />
                                    <button onClick={() => { const u = { ...newFabricPreviews }; delete u[fabric.id]; setNewFabricPreviews(u); }} className="absolute top-1 right-1 p-0.5 bg-destructive text-white rounded">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <Button onClick={handleSaveItem} className="md:col-span-2 h-12 rounded-xl bg-gradient-luxury text-white">
                        {editingItem ? 'Save Changes' : `Add ${activeTab === 'fabrics' ? 'Fabric' : 'Option'}`}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div key={activeTab} className="p-6 lg:p-10 max-w-7xl mx-auto min-h-[50vh] transition-opacity duration-200">
          {/* Orders Content */}
          {activeTab === 'orders' ? (
            ordersLoading ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              </div>
            ) : ordersError ? (
              <div className="text-center py-32">
                <p className="text-destructive">{ordersError}</p>
                <Button onClick={fetchOrders} className="mt-4">Retry</Button>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-32">
                <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-display text-xl font-medium">No orders yet</h3>
                <p className="text-muted-foreground">Orders will appear here when customers place them</p>
              </div>
            ) : (
              <>
                {/* Orders Table */}
                <div className="bg-white rounded-2xl border border-border/50 shadow-soft overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/30 border-b border-border/50">
                        <tr>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                          <th className="text-right px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {orders.filter(o => !searchTerm ||
                          o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map((order) => (
                          <tr key={order._id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-semibold text-foreground">{order.orderNumber}</p>
                              <p className="text-xs text-muted-foreground">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-medium text-foreground">{order.customer?.name}</p>
                              <p className="text-xs text-muted-foreground">{order.customer?.email}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-foreground">{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-foreground">{formatPrice(order.total || 0)}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                                {order.status?.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setSelectedOrder(order); setIsOrderDialogOpen(true); }}
                                className="rounded-lg"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Order Detail Dialog */}
                <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
                  <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="font-display text-xl">Order Details - {selectedOrder?.orderNumber}</DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                      <div className="space-y-6 py-4">
                        {/* Order Status */}
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                          <div>
                            <p className="text-sm text-muted-foreground">Current Status</p>
                            <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium capitalize mt-1 ${getStatusColor(selectedOrder.status)}`}>
                              {selectedOrder.status?.replace('_', ' ')}
                            </span>
                          </div>
                          <Select value={selectedOrder.status} onValueChange={(v) => updateOrderStatus(selectedOrder._id, v)}>
                            <SelectTrigger className="w-48 rounded-lg">
                              <SelectValue placeholder="Update Status" />
                            </SelectTrigger>
                            <SelectContent>
                              {orderStatuses.map(s => (
                                <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Customer Info */}
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="p-4 bg-white rounded-xl border border-border/50">
                            <h4 className="font-semibold text-foreground mb-3">Customer Information</h4>
                            <div className="space-y-2 text-sm">
                              <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selectedOrder.customer?.name}</span></p>
                              <p><span className="text-muted-foreground">Email:</span> {selectedOrder.customer?.email}</p>
                              <p><span className="text-muted-foreground">Phone:</span> {selectedOrder.customer?.phone}</p>
                            </div>
                          </div>
                          <div className="p-4 bg-white rounded-xl border border-border/50">
                            <h4 className="font-semibold text-foreground mb-3">Shipping Address</h4>
                            <div className="text-sm text-muted-foreground">
                              <p>{selectedOrder.customer?.address?.street}</p>
                              <p>{selectedOrder.customer?.address?.city}{selectedOrder.customer?.address?.state && `, ${selectedOrder.customer?.address?.state}`}</p>
                              <p>{selectedOrder.customer?.address?.postalCode}</p>
                              <p>{selectedOrder.customer?.address?.country}</p>
                            </div>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="p-4 bg-white rounded-xl border border-border/50">
                          <h4 className="font-semibold text-foreground mb-4">Order Items</h4>
                          <div className="space-y-4">
                            {selectedOrder.items?.map((item: any, index: number) => (
                              <div key={index} className="flex gap-4 pb-4 border-b border-border/30 last:border-0 last:pb-0">
                                <div className="w-16 h-16 rounded-lg bg-muted/30 overflow-hidden shrink-0">
                                  {item.baseImage && <img src={item.baseImage} alt={item.productName} className="w-full h-full object-contain p-1" />}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-foreground">{item.productName}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{item.productCategory}</p>
                                  {item.fabric && <p className="text-xs text-muted-foreground mt-1"><span className="font-semibold">Fabric:</span> {item.fabric.name}</p>}
                                  {item.styles && Object.keys(item.styles).length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {Object.entries(item.styles).map(([key, style]: [string, any]) => (
                                        <span key={key} className="text-[10px] px-2 py-0.5 bg-muted rounded-full border">
                                          <span className="opacity-70 capitalize">{key}:</span> {style.name}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {item.measurements && Object.keys(item.measurements).length > 0 && (
                                    <div className="mt-2 text-xs text-muted-foreground bg-muted/20 p-2 rounded-lg">
                                      <p className="font-semibold mb-1">Measurements:</p>
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                        {Object.entries(item.measurements).map(([key, val]: [string, any]) => (
                                          <div key={key} className="flex justify-between">
                                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                            <span>{val}"</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                                    <span className="font-semibold">{formatPrice(item.totalPrice)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 pt-4 border-t border-border/50 flex justify-between">
                            <span className="font-semibold">Total</span>
                            <span className="font-display text-xl font-bold">{formatPrice(selectedOrder.total)}</span>
                          </div>
                        </div>

                        {/* Order Timeline */}
                        <div className="p-4 bg-white rounded-xl border border-border/50">
                          <h4 className="font-semibold text-foreground mb-3">Order Information</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Order Date</p>
                              <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Payment Method</p>
                              <p className="font-medium capitalize">{selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : selectedOrder.paymentMethod?.replace('_', ' ')}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </>
            )
          ) : activeTab === 'customers' ? (
            /* Customers Tab */
            customersLoading ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-32">
                <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-display text-xl font-medium">No customers yet</h3>
                <p className="text-muted-foreground">Customers will appear here when they register</p>
                {token === 'legacy-token' && (
                  <p className="text-sm text-amber-600 mt-4">Login with API admin credentials to manage customers</p>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-border/50 shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30 border-b border-border/50">
                      <tr>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Orders</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Joined</th>
                        <th className="text-right px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {customers.filter(c => !searchTerm ||
                        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
                      ).map((customer) => (
                        <tr key={customer._id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-semibold">{customer.name?.charAt(0).toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{customer.name}</p>
                                <p className="text-xs text-muted-foreground">{customer._id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>{customer.email}</span>
                            </div>
                            {customer.phone && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                <Phone className="w-3.5 h-3.5" />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {customer.orderCount || 0} orders
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-muted-foreground">
                              {new Date(customer.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setSelectedCustomer(customer); setIsCustomerDialogOpen(true); }}
                              className="rounded-lg"
                            >
                              <UserCog className="w-4 h-4 mr-1" />
                              Manage
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Customer Management Dialog */}
                <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="font-display text-xl">Manage Customer</DialogTitle>
                    </DialogHeader>
                    {selectedCustomer && (
                      <div className="space-y-6 py-4">
                        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary text-xl font-semibold">{selectedCustomer.name?.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-lg">{selectedCustomer.name}</p>
                            <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-white rounded-xl border border-border/50">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Orders</p>
                            <p className="text-2xl font-bold text-foreground">{selectedCustomer.orderCount || 0}</p>
                          </div>
                          <div className="p-4 bg-white rounded-xl border border-border/50">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Saved Designs</p>
                            <p className="text-2xl font-bold text-foreground">{selectedCustomer.savedDesigns?.length || 0}</p>
                          </div>
                        </div>

                        {/* Reset Password */}
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                          <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                            <KeyRound className="w-4 h-4" />
                            Reset Password
                          </h4>
                          <div className="flex gap-2">
                            <Input
                              type="password"
                              placeholder="New password (min 6 chars)"
                              value={newCustomerPassword}
                              onChange={(e) => setNewCustomerPassword(e.target.value)}
                              className="flex-1 h-12 rounded-lg"
                            />
                            <Button
                              onClick={() => resetCustomerPassword(selectedCustomer._id, newCustomerPassword)}
                              disabled={newCustomerPassword.length < 6}
                              className="bg-amber-600 hover:bg-amber-700 rounded-lg"
                            >
                              Reset
                            </Button>
                          </div>
                          <p className="text-xs text-amber-700 mt-2">This will immediately change the customer's password</p>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            )
          ) : activeTab === 'admins' ? (
            /* Admins Tab */
            !isSuperAdmin ? (
              <div className="text-center py-32">
                <Shield className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-display text-xl font-medium">Super Admin Access Required</h3>
                <p className="text-muted-foreground">Only super admins can manage other admin accounts</p>
              </div>
            ) : adminsLoading ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-32">
                <Shield className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-display text-xl font-medium">No admins found</h3>
                <p className="text-muted-foreground">Share the invite code to add more admins</p>
                <div className="mt-4 p-3 bg-muted/50 rounded-lg inline-block">
                  <code className="text-primary font-mono text-sm">TAILORFIT-ADMIN-2026</code>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-border/50 shadow-soft overflow-hidden">
                <div className="p-4 bg-primary/5 border-b border-border/50">
                  <p className="text-sm text-muted-foreground">
                    <strong>Invite Code:</strong> <code className="px-2 py-1 rounded bg-primary/10 text-primary font-mono">TAILORFIT-ADMIN-2026</code>
                    <span className="ml-2">- Share this with new admins to register</span>
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30 border-b border-border/50">
                      <tr>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Login</th>
                        <th className="text-right px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {admins.filter(a => !searchTerm ||
                        a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        a.email?.toLowerCase().includes(searchTerm.toLowerCase())
                      ).map((adminItem) => (
                        <tr key={adminItem._id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${adminItem.role === 'super_admin' ? 'bg-amber-100' : 'bg-primary/10'}`}>
                                <Shield className={`w-5 h-5 ${adminItem.role === 'super_admin' ? 'text-amber-600' : 'text-primary'}`} />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{adminItem.name}</p>
                                <p className="text-xs text-muted-foreground">{adminItem.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${adminItem.role === 'super_admin' ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'
                              }`}>
                              {adminItem.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${adminItem.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                              {adminItem.isActive ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                              {adminItem.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-muted-foreground">
                              {adminItem.lastLogin
                                ? new Date(adminItem.lastLogin).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
                                : 'Never'
                              }
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {adminItem._id !== admin?._id && adminItem.role !== 'super_admin' && (
                              <Button
                                variant={adminItem.isActive ? 'outline' : 'default'}
                                size="sm"
                                onClick={() => toggleAdminStatus(adminItem._id, !adminItem.isActive)}
                                className={`rounded-lg ${adminItem.isActive ? 'hover:bg-red-50 hover:text-red-600 hover:border-red-200' : 'bg-green-600 hover:bg-green-700'}`}
                              >
                                {adminItem.isActive ? (
                                  <><Ban className="w-4 h-4 mr-1" /> Deactivate</>
                                ) : (
                                  <><CheckCircle className="w-4 h-4 mr-1" /> Activate</>
                                )}
                              </Button>
                            )}
                            {adminItem._id === admin?._id && (
                              <span className="text-xs text-muted-foreground italic">You</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : activeTab === 'products' ? (
            productsLoading ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              </div>
            ) : productsError ? (
              <div className="text-center py-32">
                <p className="text-destructive">{productsError}</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-32">
                <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-display text-xl font-medium">No products yet</h3>
                <p className="text-muted-foreground">Create your first product to get started</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((product, i) => (
                  <div key={product._id} className="group bg-white rounded-2xl border border-border/50 overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-500 animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="relative aspect-square bg-muted/30">
                      {product.images?.baseImage ? (
                        <img src={product.images.baseImage} alt={product.name} className="w-full h-full object-contain p-4" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package className="w-12 h-12 text-muted-foreground/30" /></div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <Button size="sm" onClick={() => handleOpenProductDialog(product)} className="rounded-lg"><Edit className="w-4 h-4 mr-1" />Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleProductDelete(product._id)} className="rounded-lg"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-foreground truncate">{product.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">{product.category}</span>
                        <span className="font-semibold text-sm">{formatPrice(product.basePrice)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === '3d-fabrics' ? (
            /* 3D Fabrics Tab */
            fabrics3DLoading ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              </div>
            ) : fabrics3D.length === 0 ? (
              <div className="text-center py-32">
                <Box className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-display text-xl font-medium">No 3D Fabrics yet</h3>
                <p className="text-muted-foreground">Add your first PBR fabric for 3D customization</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Run <code className="px-2 py-1 bg-muted rounded text-xs">node server/utils/fabricSeeder.js</code> to seed sample fabrics
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {fabrics3D.filter(f => !searchTerm || f.name.toLowerCase().includes(searchTerm.toLowerCase())).map((fabric, i) => (
                  <div key={fabric._id} className="group bg-white rounded-2xl border border-border/50 overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-500 animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="relative aspect-square bg-muted/30">
                      {fabric.colorMapUrl ? (
                        <img src={fabric.colorMapUrl} alt={fabric.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Box className="w-12 h-12 text-muted-foreground/30" /></div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <Button size="sm" onClick={() => open3DFabricDialog(fabric)} className="rounded-lg"><Edit className="w-4 h-4 mr-1" />Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => delete3DFabric(fabric._id)} className="rounded-lg"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                      {/* Category Badge */}
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/90 text-foreground shadow-sm capitalize">
                          {FABRIC_CATEGORIES.find(c => c.value === fabric.category)?.icon} {fabric.category}
                        </span>
                      </div>
                      {/* PBR Badge */}
                      {fabric.normalMapUrl && fabric.roughnessMapUrl && (
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/90 text-white shadow-sm">
                            Full PBR
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-foreground truncate">{fabric.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <div
                          className="w-5 h-5 rounded-full border border-border shadow-sm"
                          style={{ backgroundColor: fabric.baseColor }}
                          title={`Base color: ${fabric.baseColor}`}
                        />
                        <span className="text-xs text-muted-foreground">
                          R: {fabric.roughness.toFixed(1)} | M: {fabric.metalness.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex gap-1">
                          {fabric.colorMapUrl && <span className="w-2 h-2 rounded-full bg-primary" title="Color Map" />}
                          {fabric.normalMapUrl && <span className="w-2 h-2 rounded-full bg-blue-500" title="Normal Map" />}
                          {fabric.roughnessMapUrl && <span className="w-2 h-2 rounded-full bg-amber-500" title="Roughness Map" />}
                        </div>
                        <span className="font-semibold text-sm">{formatPrice(fabric.price)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            getCurrentItems().length === 0 ? (
              <div className="text-center py-32">
                <Layers className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-display text-xl font-medium">No {activeTab} yet</h3>
                <p className="text-muted-foreground">Add your first item to get started</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {getCurrentItems().map((item: any, i: number) => (
                  <div key={item.id} className="group bg-white rounded-2xl border border-border/50 overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-500 animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="relative aspect-square bg-muted/30">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Layers className="w-12 h-12 text-muted-foreground/30" /></div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <Button size="sm" onClick={() => handleEdit(item)} className="rounded-lg"><Edit className="w-4 h-4 mr-1" />Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id, item.category)} className="rounded-lg"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-foreground truncate">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        {item.previewImage && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Has Layer</span>}
                        {item.category && <span className="text-xs text-muted-foreground capitalize">{item.category}</span>}
                      </div>
                      {item.colors && (
                        <div className="flex gap-1 mt-3">
                          {item.colors.slice(0, 6).map((c: string, ci: number) => (
                            <div key={ci} className="w-5 h-5 rounded-full border border-border shadow-sm" style={{ backgroundColor: c }} />
                          ))}
                          {item.colors.length > 6 && <span className="text-xs text-muted-foreground">+{item.colors.length - 6}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </main >
    </div >
  );
}
