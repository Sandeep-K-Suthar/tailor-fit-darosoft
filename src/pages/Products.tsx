import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SiteLayout } from '@/components/layout/SiteLayout';
import { getProducts } from '@/services/products';
import { Product } from '@/types/product';
import { Search, ArrowRight, Package, Loader2, SlidersHorizontal } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((err) => setError(err.message || 'Failed to load products'))
      .finally(() => setLoading(false));
  }, []);

  const categoryOptions = useMemo(
    () => [
      { id: 'all', label: 'All' },
      { id: 'suits', label: 'Suits', dbCategory: 'suit' },
      { id: 'dress-shirts', label: 'Shirts', dbCategory: 'shirt' },
      { id: 'dress-pants', label: 'Pants', dbCategory: 'pants' },
      { id: 'blazers', label: 'Blazers', dbCategory: 'jacket' },
      { id: 'vests', label: 'Vests', dbCategory: 'vest' },
    ],
    []
  );

  const categoryMap = useMemo(
    () => ({
      suits: 'suit',
      'dress-shirts': 'shirt',
      blazers: 'jacket',
      'dress-pants': 'pants',
      tuxedos: 'suit',
      vests: 'vest',
    }),
    []
  );

  useEffect(() => {
    const param = searchParams.get('category') || 'all';
    const valid = categoryOptions.some((c) => c.id === param);
    setSelectedCategory(valid ? param : 'all');
  }, [searchParams, categoryOptions]);

  const formatPrice = useMemo(() => {
    const formatter = new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    });
    return (value: number) => formatter.format(value);
  }, []);

  const filteredProducts = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      if (selectedCategory !== 'all') {
        const mapped = categoryMap[selectedCategory as keyof typeof categoryMap];
        if (!mapped || product.category !== mapped) return false;
      }
      return !normalized || 
        product.name.toLowerCase().includes(normalized) ||
        product.description.toLowerCase().includes(normalized);
    });
  }, [products, searchTerm, selectedCategory, categoryMap]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'all') {
      searchParams.delete('category');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: categoryId });
    }
  };

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
            <h1 className="font-display text-3xl lg:text-4xl font-semibold text-foreground">
              Browse Products
            </h1>
            <p className="text-muted-foreground max-w-xl text-right">
              Explore our curated selection of customizable garments. Each piece can be tailored to your exact specifications.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-10 animate-fade-up stagger-1">
          <div className="flex flex-col lg:flex-row gap-4 p-4 bg-white rounded-2xl border border-border/50 shadow-soft">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted/30 border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Categories */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 lg:pb-0">
              <SlidersHorizontal className="w-5 h-5 text-muted-foreground shrink-0 mr-1" />
              {categoryOptions.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedCategory === category.id
                      ? 'bg-primary text-white shadow-soft'
                      : 'bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 animate-fade-up">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
            <p className="mt-6 text-muted-foreground">Loading collection...</p>
          </div>
        ) : error ? (
          <div className="text-center py-32 animate-fade-up">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
              <span className="text-3xl">😕</span>
            </div>
            <h3 className="font-display text-xl font-medium text-foreground mb-2">Something went wrong</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-32 animate-fade-up">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-medium text-foreground mb-2">No products found</h3>
            <p className="text-muted-foreground mb-6">
              {selectedCategory !== 'all' 
                ? 'This category is coming soon. Try exploring other categories.'
                : 'Try adjusting your search or filters.'}
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                handleCategoryChange('all');
              }}
              className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredProducts.map((product, index) => (
              <Link
                key={product._id}
                to={`/products/${product._id}`}
                className="group rounded-3xl bg-white border border-border/50 overflow-hidden shadow-soft hover:shadow-float transition-all duration-500 hover:-translate-y-2 animate-fade-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Image */}
                <div className="relative aspect-[4/5] bg-gradient-to-br from-muted/50 to-muted/30 overflow-hidden">
                  <img
                    src={product.images?.baseImage || `/images/placeholders/${product.category}.svg`}
                    alt={product.name}
                    className="w-full h-full object-contain p-6 transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  
                  {/* Quick View Button */}
                  <div className="absolute bottom-6 left-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                    <span className="flex items-center justify-center gap-2 w-full py-3 bg-white rounded-full text-sm font-medium text-foreground shadow-elevated">
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>

                  {/* Category Tag */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-foreground shadow-soft capitalize">
                      {product.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="font-display text-xl font-medium text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-1 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {product.description}
                  </p>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Starting from</p>
                      <p className="font-display text-xl font-semibold text-primary">{formatPrice(product.basePrice)}</p>
                    </div>
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all duration-300">
                      <ArrowRight className="w-5 h-5 text-primary group-hover:text-white transition-colors duration-300" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
