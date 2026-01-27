import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SiteLayout } from '@/components/layout/SiteLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { 
  User, Package, Heart, Ruler, LogOut, ArrowRight, Loader2, 
  Clock, CheckCircle2, Truck, XCircle, Scissors, Trash2,
  Home as HomeIcon, Edit, Save, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

type TabType = 'orders' | 'designs' | 'measurements' | 'profile';

export default function AccountPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    customer, 
    isAuthenticated, 
    isLoading, 
    orders, 
    logout, 
    fetchOrders, 
    fetchProfile,
    updateProfile,
    deleteDesign,
    deleteMeasurements
  } = useCustomerAuth();

  // Read initial tab from URL
  const urlTab = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(urlTab || 'orders');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const formatPrice = useMemo(() => {
    const formatter = new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    });
    return (value: number) => formatter.format(value);
  }, []);

  // Update tab from URL params
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TabType | null;
    if (tabFromUrl && ['orders', 'designs', 'measurements', 'profile'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth', { state: { from: { pathname: '/account' } } });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Fetch data on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      fetchProfile();
    }
  }, [isAuthenticated, fetchOrders, fetchProfile]);

  // Update form when customer changes
  useEffect(() => {
    if (customer) {
      setProfileForm({
        name: customer.name || '',
        phone: customer.phone || '',
        street: customer.address?.street || '',
        city: customer.address?.city || '',
        state: customer.address?.state || '',
        postalCode: customer.address?.postalCode || '',
      });
    }
  }, [customer]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const result = await updateProfile({
      name: profileForm.name,
      phone: profileForm.phone,
      address: {
        street: profileForm.street,
        city: profileForm.city,
        state: profileForm.state,
        postalCode: profileForm.postalCode,
        country: 'Pakistan',
      },
    });
    
    if (result.success) {
      toast.success('Profile updated');
      setIsEditing(false);
    } else {
      toast.error(result.message);
    }
    setSaving(false);
  };

  const handleDeleteDesign = async (id: string) => {
    const result = await deleteDesign(id);
    if (result.success) {
      toast.success('Design deleted');
    } else {
      toast.error(result.message);
    }
  };

  const handleDeleteMeasurements = async (id: string) => {
    const result = await deleteMeasurements(id);
    if (result.success) {
      toast.success('Measurements deleted');
    } else {
      toast.error(result.message);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
      pending: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: Clock },
      confirmed: { label: 'Confirmed', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: CheckCircle2 },
      in_production: { label: 'In Production', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Scissors },
      ready: { label: 'Ready', color: 'text-green-700', bgColor: 'bg-green-100', icon: Package },
      shipped: { label: 'Shipped', color: 'text-cyan-700', bgColor: 'bg-cyan-100', icon: Truck },
      delivered: { label: 'Delivered', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: HomeIcon },
      cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
    };
    return statusMap[status] || statusMap.pending;
  };

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 lg:px-8 py-20 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
        </div>
      </SiteLayout>
    );
  }

  if (!customer) return null;

  const tabs = [
    { id: 'orders', label: 'My Orders', icon: Package, count: orders.length },
    { id: 'designs', label: 'Saved Designs', icon: Heart, count: customer.savedDesigns?.length || 0 },
    { id: 'measurements', label: 'Measurements', icon: Ruler, count: customer.savedMeasurements?.length || 0 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 lg:px-8 py-12 animate-fade-up">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl lg:text-4xl font-semibold text-foreground">
                Welcome, {customer.name?.split(' ')[0]}
              </h1>
              <p className="text-muted-foreground">{customer.email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="rounded-xl">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <div className="grid lg:grid-cols-[240px_1fr] gap-8">
            {/* Sidebar */}
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary text-white shadow-md'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </div>
                  {tab.count !== undefined && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      activeTab === tab.id ? 'bg-white/20' : 'bg-muted'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* Content */}
            <div className="bg-white rounded-2xl border border-border/50 shadow-soft p-6 lg:p-8">
              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground mb-6">My Orders</h2>
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="font-medium text-lg text-foreground mb-2">No orders yet</h3>
                      <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
                      <Link
                        to="/products"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-all"
                      >
                        Browse Products
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => {
                        const statusInfo = getStatusInfo(order.status);
                        const StatusIcon = statusInfo.icon;
                        return (
                          <Link
                            key={order._id}
                            to={`/order/${order.orderNumber}`}
                            className="block p-4 bg-muted/20 rounded-xl hover:bg-muted/40 transition-all group"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="flex -space-x-2">
                                  {order.items.slice(0, 2).map((item: any, i: number) => (
                                    <div key={i} className="w-12 h-12 rounded-lg bg-white border-2 border-white overflow-hidden shadow-sm">
                                      {item.baseImage && (
                                        <img src={item.baseImage} alt="" className="w-full h-full object-contain p-1" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground">{order.orderNumber}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {formatPrice(order.total)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${statusInfo.bgColor}`}>
                                  <StatusIcon className={`w-3.5 h-3.5 ${statusInfo.color}`} />
                                  <span className={statusInfo.color}>{statusInfo.label}</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Saved Designs Tab */}
              {activeTab === 'designs' && (
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground mb-6">Saved Designs</h2>
                  {!customer.savedDesigns || customer.savedDesigns.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="font-medium text-lg text-foreground mb-2">No saved designs</h3>
                      <p className="text-muted-foreground mb-6">Customize a product and save your design</p>
                      <Link
                        to="/products"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-all"
                      >
                        Start Customizing
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {customer.savedDesigns.map((design) => (
                        <div key={design._id} className="p-4 bg-muted/20 rounded-xl">
                          <div className="flex gap-4">
                            <div className="w-20 h-20 rounded-lg bg-white overflow-hidden shrink-0">
                              {design.baseImage && (
                                <img src={design.baseImage} alt={design.productName} className="w-full h-full object-contain p-2" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{design.productName}</p>
                              <p className="text-xs text-muted-foreground capitalize">{design.productCategory}</p>
                              {design.fabric && (
                                <p className="text-xs text-muted-foreground mt-1">Fabric: {design.fabric.name}</p>
                              )}
                              <p className="font-semibold text-primary mt-2">{formatPrice(design.totalPrice)}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Link
                              to={`/customize/${design.productId}?restore=${design._id}`}
                              className="flex-1 px-3 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors text-center"
                            >
                              Open Design
                            </Link>
                            <button
                              onClick={() => handleDeleteDesign(design._id)}
                              className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Measurements Tab */}
              {activeTab === 'measurements' && (
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground mb-6">Saved Measurements</h2>
                  {!customer.savedMeasurements || customer.savedMeasurements.length === 0 ? (
                    <div className="text-center py-12">
                      <Ruler className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="font-medium text-lg text-foreground mb-2">No saved measurements</h3>
                      <p className="text-muted-foreground mb-6">Save your measurements for faster checkout</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {customer.savedMeasurements.map((m) => (
                        <div key={m._id} className="p-4 bg-muted/20 rounded-xl">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-foreground">{m.label}</p>
                              {m.isDefault && (
                                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">Default</span>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteMeasurements(m._id)}
                              className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
                            {m.chest && <div><span className="text-muted-foreground">Chest:</span> {m.chest}"</div>}
                            {m.waist && <div><span className="text-muted-foreground">Waist:</span> {m.waist}"</div>}
                            {m.shoulders && <div><span className="text-muted-foreground">Shoulders:</span> {m.shoulders}"</div>}
                            {m.sleeveLength && <div><span className="text-muted-foreground">Sleeve:</span> {m.sleeveLength}"</div>}
                            {m.neck && <div><span className="text-muted-foreground">Neck:</span> {m.neck}"</div>}
                            {m.inseam && <div><span className="text-muted-foreground">Inseam:</span> {m.inseam}"</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-xl font-semibold text-foreground">Profile Information</h2>
                    {!isEditing ? (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="rounded-lg">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="rounded-lg">
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveProfile} disabled={saving} className="rounded-lg">
                          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Save
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        {isEditing ? (
                          <Input
                            value={profileForm.name}
                            onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))}
                            className="h-12 rounded-xl"
                          />
                        ) : (
                          <p className="h-12 px-3 py-2.5 bg-muted/30 rounded-xl text-foreground">{customer.name}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <p className="h-12 px-3 py-2.5 bg-muted/30 rounded-xl text-muted-foreground">{customer.email}</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        {isEditing ? (
                          <Input
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                            placeholder="+92 300 1234567"
                            className="h-12 rounded-xl"
                          />
                        ) : (
                          <p className="h-12 px-3 py-2.5 bg-muted/30 rounded-xl text-foreground">
                            {customer.phone || <span className="text-muted-foreground">Not set</span>}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/50">
                      <h3 className="font-medium text-foreground mb-4">Default Address</h3>
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="sm:col-span-2 space-y-2">
                          <Label>Street Address</Label>
                          {isEditing ? (
                            <Input
                              value={profileForm.street}
                              onChange={(e) => setProfileForm(p => ({ ...p, street: e.target.value }))}
                              placeholder="123 Main Street"
                              className="h-12 rounded-xl"
                            />
                          ) : (
                            <p className="h-12 px-3 py-2.5 bg-muted/30 rounded-xl text-foreground">
                              {customer.address?.street || <span className="text-muted-foreground">Not set</span>}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>City</Label>
                          {isEditing ? (
                            <Input
                              value={profileForm.city}
                              onChange={(e) => setProfileForm(p => ({ ...p, city: e.target.value }))}
                              placeholder="Karachi"
                              className="h-12 rounded-xl"
                            />
                          ) : (
                            <p className="h-12 px-3 py-2.5 bg-muted/30 rounded-xl text-foreground">
                              {customer.address?.city || <span className="text-muted-foreground">Not set</span>}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>State/Province</Label>
                          {isEditing ? (
                            <Input
                              value={profileForm.state}
                              onChange={(e) => setProfileForm(p => ({ ...p, state: e.target.value }))}
                              placeholder="Sindh"
                              className="h-12 rounded-xl"
                            />
                          ) : (
                            <p className="h-12 px-3 py-2.5 bg-muted/30 rounded-xl text-foreground">
                              {customer.address?.state || <span className="text-muted-foreground">Not set</span>}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Postal Code</Label>
                          {isEditing ? (
                            <Input
                              value={profileForm.postalCode}
                              onChange={(e) => setProfileForm(p => ({ ...p, postalCode: e.target.value }))}
                              placeholder="75500"
                              className="h-12 rounded-xl"
                            />
                          ) : (
                            <p className="h-12 px-3 py-2.5 bg-muted/30 rounded-xl text-foreground">
                              {customer.address?.postalCode || <span className="text-muted-foreground">Not set</span>}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
