import { ReactNode, useState, useEffect, useMemo } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Scissors, Settings, ChevronDown, Menu, X, ArrowUpRight, Mail, Phone, MapPin, ShoppingBag, User, LogOut, Bookmark, Package, Clock, Layers, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useCustomerAuth } from '@/context/CustomerAuthContext';

type SiteLayoutProps = {
  children: ReactNode;
};

const customCategories = [
  { id: 'suits', label: 'Custom Suits', desc: 'Two & three-piece suits' },
  { id: 'dress-shirts', label: 'Dress Shirts', desc: 'Premium cotton shirts' },
  { id: 'dress-pants', label: 'Dress Pants', desc: 'Tailored trousers' },
  { id: 'blazers', label: 'Blazers', desc: 'Sport coats' },
  { id: 'tuxedos', label: 'Tuxedos', desc: 'Black tie formal' },
  { id: 'vests', label: 'Vests', desc: 'Waistcoats' },
];

export function SiteLayout({ children }: SiteLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showSavedDesigns, setShowSavedDesigns] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { itemCount, items, totalAmount, removeFromCart, updateQuantity } = useCart();
  const { customer, isAuthenticated, logout, deleteDesign } = useCustomerAuth();
  
  const savedDesignsCount = customer?.savedDesigns?.length || 0;

  const formatPrice = useMemo(() => {
    const formatter = new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    });
    return (value: number) => formatter.format(value);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
    setIsUserMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'bg-primary/95 backdrop-blur-xl shadow-elevated py-2' 
            : 'bg-primary py-3'
        }`}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between relative">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-accent/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500" />
                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-accent shadow-glow transition-all duration-300">
                  <Scissors className="h-5 w-5 text-primary transition-transform duration-300 group-hover:rotate-45" />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-display text-xl font-bold text-white">Tailor Fit</h1>
                <p className="text-[11px] font-medium text-white/60">Bespoke Tailoring</p>
              </div>
            </Link>

            {/* Center Navigation - Absolutely centered */}
            <nav className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-2 py-1.5">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `px-7 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                      isActive 
                        ? 'bg-white text-primary shadow-soft' 
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  Home
                </NavLink>

                {/* Custom Dropdown */}
                <div 
                  className="relative"
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  <button
                    className="flex items-center justify-center gap-1.5 pl-5 pr-[1.2rem] py-2.5 rounded-full text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
                    type="button"
                  >
                    Custom
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown */}
                  <div className={`absolute left-1/2 -translate-x-1/2 top-full pt-4 transition-all duration-300 ${
                    isDropdownOpen 
                      ? 'opacity-100 translate-y-0 pointer-events-auto' 
                      : 'opacity-0 -translate-y-2 pointer-events-none'
                  }`}>
                    <div className="w-[380px] rounded-2xl bg-white border border-border/50 p-3 shadow-float">
                      <div className="grid grid-cols-2 gap-1">
                        {customCategories.map((category, i) => (
                          <Link
                            key={category.id}
                            to={`/products?category=${category.id}`}
                            className="group flex items-start gap-3 rounded-xl p-3 hover:bg-muted/50 transition-all duration-300"
                          >
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center shrink-0 group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-300">
                              <Scissors className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{category.label}</p>
                              <p className="text-xs text-muted-foreground">{category.desc}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <Link
                          to="/products"
                          className="flex items-center justify-between rounded-xl p-3 bg-gradient-to-r from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 transition-all duration-300 group"
                        >
                          <span className="text-sm font-medium text-foreground">View All Products</span>
                          <ArrowUpRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <NavLink
                  to="/products"
                  className={({ isActive }) =>
                    `px-7 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                      isActive 
                        ? 'bg-white text-primary shadow-soft' 
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  Collection
                </NavLink>
              </div>
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-2 sm:gap-3 z-10">
              {/* Saved Designs Button - Only show when authenticated */}
              {isAuthenticated && (
                <button 
                  onClick={() => { setShowSavedDesigns(true); setShowCartDrawer(false); }}
                  className="relative p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
                  title="Saved Designs"
                >
                  <Bookmark className="w-5 h-5" />
                  {savedDesignsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-primary text-xs font-bold flex items-center justify-center">
                      {savedDesignsCount}
                    </span>
                  )}
                </button>
              )}

              {/* Cart Button */}
              <button 
                onClick={() => { setShowCartDrawer(true); setShowSavedDesigns(false); }}
                className="relative p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-primary text-xs font-bold flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* User Account */}
              {isAuthenticated ? (
                <div 
                  className="relative"
                  onMouseEnter={() => setIsUserMenuOpen(true)}
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <button
                    className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
                  >
                    <User className="h-4 w-4" />
                    <span className="max-w-[100px] truncate">{customer?.name?.split(' ')[0]}</span>
                  </button>
                  
                  {/* User Dropdown */}
                  <div className={`absolute right-0 top-full pt-2 transition-all duration-300 ${
                    isUserMenuOpen 
                      ? 'opacity-100 translate-y-0 pointer-events-auto' 
                      : 'opacity-0 -translate-y-2 pointer-events-none'
                  }`}>
                    <div className="w-48 rounded-xl bg-white border border-border/50 p-2 shadow-float">
                      <Link
                        to="/account?tab=profile"
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        My Account
                      </Link>
                      <Link
                        to="/account?tab=orders"
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <Package className="w-4 h-4" />
                        My Orders
                      </Link>
                      <Link
                        to="/account?tab=designs"
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <Bookmark className="w-4 h-4" />
                        Saved Designs
                      </Link>
                      <div className="border-t border-border/50 my-1" />
                      <button
                        onClick={() => { logout(); setIsUserMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link 
                  to="/auth" 
                  className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
                >
                  <User className="h-4 w-4" />
                  <span>Sign In</span>
                </Link>
              )}

              <Link 
                to="/admin" 
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold bg-white text-primary hover:bg-white/90 shadow-soft transition-all duration-300"
              >
                <Settings className="h-4 w-4" />
                <span>Admin</span>
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden absolute top-full left-0 right-0 bg-primary border-t border-white/10 shadow-elevated transition-all duration-500 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <nav className="container mx-auto px-4 py-6 space-y-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 ${
                  isActive ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/products"
              className={({ isActive }) =>
                `block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 ${
                  isActive ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              Collection
            </NavLink>
            
            <div className="pt-3 mt-3 border-t border-white/10">
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                Custom Clothing
              </p>
              {customCategories.map((category) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.id}`}
                  className="block px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                >
                  {category.label}
                </Link>
              ))}
            </div>

            <div className="pt-3 mt-3 border-t border-white/10">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/account"
                    className="flex items-center gap-2 px-4 py-3 text-base font-semibold text-white/80 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-300"
                  >
                    <User className="w-4 h-4" />
                    My Account
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-base font-semibold text-red-300 hover:bg-white/10 hover:text-red-200 rounded-xl transition-all duration-300"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="flex items-center gap-2 px-4 py-3 text-base font-semibold text-white/80 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-300"
                >
                  <User className="w-4 h-4" />
                  Sign In / Sign Up
                </Link>
              )}
            </div>

            <div className="pt-3 mt-3 border-t border-white/10">
              <Link
                to="/admin"
                className="flex items-center gap-2 px-4 py-3 text-base font-semibold text-white/80 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-300"
              >
                <Settings className="w-4 h-4" />
                Admin Panel
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Saved Designs Drawer */}
      {isAuthenticated && (
        <>
          <div 
            className={`fixed inset-0 z-[100] transition-opacity duration-300 ${showSavedDesigns ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setShowSavedDesigns(false)}
          >
            <div className="fixed inset-0 bg-black/50" />
            <div 
              className={`absolute right-0 top-[68px] bottom-0 w-96 max-w-[90vw] bg-white shadow-float overflow-y-auto transition-transform duration-300 ease-out ${showSavedDesigns ? 'translate-x-0' : 'translate-x-full'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-border/50 p-4 z-10">
                <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-primary" />
                  Saved Designs
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{savedDesignsCount} saved design{savedDesignsCount !== 1 ? 's' : ''}</p>
              </div>
              <div className="p-4">
                {savedDesignsCount === 0 ? (
                  <div className="text-center py-8">
                    <Bookmark className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No saved designs yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">Save your current configuration to see it here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customer?.savedDesigns?.map((design) => (
                      <div key={design._id} className="p-3 rounded-xl border border-border/50 bg-muted/30 hover:border-primary/30 transition-all">
                        <div className="flex gap-3">
                          <div className="w-16 h-16 rounded-lg bg-white border border-border/30 overflow-hidden shrink-0">
                            {design.baseImage ? (
                              <img 
                                src={design.baseImage} 
                                alt={design.productName}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Layers className="w-6 h-6 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{design.productName}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {new Date(design.savedAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm font-semibold text-primary mt-1">{formatPrice(design.totalPrice)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => {
                              navigate(`/customize/${design.productId}?restore=${design._id}`);
                              setShowSavedDesigns(false);
                            }}
                            className="flex-1 px-3 py-2 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
                          >
                            Open Design
                          </button>
                          <button
                            onClick={async () => {
                              if (await deleteDesign(design._id)) {
                                // Design deleted, drawer will update via context
                              }
                            }}
                            className="px-3 py-2 text-xs font-semibold text-destructive bg-destructive/10 rounded-lg hover:bg-destructive/20 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Cart Drawer */}
      <div 
        className={`fixed inset-0 z-[100] transition-opacity duration-300 ${showCartDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setShowCartDrawer(false)}
      >
        <div className="fixed inset-0 bg-black/50" />
        <div 
          className={`absolute right-0 top-[68px] bottom-0 w-96 max-w-[90vw] bg-white shadow-float overflow-y-auto transition-transform duration-300 ease-out ${showCartDrawer ? 'translate-x-0' : 'translate-x-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white border-b border-border/50 p-4 z-10">
            <h3 className="font-display text-lg font-semibold flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              Shopping Cart
            </h3>
            <p className="text-xs text-muted-foreground mt-1">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="p-4 flex-1">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Your cart is empty</p>
                <p className="text-xs text-muted-foreground mt-1">Add items to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl border border-border/50 bg-muted/30">
                    <div className="flex gap-3">
                      <div className="w-14 h-14 rounded-lg bg-white border border-border/30 overflow-hidden shrink-0">
                        {item.baseImage ? (
                          <img 
                            src={item.baseImage} 
                            alt={item.productName}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Layers className="w-5 h-5 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{item.productName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{item.productCategory}</p>
                        <p className="text-sm font-semibold text-primary mt-1">{formatPrice(item.totalPrice)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 border border-border/50 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-xs font-semibold hover:bg-muted transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-xs font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-xs font-semibold hover:bg-muted transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {items.length > 0 && (
            <div className="sticky bottom-0 bg-white border-t border-border/50 p-4">
              <div className="flex justify-between mb-4">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-display text-lg font-bold">{formatPrice(totalAmount)}</span>
              </div>
              <Link
                to="/checkout"
                onClick={() => setShowCartDrawer(false)}
                className="block w-full py-3 bg-primary text-white text-center font-semibold rounded-full hover:bg-primary/90 transition-colors"
              >
                Proceed to Checkout
              </Link>
              <Link
                to="/cart"
                onClick={() => setShowCartDrawer(false)}
                className="block w-full py-2 mt-2 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                View Full Cart
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-primary text-white mt-auto">
        {/* Top Section */}
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="grid gap-12 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-2 space-y-6">
              <Link to="/" className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent shadow-glow">
                  <Scissors className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">Tailor Fit</h2>
                  <p className="text-sm text-white/60">Bespoke Tailoring</p>
                </div>
              </Link>
              <p className="text-white/70 leading-relaxed max-w-md">
                Crafting exceptional custom garments since 2020. Every piece is tailored to perfection, 
                combining traditional craftsmanship with modern design.
              </p>
              <div className="flex gap-4">
                {['facebook', 'instagram', 'twitter'].map((social) => (
                  <a 
                    key={social}
                    href="#" 
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent hover:text-primary transition-all duration-300"
                  >
                    <span className="text-xs font-bold uppercase">{social[0]}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-display text-lg font-semibold mb-6">Quick Links</h3>
              <ul className="space-y-3">
                {[
                  { label: 'Home', path: '/' },
                  { label: 'Collection', path: '/products' },
                  { label: 'Track Order', path: '/track-order' },
                  { label: 'Custom Suits', path: '/products?category=suits' },
                ].map((link) => (
                  <li key={link.label}>
                    <Link 
                      to={link.path}
                      className="text-white/70 hover:text-accent transition-colors duration-300 flex items-center gap-2 group"
                    >
                      <span className="w-0 h-px bg-accent transition-all duration-300 group-hover:w-4" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-display text-lg font-semibold mb-6">Contact Us</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <span className="text-white/70">Clifton, Karachi<br />Pakistan</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-accent shrink-0" />
                  <a href="mailto:info@tailorfit.pk" className="text-white/70 hover:text-accent transition-colors">
                    info@tailorfit.pk
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-accent shrink-0" />
                  <a href="tel:+923001234567" className="text-white/70 hover:text-accent transition-colors">
                    +92 300 1234567
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10">
          <div className="container mx-auto px-4 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-white/50">
                © {new Date().getFullYear()} Tailor Fit. All rights reserved.
              </p>
              <p className="text-sm text-white/50 flex items-center gap-2">
                Crafted with <span className="text-red-400">♥</span> in Pakistan
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
