import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SiteLayout } from '@/components/layout/SiteLayout';
import { ArrowRight, Sparkles, Ruler, Palette, Clock, Shield, ChevronRight, ChevronLeft, Box, RotateCcw, ZoomIn } from 'lucide-react';
import { getProducts } from '@/services/products';
import { Product } from '@/types/product';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    getProducts().then(setProducts).catch(console.error);
  }, []);

  useEffect(() => {
    if (products.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % products.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [products.length]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(value);
  };

  const features = [
    { icon: Palette, title: 'Premium Fabrics', desc: 'Curated selection from the finest mills worldwide' },
    { icon: Ruler, title: 'Perfect Fit', desc: 'Made-to-measure precision for every body type' },
    { icon: Clock, title: 'Quick Delivery', desc: '2-3 weeks turnaround on all custom orders' },
    { icon: Shield, title: 'Quality Assured', desc: 'Handcrafted by master tailors with 20+ years experience' },
  ];

  const categories = [
    { id: 'suits', name: 'Custom Suits', price: 'From PKR 45,000', image: '/images/placeholders/suit.svg' },
    { id: 'dress-shirts', name: 'Dress Shirts', price: 'From PKR 8,500', image: '/images/placeholders/shirt.svg' },
    { id: 'dress-pants', name: 'Dress Pants', price: 'From PKR 12,000', image: '/images/placeholders/pants.svg' },
  ];

  const currentProduct = products[currentSlide];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % products.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + products.length) % products.length);

  return (
    <SiteLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-muted/50 to-background">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-sm font-semibold text-accent">Premium Bespoke Tailoring</span>
              </div>

              {/* Heading */}
              <div className="space-y-4">
                <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold text-foreground leading-[1.1]">
                  Tailored to
                  <span className="block text-gradient-gold">Perfection</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  Experience the art of bespoke tailoring. Design custom suits, shirts, and trousers
                  crafted exclusively for you.
                </p>
              </div>

              {/* CTA */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <Link
                  to="/products"
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-full font-semibold shadow-elevated hover:shadow-float transition-all duration-500 hover:-translate-y-1"
                >
                  Start Designing
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-border rounded-full font-semibold text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
                >
                  View Collection
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-4 justify-center lg:justify-start">
                {[
                  { value: '500+', label: 'Happy Clients' },
                  { value: '15+', label: 'Years Experience' },
                  { value: '100%', label: 'Satisfaction' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center lg:text-left">
                    <p className="font-display text-3xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Product Carousel */}
            <div className="relative">
              <div className="relative bg-white rounded-3xl p-6 shadow-float border border-border/50">
                {/* Carousel */}
                <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 overflow-hidden">
                  {products.length > 0 ? (
                    <>
                      {products.map((product, index) => (
                        <div
                          key={product._id}
                          className={`absolute inset-0 transition-all duration-700 ${index === currentSlide
                            ? 'opacity-100 translate-x-0'
                            : index < currentSlide
                              ? 'opacity-0 -translate-x-full'
                              : 'opacity-0 translate-x-full'
                            }`}
                        >
                          <img
                            src={product.images?.baseImage || `/images/placeholders/${product.category}.svg`}
                            alt={product.name}
                            className="w-full h-full object-contain p-8"
                          />
                        </div>
                      ))}

                      {/* Navigation Arrows */}
                      <button
                        onClick={prevSlide}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-soft flex items-center justify-center hover:bg-white transition-all"
                      >
                        <ChevronLeft className="w-5 h-5 text-foreground" />
                      </button>
                      <button
                        onClick={nextSlide}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-soft flex items-center justify-center hover:bg-white transition-all"
                      >
                        <ChevronRight className="w-5 h-5 text-foreground" />
                      </button>

                      {/* Dots */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {products.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-6 bg-primary' : 'bg-primary/30'
                              }`}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-gold flex items-center justify-center shadow-glow">
                          <Sparkles className="w-8 h-8 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Loading Products...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Info - Always show to prevent layout shift */}
                <div className="mt-4 flex items-center justify-between min-h-[80px]">
                  {currentProduct ? (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Now Viewing</p>
                        <h3 className="font-display text-lg font-semibold text-foreground">{currentProduct.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{currentProduct.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Starting from</p>
                        <p className="font-display text-xl font-bold text-primary">{formatPrice(currentProduct.basePrice)}</p>
                      </div>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-center py-4">
                      <p className="text-sm text-muted-foreground">Loading product details...</p>
                    </div>
                  )}
                </div>

                {/* CTA */}
                {currentProduct ? (
                  <Link
                    to={`/products/${currentProduct._id}`}
                    className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all"
                  >
                    Customize This
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <div className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-muted/50 rounded-xl font-semibold text-muted-foreground">
                    Loading...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-primary/[0.03]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Why Choose Us</p>
            <h2 className="font-display text-4xl font-semibold text-foreground">
              The Tailor Fit Difference
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 bg-white rounded-2xl border border-border/50 hover:shadow-elevated hover:-translate-y-1 transition-all duration-500"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-500">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3D Customization Showcase */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Content */}
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                  <Box className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">New Feature</span>
                </div>
                <h2 className="font-display text-4xl lg:text-5xl font-semibold text-foreground mb-4">
                  Experience
                  <span className="text-gradient-gold"> 3D Customization</span>
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Visualize your custom clothing in stunning 3D before ordering. Rotate, zoom, and see every detail with realistic fabric textures.
                </p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: RotateCcw, label: '360° Rotation', desc: 'View from any angle' },
                  { icon: ZoomIn, label: 'Zoom Detail', desc: 'See fabric texture up close' },
                  { icon: Palette, label: '12+ Fabrics', desc: 'Premium PBR textures' },
                  { icon: Sparkles, label: 'Realistic', desc: 'Lighting & shadows' },
                ].map((feat) => (
                  <div key={feat.label} className="flex items-start gap-3 p-4 rounded-2xl bg-muted/30 border border-border/50">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <feat.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{feat.label}</p>
                      <p className="text-xs text-muted-foreground">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Link
                to="/customize-3d/shirt"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-full font-semibold shadow-elevated hover:shadow-float transition-all duration-500 hover:-translate-y-1"
              >
                <Box className="w-5 h-5" />
                Try 3D Customizer
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Right - 3D Preview Card */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50 shadow-float p-8">
                {/* Preview Image Area */}
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center relative overflow-hidden">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-gold flex items-center justify-center shadow-glow animate-float">
                      <Box className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                      <p className="font-display text-xl font-semibold text-foreground">Interactive 3D Preview</p>
                      <p className="text-sm text-muted-foreground mt-1">Click to explore the customizer</p>
                    </div>
                  </div>

                  {/* Decoration */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                      <RotateCcw className="w-5 h-5 text-primary/70" />
                    </div>
                    <div className="absolute bottom-4 right-4 w-12 h-12 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                      <ZoomIn className="w-5 h-5 text-primary/70" />
                    </div>
                  </div>
                </div>

                {/* Info Bar */}
                <div className="mt-4 flex items-center justify-between p-4 rounded-xl bg-white border border-border/50">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Available Now</p>
                    <p className="font-display font-semibold text-foreground">3D Shirt Customizer</p>
                  </div>
                  <Link
                    to="/customize-3d/shirt"
                    className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white hover:scale-110 transition-transform"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-primary/[0.03]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Our Collection</p>
              <h2 className="font-display text-4xl font-semibold text-foreground">
                Shop by Category
              </h2>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all duration-300"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="group relative rounded-3xl overflow-hidden bg-muted/30 border border-border/50 shadow-soft hover:shadow-float transition-all duration-500 hover:-translate-y-2"
              >
                {/* Image */}
                <div className="aspect-[4/5] bg-gradient-to-br from-muted/50 to-muted/30 p-8 relative overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Content */}
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{category.price}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-primary p-12 lg:p-20">
            {/* Decorations */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/10 rounded-full blur-2xl" />

            <div className="relative max-w-2xl mx-auto text-center">
              <Sparkles className="w-12 h-12 text-accent mx-auto mb-6" />
              <h2 className="font-display text-4xl sm:text-5xl font-semibold text-white mb-6">
                Ready to Create Something Exceptional?
              </h2>
              <p className="text-lg text-white/70 mb-8">
                Begin your bespoke journey today. Our expert tailors are ready to bring your vision to life.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-primary rounded-full font-semibold shadow-glow hover:scale-105 transition-all duration-300"
              >
                Start Designing
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
