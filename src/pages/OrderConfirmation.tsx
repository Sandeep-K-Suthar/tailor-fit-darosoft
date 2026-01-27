import { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SiteLayout } from '@/components/layout/SiteLayout';
import { CheckCircle2, Package, Truck, Clock, ArrowRight, Copy, Loader2, XCircle, Home as HomeIcon, Scissors } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  items: Array<{
    productName: string;
    productCategory: string;
    baseImage: string;
    fabric: { name: string } | null;
    styles: Record<string, { name: string }>;
    totalPrice: number;
    quantity: number;
  }>;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatPrice = useMemo(() => {
    const formatter = new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    });
    return (value: number) => formatter.format(value);
  }, []);

  useEffect(() => {
    if (!orderNumber) return;

    fetch(`/api/orders/${orderNumber}`)
      .then((res) => {
        if (!res.ok) throw new Error('Order not found');
        return res.json();
      })
      .then((data) => setOrder(data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  const copyOrderNumber = () => {
    if (order?.orderNumber) {
      navigator.clipboard.writeText(order.orderNumber);
      toast.success('Order number copied to clipboard');
    }
  };

  if (loading) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 lg:px-8 py-20 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-4">Loading order details...</p>
        </div>
      </SiteLayout>
    );
  }

  if (error || !order) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 lg:px-8 py-20 text-center">
          <div className="max-w-lg mx-auto">
            <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
            <h1 className="font-display text-2xl font-semibold text-foreground mb-4">
              Order Not Found
            </h1>
            <p className="text-muted-foreground mb-8">
              {error || "We couldn't find the order you're looking for."}
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-all"
            >
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </SiteLayout>
    );
  }

  const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: Clock },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'in_production', label: 'In Production', icon: Scissors },
    { key: 'ready', label: 'Ready', icon: Package },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: HomeIcon },
  ];

  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';
  const currentStepIndex = isCancelled ? -1 : statusSteps.findIndex((s) => s.key === order.status);

  // Determine header state
  const HeaderIcon = isCancelled ? XCircle : isDelivered ? HomeIcon : CheckCircle2;
  const headerBgColor = isCancelled ? 'bg-red-100' : isDelivered ? 'bg-emerald-100' : 'bg-green-100';
  const headerIconColor = isCancelled ? 'text-red-600' : isDelivered ? 'text-emerald-600' : 'text-green-600';
  const headerTitle = isCancelled 
    ? 'Order Cancelled' 
    : isDelivered 
      ? 'Order Delivered!' 
      : 'Order Placed Successfully!';
  const headerMessage = isCancelled
    ? 'This order has been cancelled. If you have any questions, please contact our support.'
    : isDelivered
      ? 'Your order has been delivered. Thank you for shopping with us!'
      : "Thank you for your order. We'll send you a confirmation email with tracking details shortly.";

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 lg:px-8 py-12 animate-fade-up">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className={`w-20 h-20 rounded-full ${headerBgColor} flex items-center justify-center mx-auto mb-6`}>
            <HeaderIcon className={`w-10 h-10 ${headerIconColor}`} />
          </div>
          <h1 className="font-display text-3xl lg:text-4xl font-semibold text-foreground mb-3">
            {headerTitle}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {headerMessage}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Order Number Card */}
          <div className="bg-white rounded-2xl border border-border/50 shadow-soft p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Order Number</p>
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl font-bold text-foreground">
                    {order.orderNumber}
                  </span>
                  <button
                    onClick={copyOrderNumber}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Order Date</p>
                <p className="font-medium text-foreground">
                  {new Date(order.createdAt).toLocaleDateString('en-PK', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Order Status */}
          <div className="bg-white rounded-2xl border border-border/50 shadow-soft p-6 mb-8">
            <h2 className="font-display text-lg font-semibold text-foreground mb-6">Order Status</h2>
            
            {isCancelled ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <p className="font-semibold text-red-600 text-lg">Order Cancelled</p>
                  <p className="text-sm text-muted-foreground mt-2">This order has been cancelled</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between overflow-x-auto py-4 px-2">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center relative min-w-[70px]">
                      {index > 0 && (
                        <div
                          className={`absolute left-0 right-1/2 top-6 h-0.5 -translate-y-1/2 ${
                            isCompleted ? 'bg-primary' : 'bg-border'
                          }`}
                        />
                      )}
                      {index < statusSteps.length - 1 && (
                        <div
                          className={`absolute left-1/2 right-0 top-6 h-0.5 -translate-y-1/2 ${
                            index < currentStepIndex ? 'bg-primary' : 'bg-border'
                          }`}
                        />
                      )}
                      <div
                        className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-primary text-white'
                            : 'bg-muted/50 text-muted-foreground'
                        } ${isCurrent ? 'ring-4 ring-primary/20 scale-105' : ''}`}
                      >
                        <step.icon className="w-5 h-5" />
                      </div>
                      <p className={`text-xs mt-2 text-center ${isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Order Items */}
            <div className="bg-white rounded-2xl border border-border/50 shadow-soft p-6">
              <h2 className="font-display text-lg font-semibold text-foreground mb-6">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b border-border/30 last:border-0 last:pb-0">
                    <div className="w-16 h-16 rounded-lg bg-muted/30 overflow-hidden shrink-0">
                      {item.baseImage && (
                        <img
                          src={item.baseImage}
                          alt={item.productName}
                          className="w-full h-full object-contain p-1"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{item.productName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.productCategory}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                        <span className="font-semibold text-foreground">{formatPrice(item.totalPrice)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-border/50 flex justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-display text-xl font-bold text-foreground">{formatPrice(order.total)}</span>
              </div>
            </div>

            {/* Shipping Details */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-border/50 shadow-soft p-6">
                <h2 className="font-display text-lg font-semibold text-foreground mb-4">Shipping Address</h2>
                <div className="text-muted-foreground">
                  <p className="font-medium text-foreground">{order.customer.name}</p>
                  <p>{order.customer.address.street}</p>
                  <p>
                    {order.customer.address.city}
                    {order.customer.address.state && `, ${order.customer.address.state}`}
                  </p>
                  <p>{order.customer.address.postalCode}</p>
                  <p>{order.customer.address.country}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-border/50 shadow-soft p-6">
                <h2 className="font-display text-lg font-semibold text-foreground mb-4">Contact Information</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p><span className="text-foreground font-medium">Email:</span> {order.customer.email}</p>
                  <p><span className="text-foreground font-medium">Phone:</span> {order.customer.phone}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-border/50 shadow-soft p-6">
                <h2 className="font-display text-lg font-semibold text-foreground mb-4">Payment Method</h2>
                <p className="text-muted-foreground capitalize">
                  {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Helpful Info */}
          <div className="bg-muted/30 rounded-2xl p-6 mt-8">
            <h3 className="font-display text-lg font-semibold text-foreground mb-3">Track Your Order</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Bookmark this page or save your order number <strong>{order.orderNumber}</strong> to check your order status anytime.
            </p>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="text-muted-foreground">Track order page:</span>
              <Link to="/track-order" className="text-primary hover:underline font-medium">
                {window.location.origin}/track-order
              </Link>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Link
              to="/track-order"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-primary text-primary rounded-full font-medium hover:bg-primary/5 transition-all"
            >
              Track Another Order
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-all"
            >
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
