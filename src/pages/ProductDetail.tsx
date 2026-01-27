import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SiteLayout } from '@/components/layout/SiteLayout';
import { getProductById } from '@/services/products';
import { Product } from '@/types/product';
import { ArrowLeft, ArrowRight, Palette, Ruler, Shield, Sparkles, Star, Clock } from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getProductById(id)
      .then(setProduct)
      .catch((err) => setError(err.message || 'Failed to load product'))
      .finally(() => setLoading(false));
  }, [id]);

  const formatPrice = useMemo(() => {
    const formatter = new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    });
    return (value: number) => formatter.format(value);
  }, []);

  if (loading) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col items-center justify-center py-32 animate-fade-up">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="mt-6 text-muted-foreground">Loading product details...</p>
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (!product || error) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col items-center justify-center py-32 animate-fade-up">
            <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
              <span className="text-4xl">😕</span>
            </div>
            <h2 className="font-display text-2xl font-medium text-foreground mb-2">Product Not Found</h2>
            <p className="text-muted-foreground mb-8">{error || 'This product doesn\'t exist or has been removed.'}</p>
            <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-all">
              <ArrowLeft className="w-4 h-4" />
              Back to Products
            </Link>
          </div>
        </div>
      </SiteLayout>
    );
  }

  const features = [
    { icon: Palette, label: 'Premium Fabrics', desc: 'Curated selection' },
    { icon: Sparkles, label: 'Full Customization', desc: 'Every detail' },
    { icon: Ruler, label: 'Made to Measure', desc: 'Perfect fit' },
    { icon: Clock, label: 'Fast Delivery', desc: '2-3 weeks' },
  ];

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-8 animate-fade-up">
          <Link to="/products" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Collection
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground font-medium truncate">{product.name}</span>
        </nav>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left - Images */}
          <div className="space-y-4 animate-fade-up">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30 shadow-soft">
              {/* Main Image */}
              <div className="aspect-square p-10">
                <img
                  src={product.images?.baseImage || `/images/placeholders/${product.category}.svg`}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Category Badge */}
              <div className="absolute top-6 left-6">
                <span className="px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm text-sm font-medium text-foreground shadow-soft capitalize">
                  {product.category}
                </span>
              </div>

              {/* Rating Badge */}
              <div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-soft">
                <Star className="w-4 h-4 text-accent fill-accent" />
                <span className="text-sm font-medium">4.9</span>
              </div>
            </div>

            {/* Thumbnail Gallery */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {[1, 2, 3, 4].map((i) => (
                <button
                  key={i}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 ${i === 1 ? 'border-primary shadow-soft' : 'border-border/50 hover:border-primary/30'
                    }`}
                >
                  <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground">View {i}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right - Details */}
          <div className="space-y-8 animate-fade-up stagger-1">
            {/* Title */}
            <div>
              <h1 className="font-display text-3xl lg:text-4xl font-semibold text-foreground mb-4">
                {product.name}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Price Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Starting Price</span>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 text-accent">
                  <Sparkles className="w-3 h-3" />
                  <span className="text-xs font-medium">Customizable</span>
                </div>
              </div>
              <p className="font-display text-4xl font-semibold text-foreground">
                {formatPrice(product.basePrice)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Final price depends on fabric and customization choices
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, i) => (
                <div
                  key={feature.label}
                  className="p-4 rounded-xl bg-white border border-border/50 shadow-soft hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300"
                >
                  <feature.icon className="w-5 h-5 text-primary mb-2" />
                  <h4 className="font-medium text-sm text-foreground">{feature.label}</h4>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to={`/customize/${product._id}`}
                className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-gradient-luxury text-white rounded-full font-medium shadow-elevated hover:shadow-float hover:-translate-y-1 transition-all duration-500 group"
              >
                Start Customizing
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                to="/products"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-border rounded-full font-medium text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
              >
                Browse More
              </Link>
            </div>

            {/* Trust */}
            <div className="flex items-center justify-center gap-6 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-primary" />
                Quality Guaranteed
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                Expert Craftsmanship
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
