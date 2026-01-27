import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useCustomization as useShirt } from '@/context/CustomizationContext';
import { useCart } from '@/context/CartContext';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Eye, Layers, Ruler, Save, ShoppingBag, Sparkles, Bookmark, Clock, Settings, Scissors, Home, User, Trash2, Plus, Minus, LogOut, Package } from 'lucide-react';
import { toast } from 'sonner';
import defaultShirt from '@/assets/shirt-preview.png';
import * as ShirtData from '@/data/ShirtCustomizationData';

export default function CustomizePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const restoreDesignId = searchParams.get('restore');
  const { addToCart, itemCount, items, removeFromCart, updateQuantity, totalAmount } = useCart();
  const { customer, isAuthenticated, logout, saveDesign, saveMeasurements, deleteDesign } = useCustomerAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const {
    loadProduct,
    product,
    config,
    totalPrice,
    fabrics,
    productFabrics,
    collars,
    cuffs,
    pockets,
    buttons,
    sleeves,
    plackets,
    backs,
    neckties,
    bowties,
    styleGroups,
    setFabric,
    setCollar,
    setCuff,
    setPocket,
    setButton,
    setSleeve,
    setBack,
    setNecktie,
    setBowtie,
    setStyle,
    updateMeasurements,
    viewMode,
    setViewMode,
  } = useShirt();

  const [activeStep, setActiveStep] = useState('fabric');
  const [saved, setSaved] = useState(false);
  const [savedDesigns, setSavedDesigns] = useState<any[]>([]);
  const [showSavedDesigns, setShowSavedDesigns] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (id) loadProduct(id);
  }, [id, loadProduct]);

  // Load saved designs from both localStorage and account (for current product only in drawer)
  useEffect(() => {
    try {
      const localDesigns = JSON.parse(localStorage.getItem('tailorFitSavedConfigs') || '[]');
      const localFiltered = localDesigns.filter((d: any) => d.productId === id);

      // Also include saved designs from account if authenticated (for current product)
      const accountDesigns = customer?.savedDesigns?.filter((d: any) => d.productId === id) || [];

      // Combine and deduplicate by ID - prioritize account designs
      const combined: any[] = [];
      const seenIds = new Set<string>();

      // Add account designs first
      accountDesigns.forEach((ad: any) => {
        const designId = ad._id || ad.id;
        if (designId && !seenIds.has(designId)) {
          seenIds.add(designId);
          combined.push({
            ...ad,
            id: ad._id || ad.id,
            _id: ad._id || ad.id,
            savedAt: ad.savedAt || new Date().toISOString()
          });
        }
      });

      // Add local designs that aren't already in account
      localFiltered.forEach((ld: any) => {
        const designId = ld.id || ld._id;
        if (designId && !seenIds.has(designId)) {
          seenIds.add(designId);
          combined.push(ld);
        }
      });

      setSavedDesigns(combined);
    } catch (error) {
      console.error('Error loading saved designs:', error);
      setSavedDesigns([]);
    }
  }, [id, customer?.savedDesigns]);

  // Count total designs for the badge
  const totalSavedDesignsCount = useMemo(() => {
    const localDesigns = JSON.parse(localStorage.getItem('tailorFitSavedConfigs') || '[]');
    const accountDesigns = customer?.savedDesigns || [];

    // Merge local and account designs, remove duplicates
    const allDesigns = [...localDesigns];
    accountDesigns.forEach((ad: any) => {
      if (!allDesigns.find((d: any) => (d.id === ad._id || d._id === ad._id) && d.productId === ad.productId)) {
        allDesigns.push({
          ...ad,
          id: ad._id,
          productId: ad.productId
        });
      }
    });

    return allDesigns.length;
  }, [customer?.savedDesigns]);

  // Track restoration state
  const [restoredId, setRestoredId] = useState<string | null>(null);

  // Clear tracking when product changes
  useEffect(() => {
    setRestoredId(null);
  }, [id, restoreDesignId]);

  // Handle design restoration on page load
  useEffect(() => {
    // Prevent double restoration
    if (!restoreDesignId || restoredId === restoreDesignId) return;
    if (!product) return;

    const performRestore = () => {
      try {
        // Check account first, then local storage
        let savedDesign = customer?.savedDesigns?.find((d: any) => d._id === restoreDesignId || d.id === restoreDesignId);

        if (!savedDesign) {
          try {
            const localDesigns = JSON.parse(localStorage.getItem('tailorFitSavedConfigs') || '[]');
            savedDesign = localDesigns.find((d: any) => (d.id === restoreDesignId || d._id === restoreDesignId) && d.productId === id);
          } catch (e) {
            console.error('Error reading localStorage:', e);
            return;
          }
        }

        if (!savedDesign) {
          console.log('Design not found for restore:', restoreDesignId);
          return;
        }

        // Mark as restored
        setRestoredId(restoreDesignId);

        const designToRestore = savedDesign;

        // Give data a moment to settle, then restore
        setTimeout(() => {
          try {
            // Restore fabric first
            if (designToRestore.fabric && Array.isArray(productFabrics) && productFabrics.length > 0) {
              const fabricOption = productFabrics.find((f: any) => f.id === designToRestore.fabric.id);
              if (fabricOption) {
                setFabric(fabricOption);
              }
            }

            // Restore styles after a brief delay
            setTimeout(() => {
              if (designToRestore.styles) {
                Object.entries(designToRestore.styles).forEach(([key, value]: [string, any]) => {
                  if (!value || !value.id) return;

                  // Handle shirt options
                  if (key === 'collar' && Array.isArray(collars) && collars.length > 0) {
                    const opt = collars.find((o: any) => o.id === value.id);
                    if (opt) setTimeout(() => setCollar(opt), 50);
                  } else if (key === 'cuff' && Array.isArray(cuffs) && cuffs.length > 0) {
                    const opt = cuffs.find((o: any) => o.id === value.id);
                    if (opt) setTimeout(() => setCuff(opt), 100);
                  } else if (key === 'pocket' && Array.isArray(pockets) && pockets.length > 0) {
                    const opt = pockets.find((o: any) => o.id === value.id);
                    if (opt) setTimeout(() => setPocket(opt), 150);
                  } else if (key === 'button' && Array.isArray(buttons) && buttons.length > 0) {
                    const opt = buttons.find((o: any) => o.id === value.id);
                    if (opt) setTimeout(() => setButton(opt), 200);
                  } else if (key === 'sleeve' && Array.isArray(sleeves) && sleeves.length > 0) {
                    const opt = sleeves.find((o: any) => o.id === value.id);
                    if (opt) setTimeout(() => setSleeve(opt), 250);
                  } else if (key === 'back' && Array.isArray(backs) && backs.length > 0) {
                    const opt = backs.find((o: any) => o.id === value.id);
                    if (opt) setTimeout(() => setBack(opt), 300);
                  } else {
                    // Handle dynamic groups
                    const group = styleGroups[key];
                    if (group && Array.isArray(group) && group.length > 0) {
                      const opt = group.find((o: any) => o.id === value.id);
                      if (opt) setTimeout(() => setStyle(key, opt), 350);
                    }
                  }
                });
              }

              // Finally restore measurements
              setTimeout(() => {
                if (designToRestore.measurements) {
                  Object.entries(designToRestore.measurements).forEach(([key, value]) => {
                    if (value) updateMeasurements({ [key]: value });
                  });
                }

                toast.success('Design restored!', { description: designToRestore.productName || designToRestore.name });
              }, 400);
            }, 200);
          } catch (error) {
            console.error('Error restoring design:', error);
          }
        }, 1500); // Wait for initial loads
      } catch (error) {
        console.error('Error in restore useEffect:', error);
      }
    };

    // Ensure fabrics are loaded
    if (Array.isArray(productFabrics) && productFabrics.length > 0) {
      performRestore();
    } else {
      // Retry until loaded
      const checkInterval = setInterval(() => {
        if (Array.isArray(productFabrics) && productFabrics.length > 0) {
          clearInterval(checkInterval);
          performRestore();
        }
      }, 200);

      // Timeout after 10s
      setTimeout(() => clearInterval(checkInterval), 10000);

      return () => clearInterval(checkInterval);
    }
  }, [restoreDesignId, restoredId, customer?.savedDesigns, product, productFabrics, collars, cuffs, pockets, buttons, sleeves, backs, styleGroups, id, setFabric, setCollar, setCuff, setPocket, setButton, setSleeve, setBack, setStyle, updateMeasurements]);

  const formatPrice = useMemo(() => {
    const formatter = new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    });
    return (value: number) => formatter.format(value || 0);
  }, []);

  // Calculate color hue
  const getHueFromColor = (color: string): number => {
    if (!color || color === '#FFFFFF' || color === '#ffffff') return 0;
    // Basic hue math
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    if (max === r) h = ((g - b) / (max - min)) * 60;
    else if (max === g) h = (2 + (b - r) / (max - min)) * 60;
    else h = (4 + (r - g) / (max - min)) * 60;
    return h < 0 ? h + 360 : h;
  };

  const isShirt = !product || product.category === 'shirt';
  const optionGroups = product?.customizationOptions?.optionGroups || [];
  // prioritize product-specific fabrics
  const fabricOptions = useMemo(() => {
    if (productFabrics.length > 0) return productFabrics;
    if (fabrics.length > 0) return fabrics;
    return [];
  }, [productFabrics, fabrics]);
  const isHalfSleeve = config.sleeve?.name?.toLowerCase().includes('half') || config.sleeve?.name?.toLowerCase().includes('short');

  // Define steps based on category
  const steps = useMemo(() => {
    const baseSteps = [{ id: 'fabric', label: 'Fabric', icon: Layers }];

    if (optionGroups.length > 0) {
      optionGroups.forEach((group: any) => {
        baseSteps.push({
          id: group.category || group.id,
          label: group.label || group.category || group.id,
          icon: Sparkles,
        });
      });
    } else if (isShirt) {
      if (collars.length || ShirtData.COLLARS.length) baseSteps.push({ id: 'collar', label: 'Collar', icon: Sparkles });
      if (cuffs.length || ShirtData.CUFFS.length) baseSteps.push({ id: 'cuff', label: 'Cuffs', icon: Sparkles });
      if (plackets.length) baseSteps.push({ id: 'placket', label: 'Placket', icon: Sparkles });
      if (pockets.length || ShirtData.CHEST_POCKETS.length) baseSteps.push({ id: 'pocket', label: 'Pocket', icon: Sparkles });
      if (buttons.length || ShirtData.BUTTONS.length) baseSteps.push({ id: 'button', label: 'Buttons', icon: Sparkles });
      if (sleeves.length || ShirtData.SLEEVES.length) baseSteps.push({ id: 'sleeve', label: 'Sleeves', icon: Sparkles });
      if (neckties.length || ShirtData.NECKTIES.length) baseSteps.push({ id: 'necktie', label: 'Necktie', icon: Sparkles });
      if (bowties.length || ShirtData.BOWTIES.length) baseSteps.push({ id: 'bowtie', label: 'Bowtie', icon: Sparkles });
      if (backs.length) baseSteps.push({ id: 'back', label: 'Back', icon: Sparkles });
    } else {
      Object.keys(styleGroups).forEach((key) => {
        baseSteps.push({ id: key, label: key, icon: Sparkles });
      });
    }

    baseSteps.push({ id: 'measurements', label: 'Measurements', icon: Ruler });
    return baseSteps;
  }, [optionGroups, isShirt, collars.length, cuffs.length, plackets.length, pockets.length, buttons.length, sleeves.length, neckties.length, bowties.length, backs.length, styleGroups]);

  const getStepOptions = (stepId: string) => {
    const group = optionGroups.find((g: any) => (g.category || g.id) === stepId);
    if (group?.options?.length) return group.options;

    if (isShirt) {
      const map: Record<string, any[]> = {
        collar: collars.length ? collars : ShirtData.COLLARS,
        cuff: cuffs.length ? cuffs : ShirtData.CUFFS,
        pocket: pockets.length ? pockets : ShirtData.CHEST_POCKETS,
        button: buttons.length ? buttons : ShirtData.BUTTONS,
        sleeve: sleeves.length ? sleeves : ShirtData.SLEEVES,
        necktie: neckties.length ? neckties : ShirtData.NECKTIES,
        bowtie: bowties.length ? bowties : ShirtData.BOWTIES,
        placket: plackets,
        back: backs,
      };
      return map[stepId] || [];
    }
    return styleGroups[stepId] || [];
  };

  const getSelectedOption = (stepId: string) => {
    if (isShirt && ['collar', 'cuff', 'pocket', 'button', 'sleeve', 'placket', 'back', 'necktie', 'bowtie'].includes(stepId)) {
      return config[stepId as keyof typeof config] as any;
    }
    return config.styles?.[stepId] || null;
  };

  const handleSelectOption = (stepId: string, option: any) => {
    if (isShirt) {
      const setters: Record<string, (o: any) => void> = {
        collar: setCollar, cuff: setCuff, pocket: setPocket,
        button: setButton, sleeve: setSleeve, back: setBack,
        necktie: setNecktie, bowtie: setBowtie,
      };
      if (setters[stepId]) {
        setters[stepId](option);
        return;
      }
    }
    setStyle(stepId, option as any);
  };

  const saveDraft = async () => {
    if (!product) return;

    // Prepare styles for saving
    const styles: Record<string, any> = {};
    if (config.styles) {
      Object.entries(config.styles).forEach(([key, opt]) => {
        if (opt) {
          styles[key] = { id: opt.id, name: opt.name, priceModifier: opt.priceModifier || 0 };
        }
      });
    }
    if (isShirt) {
      if (config.collar) styles.collar = { id: config.collar.id, name: config.collar.name };
      if (config.cuff) styles.cuff = { id: config.cuff.id, name: config.cuff.name };
      if (config.pocket) styles.pocket = { id: config.pocket.id, name: config.pocket.name };
      if (config.button) styles.button = { id: config.button.id, name: config.button.name };
      if (config.sleeve) styles.sleeve = { id: config.sleeve.id, name: config.sleeve.name };
      if (config.back) styles.back = { id: config.back.id, name: config.back.name };
    }

    const payload = {
      id: `${product._id}-${Date.now()}`,
      productId: product._id,
      productName: product.name,
      productCategory: product.category,
      baseImage: product.images?.baseImage || `/images/placeholders/${product.category}.svg`,
      fabric: config.fabric ? { id: config.fabric.id, name: config.fabric.name, image: config.fabric.image } : null,
      styles,
      measurements: config.measurements || {},
      totalPrice,
      savedAt: new Date().toISOString(),
    };

    // Save based on auth state
    if (isAuthenticated && saveDesign) {
      const result = await saveDesign({
        productId: product._id,
        productName: product.name,
        productCategory: product.category,
        baseImage: product.images?.baseImage || `/images/placeholders/${product.category}.svg`,
        fabric: config.fabric ? { id: config.fabric.id, name: config.fabric.name, image: config.fabric.image || '' } : null,
        styles,
        measurements: config.measurements || {},
        totalPrice,
      });

      if (result.success) {
        toast.success('Design saved to your account!');
      } else {
        toast.error('Failed to save design');
      }
    } else {
      // Local storage fallback for guests
      const localPayload = { ...payload, config };
      const existing = JSON.parse(localStorage.getItem('tailorFitSavedConfigs') || '[]');

      // Prevent duplicates
      const filtered = existing.filter((d: any) => d.productId !== id);
      const next = [localPayload, ...filtered].slice(0, 20);
      localStorage.setItem('tailorFitSavedConfigs', JSON.stringify(next));
      setSavedDesigns(next.filter((d: any) => d.productId === id));
      toast.success('Design saved!', { description: 'Sign in to save to your account' });
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const restoreDraft = (design: any) => {
    if (!design.config) return;

    // Restore fabric
    if (design.config.fabric) {
      setFabric(design.config.fabric);
    }

    // Restore shirt-specific options
    if (isShirt) {
      if (design.config.collar) setCollar(design.config.collar);
      if (design.config.cuff) setCuff(design.config.cuff);
      if (design.config.pocket) setPocket(design.config.pocket);
      if (design.config.button) setButton(design.config.button);
      if (design.config.sleeve) setSleeve(design.config.sleeve);
      if (design.config.back) setBack(design.config.back);
    }

    // Restore styles
    if (design.config.styles) {
      Object.entries(design.config.styles).forEach(([key, option]) => {
        if (option) setStyle(key, option);
      });
    }

    // Restore measurements
    if (design.config.measurements) {
      updateMeasurements(design.config.measurements);
    }

    setShowSavedDesigns(false);
    toast.success('Design restored!');
  };

  const deleteDraft = async (designId: string) => {
    // Check if it's an account design (has _id)
    const accountDesign = customer?.savedDesigns?.find((d: any) => d._id === designId);

    if (accountDesign && isAuthenticated) {
      // Delete from account
      const result = await deleteDesign(designId);
      if (result.success) {
        toast.success('Design deleted from your account');
        // Refresh saved designs list
        const accountDesigns = customer?.savedDesigns?.filter((d: any) => d.productId === id && d._id !== designId) || [];
        const localDesigns = JSON.parse(localStorage.getItem('tailorFitSavedConfigs') || '[]');
        const localFiltered = localDesigns.filter((d: any) => d.productId === id);
        const combined = [...localFiltered];
        accountDesigns.forEach((ad: any) => {
          if (!combined.find((d: any) => d.id === ad._id || d._id === ad._id)) {
            combined.push({
              ...ad,
              id: ad._id,
              savedAt: ad.savedAt || new Date().toISOString()
            });
          }
        });
        setSavedDesigns(combined);
      } else {
        toast.error('Failed to delete design');
      }
    } else {
      // Delete from localStorage
      const existing = JSON.parse(localStorage.getItem('tailorFitSavedConfigs') || '[]');
      const next = existing.filter((d: any) => d.id !== designId);
      localStorage.setItem('tailorFitSavedConfigs', JSON.stringify(next));
      setSavedDesigns(next.filter((d: any) => d.productId === id));
      toast.success('Design deleted');
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    setAddingToCart(true);

    // Build styles object from config
    const styles: Record<string, { id: string; name: string; priceModifier: number }> = {};
    if (config.styles) {
      Object.entries(config.styles).forEach(([key, opt]) => {
        if (opt) {
          styles[key] = {
            id: opt.id,
            name: opt.name,
            priceModifier: opt.priceModifier || 0,
          };
        }
      });
    }
    // Add shirt-specific options
    if (isShirt) {
      if (config.collar) styles.collar = { id: config.collar.id, name: config.collar.name, priceModifier: 0 };
      if (config.cuff) styles.cuff = { id: config.cuff.id, name: config.cuff.name, priceModifier: 0 };
      if (config.pocket) styles.pocket = { id: config.pocket.id, name: config.pocket.name, priceModifier: 0 };
      if (config.button) styles.button = { id: config.button.id, name: config.button.name, priceModifier: 0 };
      if (config.sleeve) styles.sleeve = { id: config.sleeve.id, name: config.sleeve.name, priceModifier: 0 };
      if (config.back) styles.back = { id: config.back.id, name: config.back.name, priceModifier: 0 };
    }

    addToCart({
      productId: product._id,
      productName: product.name,
      productCategory: product.category,
      baseImage: product.images?.baseImage || `/images/placeholders/${product.category}.svg`,
      fabric: config.fabric ? {
        id: config.fabric.id,
        name: config.fabric.name,
        priceModifier: config.fabric.priceModifier || 0,
      } : null,
      styles,
      measurements: config.measurements || {},
      basePrice: product.basePrice,
      totalPrice,
    });

    toast.success('Added to cart!', {
      description: product.name,
      action: {
        label: 'View Cart',
        onClick: () => navigate('/cart'),
      },
    });

    setAddingToCart(false);
  };

  const measurementFields = useMemo(() => {
    if (product?.category === 'pants') {
      return ['waist', 'hips', 'rise', 'inseam', 'outseam', 'thigh', 'knee', 'legOpening'];
    }
    if (product?.category === 'suit') {
      return ['neck', 'chest', 'waist', 'hips', 'shoulder', 'sleeveLength', 'jacketLength', 'bicep'];
    }
    return ['neck', 'chest', 'waist', 'hips', 'shoulder', 'sleeveLength', 'shirtLength'];
  }, [product?.category]);

  // Preview layers logic - properly handle front/back view and fabric changes
  // Get current fabric color from ShirtData or default to white
  const currentFabricColor: ShirtData.FabricColor = useMemo(() => {
    // Method 1: Check if fabric has a direct 'color' property matching ShirtData colors
    if (config.fabric?.color && ShirtData.FABRIC_COLORS.includes(config.fabric.color as ShirtData.FabricColor)) {
      return config.fabric.color as ShirtData.FabricColor;
    }

    // Method 2: Try to extract color from fabric id (e.g., "fabric-light-blue" -> "light-blue")
    if (config.fabric?.id) {
      const colorFromId = config.fabric.id.replace('fabric-', '');
      if (ShirtData.FABRIC_COLORS.includes(colorFromId as ShirtData.FabricColor)) {
        return colorFromId as ShirtData.FabricColor;
      }
    }

    // Method 3: Try to extract color from fabric name (e.g., "Light Blue" -> "light-blue")
    if (config.fabric?.name) {
      const normalizedName = config.fabric.name.toLowerCase().replace(/\s+/g, '-');
      if (ShirtData.FABRIC_COLORS.includes(normalizedName as ShirtData.FabricColor)) {
        return normalizedName as ShirtData.FabricColor;
      }
      // Also try without hyphens for single-word colors like "White", "Champagne"
      const singleWordName = config.fabric.name.toLowerCase();
      if (ShirtData.FABRIC_COLORS.includes(singleWordName as ShirtData.FabricColor)) {
        return singleWordName as ShirtData.FabricColor;
      }
    }

    return 'white';
  }, [config.fabric]);

  const baseImage = useMemo(() => {
    if (viewMode === 'back') {
      // For back view, use the fabric-specific back image
      return config.fabric?.backPreviewImage || ShirtData.getBackBasePath(currentFabricColor);
    }
    // For front view, use the fabric-specific front image
    return config.fabric?.previewImage || ShirtData.getFrontBasePath(currentFabricColor);
  }, [viewMode, currentFabricColor, config.fabric]);

  const previewLayers = useMemo(() => {
    if (isShirt) {
      return [
        { key: 'sleeve', zIndex: ShirtData.LAYER_Z_INDEX.sleeves },
        { key: 'cuff', zIndex: ShirtData.LAYER_Z_INDEX.cuffs },
        { key: 'collar', zIndex: ShirtData.LAYER_Z_INDEX.collar },
        { key: 'pocket', zIndex: ShirtData.LAYER_Z_INDEX.chestPocket },
        { key: 'button', zIndex: ShirtData.LAYER_Z_INDEX.buttons },
        { key: 'necktie', zIndex: ShirtData.LAYER_Z_INDEX.necktie },
        { key: 'bowtie', zIndex: ShirtData.LAYER_Z_INDEX.bowtie },
        { key: 'back', zIndex: 200 },
      ];
    }

    // Dynamic layers for Pants and other categories
    if (product?.category === 'pants') {
      const getOpt = (k: string) => config.styles?.[k];

      if (viewMode === 'back') {
        return [
          // Note: 'fit' often defines the base shape, if it has a visual component
          { key: 'fit', zIndex: 10, option: getOpt('fit') },
          { key: 'back-pockets', zIndex: 20, option: getOpt('back-pockets') },
          { key: 'waist', zIndex: 30, option: getOpt('waist') },
          { key: 'cuffs', zIndex: 40, option: getOpt('cuffs') }
        ].filter(l => l.option);
      }
      return [
        { key: 'fit', zIndex: 10, option: getOpt('fit') },
        { key: 'fastening', zIndex: 50, option: getOpt('fastening') },
        { key: 'waist', zIndex: 30, option: getOpt('waist') }, // Updated from belt to waist
        { key: 'pleats', zIndex: 40, option: getOpt('pleats') },
        { key: 'cuffs', zIndex: 45, option: getOpt('cuffs') }
      ].filter(l => l.option);
    }

    // Default fallthrough for generic products
    return Object.entries(config.styles || {})
      .map(([key, option], index) => ({ key, option, zIndex: 20 + index * 10 }));
  }, [config.styles, isShirt, viewMode, product?.category]);

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col lg:h-screen lg:w-screen lg:overflow-hidden">
      {/* Header - Matching Homepage Spacing */}
      <header className="bg-primary py-3 z-50 shrink-0">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between relative">
            {/* Left - Logo */}
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

            {/* Center - Product Name (Absolute) */}
            <div className="absolute left-1/2 -translate-x-1/2 text-center hidden sm:block">
              <h1 className="font-display text-lg lg:text-xl font-bold text-white whitespace-nowrap">
                {product?.name || 'Customizer'}
              </h1>
              <p className="text-[10px] lg:text-[11px] font-medium text-white/60 capitalize">{product?.category || 'Loading...'}</p>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2 sm:gap-3 z-10">
              <button
                onClick={() => { setShowSavedDesigns(!showSavedDesigns); setShowCartDrawer(false); }}
                className="relative p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
              >
                <Bookmark className="w-5 h-5" />
                {totalSavedDesignsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-primary text-xs font-bold flex items-center justify-center">
                    {totalSavedDesignsCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setShowCartDrawer(!showCartDrawer); setShowSavedDesigns(false); }}
                className="relative p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-primary text-xs font-bold flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
              {/* User Icon with Dropdown */}
              {isAuthenticated ? (
                <div
                  className="relative"
                  onMouseEnter={() => setIsUserMenuOpen(true)}
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <button className="relative p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-300">
                    <User className="w-5 h-5" />
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-white border border-border/50 p-2 shadow-float z-50">
                      <div className="px-3 py-2 border-b border-border/50 mb-1">
                        <p className="text-sm font-medium text-foreground truncate">{customer?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{customer?.email}</p>
                      </div>
                      <Link
                        to="/account?tab=profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        My Account
                      </Link>
                      <Link
                        to="/account?tab=orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <Package className="w-4 h-4" />
                        My Orders
                      </Link>
                      <Link
                        to="/account?tab=designs"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <Bookmark className="w-4 h-4" />
                        Saved Designs
                      </Link>
                      <div className="border-t border-border/50 my-1" />
                      <button
                        onClick={() => { logout(); setIsUserMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="relative p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
                >
                  <User className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Saved Designs Drawer */}
      <div
        className={`fixed inset-0 z-[100] transition-opacity duration-300 ${showSavedDesigns ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setShowSavedDesigns(false)}
      >
        <div className="fixed inset-0 bg-black/50" />
        <div
          className={`absolute right-0 top-[68px] bottom-0 w-full sm:w-96 max-w-[95vw] sm:max-w-[90vw] bg-white shadow-float overflow-y-auto transition-transform duration-300 ease-out ${showSavedDesigns ? 'translate-x-0' : 'translate-x-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white border-b border-border/50 p-4 z-10">
            <h3 className="font-display text-lg font-semibold flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-primary" />
              Saved Designs
            </h3>
            <p className="text-xs text-muted-foreground mt-1">{savedDesigns.length} saved design{savedDesigns.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="p-4">
            {savedDesigns.length === 0 ? (
              <div className="text-center py-8">
                <Bookmark className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No saved designs yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Save your current configuration to see it here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedDesigns.map((design) => (
                  <div key={design.id} className="p-3 rounded-xl border border-border/50 bg-muted/30 hover:border-primary/30 transition-all">
                    <div className="flex gap-3">
                      {/* Preview Image */}
                      <div className="w-16 h-16 rounded-lg bg-white border border-border/30 overflow-hidden shrink-0">
                        {design.baseImage ? (
                          <img
                            src={design.baseImage}
                            alt={design.name}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Layers className="w-6 h-6 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{design.name || design.productName}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(design.savedAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-semibold text-primary mt-1">{formatPrice(design.totalPrice)}</p>
                      </div>
                    </div>
                    {/* Customization Summary */}
                    {design.config?.fabric && (
                      <p className="text-xs text-muted-foreground mt-2 truncate">
                        Fabric: {design.config.fabric.name}
                      </p>
                    )}
                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          // If it's a localStorage draft with config, restore directly
                          if (design.config) {
                            restoreDraft(design);
                          } else {
                            // If it's an account design, navigate with restore param
                            const designId = design.id || design._id;
                            navigate(`/customize/${id}?restore=${designId}`);
                            setShowSavedDesigns(false);
                          }
                        }}
                        className="flex-1 px-3 py-2 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => deleteDraft(design.id)}
                        className="px-3 py-2 text-xs font-semibold text-destructive bg-destructive/10 rounded-lg hover:bg-destructive/20 transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <div
        className={`fixed inset-0 z-[100] transition-opacity duration-300 ${showCartDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setShowCartDrawer(false)}
      >
        <div className="fixed inset-0 bg-black/50" />
        <div
          className={`absolute right-0 top-[68px] bottom-0 w-full sm:w-96 max-w-[95vw] sm:max-w-[90vw] bg-white shadow-float overflow-y-auto transition-transform duration-300 ease-out ${showCartDrawer ? 'translate-x-0' : 'translate-x-full'}`}
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
                      {/* Preview Image */}
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
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{item.productName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{item.productCategory}</p>
                        <p className="text-sm font-semibold text-primary mt-1">{formatPrice(item.totalPrice)}</p>
                      </div>
                    </div>
                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
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
          {/* Cart Footer */}
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

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-0">
        {/* Mobile Layout < 1024px */}
        <div className="lg:hidden flex flex-col">
          {/* Preview Row: Preview + Step Buttons (vertical on > 450px) */}
          <div className="flex flex-row h-[55vh] min-h-[350px] max-h-[500px] min-[450px]:h-[65vh] min-[450px]:min-h-[500px] min-[450px]:max-h-[800px] min-[900px]:h-[75vh] min-[900px]:min-h-[600px] min-[900px]:max-h-[900px]">
            {/* Preview Section - Mobile */}
            <div className="flex-1 relative overflow-hidden p-3 min-[450px]:p-4 flex flex-col">
              <div className="flex-1 relative rounded-xl bg-white/40 border border-white/40 shadow-soft overflow-hidden">
                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-30" style={{
                  backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.05) 1px, transparent 0)',
                  backgroundSize: '24px 24px'
                }} />
                {/* Navigation Buttons - Upper Left - Fixed position with proper z-index */}
                <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
                  <Link
                    to={product ? `/products/${product._id}` : '/products'}
                    className="flex items-center justify-center w-9 h-9 rounded-xl bg-white text-foreground hover:bg-muted shadow-md transition-all border border-border/50"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                </div>

                {/* View Toggle - Upper Right - Fixed position with proper z-index */}
                <div className="absolute top-3 right-3 z-30 flex gap-1.5">
                  <button
                    onClick={() => setViewMode('front')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shadow-md ${viewMode === 'front'
                      ? 'bg-primary text-white'
                      : 'bg-white text-foreground hover:bg-muted border border-border/50'
                      }`}
                  >
                    Front
                  </button>
                  <button
                    onClick={() => setViewMode('back')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shadow-md ${viewMode === 'back'
                      ? 'bg-primary text-white'
                      : 'bg-white text-foreground hover:bg-muted border border-border/50'
                      }`}
                  >
                    Back
                  </button>
                </div>

                {/* Preview Container - With top padding to avoid button overlap */}
                <div className="absolute inset-0 top-14 flex items-center justify-center p-4 min-[900px]:p-6">
                  <div
                    className="relative w-full h-full max-w-[330px] min-[450px]:max-w-[420px] min-[900px]:max-w-[500px] aspect-[3/4]"
                    key={viewMode}
                  >
                    {/* Base Image */}
                    {baseImage && (
                      <img
                        key={`base-${viewMode}-${config.fabric?.id || 'default'}-${product?._id || 'no-product'}`}
                        src={baseImage}
                        alt="Base"
                        className="absolute inset-0 w-full h-full object-contain transition-all duration-300"
                        style={{
                          zIndex: 1,
                          // No filter needed - we use pre-colored fabric images from ShirtData
                        }}
                        onError={(e) => {
                          const fallback = `/images/placeholders/${product?.category || 'shirt'}${viewMode === 'back' ? '-back' : ''}.svg`;
                          e.currentTarget.src = fallback;
                        }}
                      />
                    )}

                    {/* Layers - All absolute positioned */}
                    {isShirt ? (
                      previewLayers.map((layer: any) => {
                        const item = config[layer.key as keyof typeof config] as any;

                        // Skip cuff layer if short sleeve
                        if (layer.key === 'cuff' && isHalfSleeve) return null;

                        // View mode layer visibility
                        if (viewMode === 'back') {
                          // In back view: only show sleeve and collar (for back collar)
                          if (!['sleeve', 'collar'].includes(layer.key)) return null;
                        } else {
                          // In front view: show front layers, no back-only layers
                          if (layer.key === 'back') return null;
                        }

                        if (!item) return null;

                        // Resolve preview source based on layer, view, and fabric color
                        // Use ShirtData paths directly for consistent color syncing
                        let previewSrc = '';
                        // 1. Check for specific overrides from Admin Dashboard (Database)
                        if (config.fabric?.id && item.layersByFabric?.[config.fabric.id]) {
                          console.log('Found override for', layer.key, config.fabric.id, item.layersByFabric[config.fabric.id]);
                          const variant = item.layersByFabric[config.fabric.id];
                          if (typeof variant === 'string') {
                            // Legacy/Simple string: assumes Front view override
                            if (viewMode !== 'back') previewSrc = variant;
                          } else if (variant) {
                            // Object { front, back }
                            previewSrc = viewMode === 'back' ? variant.back : variant.front;
                          }
                        }

                        const BASE_PATH = '/shirt-style-customization';

                        // 2. Fallback to helper logic if no override
                        if (!previewSrc) {
                          if (viewMode === 'back') {
                            // === BACK VIEW ===
                            if (layer.key === 'collar') {
                              // Back collar uses only color, no style variations
                              previewSrc = ShirtData.getBackCollarPath(currentFabricColor);
                            } else if (layer.key === 'sleeve') {
                              // Back sleeves - use helper function for correct path
                              const isHalf = item.isHalf || item.name?.toLowerCase().includes('half') || item.id?.includes('half') || item.id?.includes('short');
                              previewSrc = ShirtData.getSleevePath(currentFabricColor, isHalf, 'back');
                            }
                          } else {
                            // === FRONT VIEW ===
                            if (['button', 'necktie', 'bowtie'].includes(layer.key)) {
                              // Color-independent layers - use preview image directly
                              previewSrc = item.previewImage || item.image;
                            } else if (layer.key === 'collar') {
                              // Collar - use helper function for correct path per color
                              previewSrc = ShirtData.getCollarPath(currentFabricColor, item.id || 'collar-button-down');
                            } else if (layer.key === 'cuff') {
                              // Cuff - use helper function for correct path
                              previewSrc = ShirtData.getCuffPath(currentFabricColor, item.id || 'cuff-double-squared');
                            } else if (layer.key === 'sleeve') {
                              // Sleeve - use helper function for correct path per color
                              const isHalf = item.isHalf || item.name?.toLowerCase().includes('half') || item.id?.includes('half') || item.id?.includes('short');
                              previewSrc = ShirtData.getSleevePath(currentFabricColor, isHalf, 'front');
                            } else if (layer.key === 'pocket') {
                              // Pocket - use helper function for correct path
                              if (item.id !== 'pocket-none' && item.name?.toLowerCase() !== 'no pocket') {
                                previewSrc = ShirtData.getChestPocketPath(currentFabricColor);
                              }
                            }
                          }
                        }

                        if (!previewSrc) return null;

                        return (
                          <img
                            key={`${layer.key}-${item?.id}-${viewMode}-${currentFabricColor}`}
                            src={previewSrc}
                            alt={layer.key}
                            className="absolute inset-0 w-full h-full object-contain"
                            style={{
                              zIndex: layer.zIndex,
                              ...(layer.key === 'cuff' ? { width: '33%', right: '67%', top: '30%' } : {})
                            }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        );
                      })
                    ) : (
                      previewLayers.map((layer: any) => {
                        if (!layer.option) return null;
                        const previewSrc = layer.option.layersByView?.[viewMode] ||
                          (config.fabric?.id && layer.option.layersByFabric?.[config.fabric.id]) ||
                          layer.option.previewImage || layer.option.image;
                        if (!previewSrc) return null;
                        return (
                          <img
                            key={`${layer.key}-${layer.option.id}`}
                            src={previewSrc}
                            alt={layer.key}
                            className="absolute inset-0 w-full h-full object-contain"
                            style={{ zIndex: layer.zIndex }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Step Buttons - Vertical on screens >= 450px, hidden on smaller (shown horizontally below) */}
            <div className="hidden min-[450px]:flex w-40 bg-transparent border-l border-border/50 flex-col py-5 px-4 min-[900px]:py-6 min-[900px]:px-5 overflow-y-auto scrollbar-hide">
              {steps.map((step) => {
                const isActive = activeStep === step.id;
                const selectedOption = step.id !== 'fabric' && step.id !== 'measurements' ? getSelectedOption(step.id) : null;
                const thumbnail = selectedOption?.image || selectedOption?.previewImage;

                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    className={`flex flex-col items-center justify-center gap-2.5 py-4 min-[900px]:py-5 rounded-lg transition-all duration-300 mb-3 ${isActive
                      ? 'bg-primary text-white shadow-md scale-105'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border/50'
                      }`}
                  >
                    {thumbnail ? (
                      <img src={thumbnail} alt="" className="w-10 h-10 min-[900px]:w-12 min-[900px]:h-12 rounded object-cover" />
                    ) : (
                      <step.icon className={`w-8 h-8 min-[900px]:w-10 min-[900px]:h-10 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                    )}
                    <span className="text-[10px] min-[900px]:text-xs font-medium text-center leading-tight whitespace-nowrap">{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step Buttons - Horizontal on screens < 450px */}
          <div className="min-[450px]:hidden flex flex-row bg-transparent py-4 px-4 overflow-x-auto scrollbar-hide gap-2">
            {steps.map((step) => {
              const isActive = activeStep === step.id;
              const selectedOption = step.id !== 'fabric' && step.id !== 'measurements' ? getSelectedOption(step.id) : null;
              const thumbnail = selectedOption?.image || selectedOption?.previewImage;

              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`flex flex-col items-center justify-center gap-2.5 py-3.5 px-4 w-20 rounded-lg transition-all duration-300 shrink-0 border ${isActive
                    ? 'bg-primary text-white border-primary shadow-md scale-105'
                    : 'bg-muted/50 text-muted-foreground border-border/40 hover:bg-muted hover:text-foreground hover:border-border/60'
                    }`}
                >
                  {thumbnail ? (
                    <img src={thumbnail} alt="" className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <step.icon className={`w-8 h-8 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                  )}
                  <span className="text-[10px] font-medium text-center leading-tight whitespace-nowrap">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile: Selected Customizations Section - Only for screens >= 450px and < 1024px */}
        <div className="hidden min-[450px]:block lg:hidden px-3 py-3 mx-3 my-6 rounded-xl bg-white/80 backdrop-blur-sm border border-border/50 shadow-sm shrink-0">
          <p className="text-[10px] font-bold text-foreground mb-2 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-primary" />
            Selected Customizations
          </p>
          <div className="flex flex-wrap gap-1.5">
            {config.fabric && (
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-semibold border border-primary/20">
                {config.fabric.name}
              </span>
            )}
            {isShirt && config.collar && (
              <span className="px-2 py-1 bg-accent/10 text-primary rounded-lg text-[10px] font-semibold border border-accent/20">
                {config.collar.name}
              </span>
            )}
            {isShirt && config.cuff && (
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-semibold border border-primary/20">
                {config.cuff.name}
              </span>
            )}
            {isShirt && config.button && (
              <span className="px-2 py-1 bg-accent/10 text-primary rounded-lg text-[10px] font-semibold border border-accent/20">
                {config.button.name}
              </span>
            )}
            {isShirt && config.pocket && (
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-semibold border border-primary/20">
                {config.pocket.name}
              </span>
            )}
            {isShirt && config.sleeve && (
              <span className="px-2 py-1 bg-accent/10 text-primary rounded-lg text-[10px] font-semibold border border-accent/20">
                {config.sleeve.name}
              </span>
            )}
            {!isShirt && config.styles && Object.entries(config.styles).slice(0, 3).map(([key, opt]: [string, any], idx) => (
              opt && (
                <span
                  key={key}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold border ${idx % 2 === 0
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-accent/10 text-primary border-accent/20'
                    }`}
                >
                  {opt.name}
                </span>
              )
            ))}
          </div>
        </div>

        {/* Desktop Layout: Left - Preview Section */}
        <div className="hidden lg:flex w-[45%] bg-background border-r border-border/50 flex-col overflow-hidden relative z-0">
          {/* Navigation Buttons - Upper Left */}
          <div className="absolute top-2 lg:top-3 left-2 lg:left-4 xl:left-8 z-20 flex items-center gap-1.5 lg:gap-2">
            <Link
              to={product ? `/products/${product._id}` : '/products'}
              className="flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg bg-white/95 backdrop-blur text-foreground hover:bg-white shadow-sm transition-all text-xs lg:text-sm font-medium border border-border/50"
            >
              <ArrowLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <Link
              to="/products"
              className="px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg bg-white/95 backdrop-blur text-foreground hover:bg-white shadow-sm transition-all text-xs lg:text-sm font-medium border border-border/50"
            >
              Products
            </Link>
          </div>

          {/* View Toggle - Upper Right */}
          <div className="absolute top-2 lg:top-3 right-2 lg:right-4 xl:right-8 z-20 flex gap-1 lg:gap-1.5">
            <button
              onClick={() => setViewMode('front')}
              className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg text-[10px] lg:text-xs font-medium transition-all shadow-sm ${viewMode === 'front'
                ? 'bg-primary text-white'
                : 'bg-white/95 backdrop-blur text-foreground hover:bg-white border border-border/50'
                }`}
            >
              Front
            </button>
            <button
              onClick={() => setViewMode('back')}
              className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg text-[10px] lg:text-xs font-medium transition-all shadow-sm ${viewMode === 'back'
                ? 'bg-primary text-white'
                : 'bg-white/95 backdrop-blur text-foreground hover:bg-white border border-border/50'
                }`}
            >
              Back
            </button>
          </div>

          <div className="flex-1 flex flex-col px-4 lg:px-8 pt-16 pb-0 lg:pb-0 overflow-hidden">
            {/* Preview Area */}
            <div className="flex-1 relative rounded-xl bg-white/40 border border-white/40 shadow-soft overflow-hidden mb-4 min-h-[400px] lg:min-h-0">
              {/* Grid Pattern */}
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.05) 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }} />

              {/* Preview Container */}
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div
                  className="relative w-full h-full max-w-none aspect-[3/4]"
                  key={viewMode}
                  style={{ animation: 'scaleIn 0.3s ease-out' }}
                >
                  {/* Base Image - Updates with view mode and fabric */}
                  {baseImage && (
                    <img
                      key={`base-${viewMode}-${config.fabric?.id || 'default'}-${product?._id || 'no-product'}`}
                      src={viewMode === 'back' ? (config.fabric?.backPreviewImage || baseImage) : (config.fabric?.previewImage || baseImage)}
                      alt="Base"
                      className="absolute inset-0 w-full h-full object-contain transition-all duration-300"
                      style={{
                        zIndex: 1,
                        // No filter needed - we use pre-colored fabric images from ShirtData
                      }}
                      onError={(e) => {
                        const fallback = `/images/placeholders/${product?.category || 'shirt'}${viewMode === 'back' ? '-back' : ''}.svg`;
                        e.currentTarget.src = fallback;
                      }}
                    />
                  )}

                  {/* Layers */}
                  {isShirt ? (
                    previewLayers.map((layer: any) => {
                      const item = config[layer.key as keyof typeof config] as any;

                      // Skip cuff layer if short sleeve
                      if (layer.key === 'cuff' && isHalfSleeve) return null;

                      // View mode layer visibility
                      if (viewMode === 'back') {
                        // In back view: only show sleeve and collar (for back collar)
                        if (!['sleeve', 'collar'].includes(layer.key)) return null;
                      } else {
                        // In front view: show front layers, no back-only layers
                        if (layer.key === 'back') return null;
                      }

                      if (!item) return null;

                      // Resolve preview source based on layer, view, and fabric color
                      // Use ShirtData paths directly for consistent color syncing
                      let previewSrc = '';
                      // 1. Check for specific overrides from Admin Dashboard (Database)
                      if (config.fabric?.id && item.layersByFabric?.[config.fabric.id]) {
                        const variant = item.layersByFabric[config.fabric.id];
                        if (typeof variant === 'string') {
                          // Legacy/Simple string: assumes Front view override
                          if (viewMode !== 'back') previewSrc = variant;
                        } else if (variant) {
                          // Object { front, back }
                          previewSrc = viewMode === 'back' ? variant.back : variant.front;
                        }
                      }

                      // 2. Fallback to helper logic if no override
                      if (!previewSrc) {
                        if (viewMode === 'back') {
                          // === BACK VIEW ===
                          if (layer.key === 'collar') {
                            // Back collar uses only color, no style variations
                            previewSrc = ShirtData.getBackCollarPath(currentFabricColor);
                          } else if (layer.key === 'sleeve') {
                            // Back sleeves - use helper function for correct path
                            const isHalf = item.isHalf || item.name?.toLowerCase().includes('half') || item.id?.includes('half') || item.id?.includes('short');
                            previewSrc = ShirtData.getSleevePath(currentFabricColor, isHalf, 'back');
                          }
                        } else {
                          // === FRONT VIEW ===
                          if (['button', 'necktie', 'bowtie'].includes(layer.key)) {
                            // Color-independent layers - use preview image directly
                            previewSrc = item.previewImage || item.image;
                          } else if (layer.key === 'collar') {
                            // Collar - use helper function for correct path per color
                            previewSrc = ShirtData.getCollarPath(currentFabricColor, item.id || 'collar-button-down');
                          } else if (layer.key === 'cuff') {
                            // Cuff - use helper function for correct path
                            previewSrc = ShirtData.getCuffPath(currentFabricColor, item.id || 'cuff-double-squared');
                          } else if (layer.key === 'sleeve') {
                            // Sleeve - use helper function for correct path per color
                            const isHalf = item.isHalf || item.name?.toLowerCase().includes('half') || item.id?.includes('half') || item.id?.includes('short');
                            previewSrc = ShirtData.getSleevePath(currentFabricColor, isHalf, 'front');
                          } else if (layer.key === 'pocket') {
                            // Pocket - use helper function for correct path
                            if (item.id !== 'pocket-none' && item.name?.toLowerCase() !== 'no pocket') {
                              previewSrc = ShirtData.getChestPocketPath(currentFabricColor);
                            }
                          }
                        }
                      }

                      if (!previewSrc) return null;

                      return (
                        <img
                          key={`${layer.key}-${item?.id}-${viewMode}-${currentFabricColor}`}
                          src={previewSrc}
                          alt={layer.key}
                          className={`absolute inset-0 w-full h-full object-contain animate-in fade-in duration-300 ease-out ${layer.key === 'cuff' ? 'custom-cuff-position' : ''}`}
                          style={{
                            zIndex: layer.zIndex,
                            ...(layer.key === 'cuff' ? {
                              width: '40%',
                              height: 'auto',
                              left: 'auto',
                              right: '60%', // Moves it significantly towards the left
                              top: '30%',   // Approximate position
                              bottom: 'auto'
                            } : {})
                          }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      );
                    })




                  ) : (
                    previewLayers.map((layer: any) => {
                      if (!layer.option) return null;
                      if (layer.key === 'waist' || layer.key === 'belt') {
                        console.log('DEBUG WAIST LAYER:', { viewMode, option: layer.option, layersByView: layer.option.layersByView });
                      }
                      let previewSrc = layer.option.layersByView?.[viewMode];

                      if (!previewSrc && config.fabric?.id && layer.option.layersByFabric?.[config.fabric.id]) {
                        const variant = layer.option.layersByFabric[config.fabric.id];
                        if (typeof variant === 'string') {
                          previewSrc = variant;
                        } else if (variant && typeof variant === 'object') {
                          previewSrc = variant[viewMode];
                        }
                      }


                      if (layer.key === 'waist') {
                        // For belt/waist, strictly use layersByView to avoid showing thumbnail as layer
                        previewSrc = layer.option.layersByView?.[viewMode];
                      } else {
                        // For generic options, fallback to previewImage or image (thumbnail)
                        previewSrc = previewSrc || layer.option.previewImage || layer.option.image;
                      }

                      if (!previewSrc) return null;
                      return (
                        <img
                          key={`${layer.key}-${layer.option.id}`}
                          src={previewSrc}
                          alt={layer.key}
                          className="absolute inset-0 w-full h-full object-contain animate-in fade-in duration-300 ease-out"
                          style={{ zIndex: layer.zIndex }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Selected Choices Section - Bottom with Better Design - 16px bottom spacing */}
            <div className="pt-3 lg:pt-4 px-3 lg:px-4 pb-3 lg:pb-4 mb-3 lg:mb-4 rounded-xl bg-white/80 backdrop-blur-sm border border-border/50 shadow-sm shrink-0">
              <p className="text-[10px] lg:text-xs font-bold text-foreground mb-2 lg:mb-3 uppercase tracking-wider flex items-center gap-1.5 lg:gap-2">
                <Sparkles className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-primary" />
                Selected Customizations
              </p>
              <div className="flex flex-wrap gap-1.5 lg:gap-2">
                {config.fabric && (
                  <span className="px-2 lg:px-3 py-1 lg:py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] lg:text-xs font-semibold border border-primary/20">
                    {config.fabric.name}
                  </span>
                )}
                {isShirt && config.collar && (
                  <span className="px-2 lg:px-3 py-1 lg:py-1.5 bg-accent/10 text-primary rounded-lg text-[10px] lg:text-xs font-semibold border border-accent/20">
                    {config.collar.name}
                  </span>
                )}
                {isShirt && config.cuff && (
                  <span className="px-2 lg:px-3 py-1 lg:py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] lg:text-xs font-semibold border border-primary/20">
                    {config.cuff.name}
                  </span>
                )}
                {isShirt && config.button && (
                  <span className="px-2 lg:px-3 py-1 lg:py-1.5 bg-accent/10 text-primary rounded-lg text-[10px] lg:text-xs font-semibold border border-accent/20">
                    {config.button.name}
                  </span>
                )}
                {isShirt && config.pocket && (
                  <span className="px-2 lg:px-3 py-1 lg:py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] lg:text-xs font-semibold border border-primary/20">
                    {config.pocket.name}
                  </span>
                )}
                {isShirt && config.sleeve && (
                  <span className="px-2 lg:px-3 py-1 lg:py-1.5 bg-accent/10 text-primary rounded-lg text-[10px] lg:text-xs font-semibold border border-accent/20">
                    {config.sleeve.name}
                  </span>
                )}
                {!isShirt && config.styles && Object.entries(config.styles).slice(0, 4).map(([key, opt]: [string, any], idx) => (
                  opt && (
                    <span
                      key={key}
                      className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg text-[10px] lg:text-xs font-semibold border ${idx % 2 === 0
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-accent/10 text-primary border-accent/20'
                        }`}
                    >
                      {opt.name}
                    </span>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right - Customization Panel (Options at bottom on mobile, side panel on desktop) */}
        <div className="flex-1 flex flex-col lg:flex-row bg-transparent overflow-hidden relative min-w-0">
          {/* Selection Buttons - Hidden on mobile (shown in preview section), Vertical on desktop */}
          <div className="hidden lg:flex w-40 bg-transparent flex-col py-4 px-4 overflow-y-auto scrollbar-hide border-r border-border/50">
            {steps.map((step) => {
              const isActive = activeStep === step.id;
              const selectedOption = step.id !== 'fabric' && step.id !== 'measurements' ? getSelectedOption(step.id) : null;
              const thumbnail = selectedOption?.image || selectedOption?.previewImage;

              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`flex flex-col items-center justify-center gap-2.5 py-3.5 rounded-lg transition-all duration-300 mb-2 border ${isActive
                    ? 'bg-primary text-white border-primary shadow-md scale-105'
                    : 'bg-muted/50 text-muted-foreground border-border/40 hover:bg-muted hover:text-foreground hover:border-border/60'
                    }`}
                >
                  {thumbnail ? (
                    <img src={thumbnail} alt="" className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <step.icon className={`w-8 h-8 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                  )}
                  <span className="text-[10px] font-medium text-center leading-tight whitespace-nowrap">{step.label}</span>
                </button>
              );
            })}
          </div>

          {/* Options Panel - Slides in smoothly from left to right (from buttons area) */}
          <div
            key={activeStep}
            className={`w-full lg:flex-1 flex flex-col bg-white/50 backdrop-blur-sm transition-transform duration-300 ease-out min-w-0 overflow-hidden ${activeStep && activeStep !== ''
              ? 'translate-x-0 opacity-100'
              : 'lg:-translate-x-full opacity-0 lg:pointer-events-none lg:absolute'
              }`}
          >
            {/* Scrollable Options Content */}
            <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4">
              <div className="mb-4">
                <div className="flex items-center gap-2 lg:gap-3 mb-2">
                  <div className="w-1 h-5 lg:h-6 bg-gradient-to-b from-primary to-accent rounded-full" />
                  <h2 className="font-display text-xl lg:text-2xl font-bold text-foreground capitalize">
                    {steps.find(s => s.id === activeStep)?.label || 'Select'}
                  </h2>
                </div>
                <p className="text-xs lg:text-sm text-muted-foreground ml-3 lg:ml-4">
                  {activeStep === 'fabric' && 'Choose from our premium fabric collection'}
                  {activeStep === 'measurements' && 'Enter your body measurements for a perfect fit'}
                  {activeStep !== 'fabric' && activeStep !== 'measurements' && 'Select your preferred style option'}
                </p>
              </div>

              {/* Fabric Selection */}
              {activeStep === 'fabric' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in slide-in-from-right duration-500 w-full max-w-full" style={{ animationDelay: '100ms' }}>
                  {fabricOptions && fabricOptions.length > 0 ? (
                    fabricOptions.map((fabric: any, i: number) => (
                      <button
                        key={fabric.id}
                        onClick={() => {
                          setFabric(fabric);
                        }}
                        className={`group relative rounded-lg overflow-hidden border-2 transition-all duration-300 ${config.fabric?.id === fabric.id
                          ? 'border-primary shadow-md ring-1 ring-primary/20'
                          : 'border-border/50 hover:border-primary/30'
                          }`}
                      >
                        <div className="aspect-square bg-muted/20">
                          <img
                            src={fabric.imageUrl || fabric.image || fabric.previewImage || '/images/placeholders/shirt.svg'}
                            alt={fabric.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.src = '/images/placeholders/shirt.svg';
                            }}
                          />
                        </div>
                        <div className="p-2 bg-white">
                          <p className="font-medium text-xs text-foreground truncate">{fabric.name}</p>
                          {fabric.priceModifier > 0 && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">+{formatPrice(fabric.priceModifier)}</p>
                          )}
                        </div>
                        {config.fabric?.id === fabric.id && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <Layers className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No fabrics available</p>
                    </div>
                  )}
                </div>
              )}

              {/* Style Options */}
              {activeStep !== 'fabric' && activeStep !== 'measurements' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in slide-in-from-right duration-500 w-full max-w-full" style={{ animationDelay: '100ms' }}>
                  {/* None Option */}
                  {['pocket', 'back', 'vents', 'pleats'].includes(activeStep) && (
                    <button
                      onClick={() => handleSelectOption(activeStep, null)}
                      className={`group relative rounded-lg overflow-hidden border-2 transition-all duration-300 ${!getSelectedOption(activeStep)
                        ? 'border-primary shadow-md ring-1 ring-primary/20'
                        : 'border-border/50 hover:border-primary/30'
                        }`}
                    >
                      <div className="aspect-square bg-muted/30 flex items-center justify-center">
                        <span className="text-muted-foreground font-medium text-xs">None</span>
                      </div>
                      <div className="p-2 bg-white">
                        <p className="font-medium text-xs text-foreground">No {steps.find(s => s.id === activeStep)?.label}</p>
                      </div>
                      {!getSelectedOption(activeStep) && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  )}

                  {getStepOptions(activeStep).map((option: any, i: number) => {
                    const isSelected = getSelectedOption(activeStep)?.id === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleSelectOption(activeStep, option)}
                        className={`group relative rounded-lg overflow-hidden border-2 transition-all duration-300 ${isSelected
                          ? 'border-primary shadow-md ring-1 ring-primary/20'
                          : 'border-border/50 hover:border-primary/30'
                          }`}
                      >
                        <div className="aspect-square bg-white p-3 flex items-center justify-center">
                          {option.image || option.previewImage ? (
                            <img
                              src={option.image || option.previewImage}
                              alt={option.name}
                              className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <Settings className="w-8 h-8 text-muted-foreground/30" />
                          )}
                        </div>
                        <div className="p-2 bg-white border-t border-border/30">
                          <p className="font-medium text-xs text-foreground truncate">{option.name}</p>
                          {option.priceModifier > 0 && (
                            <p className="text-[10px] text-muted-foreground">+{formatPrice(option.priceModifier)}</p>
                          )}
                        </div>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Measurements */}
              {activeStep === 'measurements' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right duration-500" style={{ animationDelay: '100ms' }}>
                  <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <p className="text-xs text-foreground">
                      <strong>Tip:</strong> All measurements should be in inches. For best results, have someone help you measure.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3">
                    {measurementFields.map((field) => (
                      <div key={field} className="space-y-1 lg:space-y-1.5">
                        <label className="text-xs font-semibold text-foreground capitalize">
                          {field.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 16"
                          value={config.measurements?.[field] || ''}
                          onChange={(e) => updateMeasurements({ [field]: e.target.value })}
                          className="w-full h-12 px-3 rounded-lg bg-white border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                  {/* Save Measurements Profile */}
                  {isAuthenticated && Object.keys(config.measurements || {}).some(k => config.measurements?.[k]) && (
                    <button
                      onClick={async () => {
                        if (!saveMeasurements) return;
                        const m = config.measurements || {};
                        const result = await saveMeasurements({
                          label: `${product?.name || 'Custom'} - ${new Date().toLocaleDateString()}`,
                          chest: m.chest ? parseFloat(m.chest) : undefined,
                          waist: m.waist ? parseFloat(m.waist) : undefined,
                          hips: m.hips ? parseFloat(m.hips) : undefined,
                          shoulders: m.shoulders ? parseFloat(m.shoulders) : undefined,
                          sleeveLength: m.sleeveLength ? parseFloat(m.sleeveLength) : undefined,
                          shirtLength: m.shirtLength ? parseFloat(m.shirtLength) : undefined,
                          neck: m.neck ? parseFloat(m.neck) : undefined,
                          inseam: m.inseam ? parseFloat(m.inseam) : undefined,
                          thigh: m.thigh ? parseFloat(m.thigh) : undefined,
                        });
                        if (result.success) {
                          toast.success('Measurements saved to your profile!');
                        } else {
                          toast.error(result.message);
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                    >
                      <Ruler className="w-4 h-4" />
                      Save Measurements to Profile
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions - Fixed at bottom right */}
            <div className="p-3 lg:p-4 bg-white border-t border-border/50 shrink-0">
              {/* Selected Customizations - Only for screens < 450px, positioned before price box */}
              <div className="min-[450px]:hidden mb-3 p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-border/50 shadow-sm">
                <p className="text-[10px] font-bold text-foreground mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-primary" />
                  Selected Customizations
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {config.fabric && (
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-semibold border border-primary/20">
                      {config.fabric.name}
                    </span>
                  )}
                  {isShirt && config.collar && (
                    <span className="px-2 py-1 bg-accent/10 text-primary rounded-lg text-[10px] font-semibold border border-accent/20">
                      {config.collar.name}
                    </span>
                  )}
                  {isShirt && config.cuff && (
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-semibold border border-primary/20">
                      {config.cuff.name}
                    </span>
                  )}
                  {isShirt && config.button && (
                    <span className="px-2 py-1 bg-accent/10 text-primary rounded-lg text-[10px] font-semibold border border-accent/20">
                      {config.button.name}
                    </span>
                  )}
                  {isShirt && config.pocket && (
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-semibold border border-primary/20">
                      {config.pocket.name}
                    </span>
                  )}
                  {isShirt && config.sleeve && (
                    <span className="px-2 py-1 bg-accent/10 text-primary rounded-lg text-[10px] font-semibold border border-accent/20">
                      {config.sleeve.name}
                    </span>
                  )}
                  {!isShirt && config.styles && Object.entries(config.styles).slice(0, 3).map(([key, opt]: [string, any], idx) => (
                    opt && (
                      <span
                        key={key}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold border ${idx % 2 === 0
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'bg-accent/10 text-primary border-accent/20'
                          }`}
                      >
                        {opt.name}
                      </span>
                    )
                  ))}
                </div>
              </div>

              {/* Price Summary */}
              <div className="flex items-center justify-between mb-3 lg:mb-4 p-3 lg:p-4 rounded-xl bg-accent/10">
                <div>
                  <p className="text-[10px] lg:text-xs text-muted-foreground">Total Price</p>
                  <p className="font-display text-xl lg:text-2xl font-bold text-foreground">{formatPrice(totalPrice)}</p>
                </div>
                <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-accent" />
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 lg:gap-3">
                <button
                  onClick={saveDraft}
                  className={`flex-1 flex items-center justify-center gap-1.5 lg:gap-2 px-4 lg:px-6 py-3 lg:py-4 rounded-xl text-xs lg:text-sm font-semibold transition-all duration-300 ${saved
                    ? 'bg-green-600 text-white'
                    : 'bg-muted/50 text-foreground hover:bg-muted'
                    }`}
                >
                  {saved ? <Check className="w-4 h-4 lg:w-5 lg:h-5" /> : <Save className="w-4 h-4 lg:w-5 lg:h-5" />}
                  {saved ? 'Saved!' : 'Save Design'}
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="flex-1 flex items-center justify-center gap-1.5 lg:gap-2 px-4 lg:px-6 py-3 lg:py-4 rounded-full text-xs lg:text-sm font-semibold bg-primary text-white hover:bg-primary/90 shadow-soft transition-all disabled:opacity-50"
                >
                  <ShoppingBag className="w-4 h-4 lg:w-5 lg:h-5" />
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
