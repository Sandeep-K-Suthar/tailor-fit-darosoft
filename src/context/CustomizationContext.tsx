import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ShirtConfiguration, FabricOption, CustomizationOption, ShirtMeasurements } from '@/types/shirt';
import { Product } from '@/types/product';

export interface CustomizationContextType {
  product: Product | null;
  config: ShirtConfiguration; // We will rename this type later or keep it for compatibility
  // Dynamic collections for any product type
  options: Record<string, CustomizationOption[]>; // e.g. options['collar'] = [...]

  // Specific getters for UI convenience (optional, or mapped dynamically)
  fabrics: FabricOption[];
  collars: CustomizationOption[];
  cuffs: CustomizationOption[];
  pockets: CustomizationOption[];
  buttons: CustomizationOption[];
  sleeves: CustomizationOption[];
  plackets: CustomizationOption[];
  backs: CustomizationOption[];
  neckties: CustomizationOption[];
  bowties: CustomizationOption[];
  styleGroups: Record<string, CustomizationOption[]>;
  productFabrics: FabricOption[];

  // Legacy Setters
  setCollar: (option: CustomizationOption | null) => void;
  setCuff: (option: CustomizationOption | null) => void;
  setPocket: (option: CustomizationOption | null) => void;
  setButton: (option: CustomizationOption | null) => void;
  setSleeve: (option: CustomizationOption | null) => void;
  setPlacket: (option: CustomizationOption | null) => void;
  setBack: (option: CustomizationOption | null) => void;
  setNecktie: (option: CustomizationOption | null) => void;
  setBowtie: (option: CustomizationOption | null) => void;
  setStyle: (category: string, option: CustomizationOption | null) => void;

  addCustomization: (option: CustomizationOption) => void;
  removeCustomization: (id: string, category: string) => void;
  updateCustomization: (id: string, category: string, updates: Partial<CustomizationOption>) => void;

  // Generic Setters
  setOption: (category: string, option: CustomizationOption | null) => void;
  setFabric: (fabric: FabricOption | null) => void;
  setFabricColor: (color: string) => void;

  // CRUD Actions
  addFabric: (fabric: FabricOption) => void;
  addOption: (option: CustomizationOption) => void;
  removeFabric: (id: string) => void;
  removeOption: (id: string, category: string) => void;
  updateFabric: (id: string, updates: Partial<FabricOption>) => void;
  updateOption: (id: string, category: string, updates: Partial<CustomizationOption>) => void;

  updateMeasurements: (measurements: Partial<ShirtMeasurements>) => void;
  activeStep: string;
  setActiveStep: (step: string) => void;
  viewMode: 'front' | 'back';
  setViewMode: (mode: 'front' | 'back') => void;
  totalPrice: number;
  loadProduct: (productId: string) => Promise<void>;
}

const CustomizationContext = createContext<CustomizationContextType | undefined>(undefined);

export function CustomizationProvider({ children }: { children: React.ReactNode }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [config, setConfig] = useState<ShirtConfiguration>({
    fabric: null,
    fabricColor: '#FFFFFF',
    collar: null,
    cuff: null,
    pocket: null,
    button: null,
    sleeve: null,
    placket: null,
    back: null,
    necktie: null,
    bowtie: null,
    styles: {},
    measurements: {
      neck: '', chest: '', waist: '', hips: '', shoulder: '', sleeveLength: '',
      shirtLength: '', inseam: '', outseam: '', rise: '', thigh: '', knee: '',
      legOpening: '', jacketLength: '', bicep: '', wrist: '', seat: '', lapelWidth: '',
    },
  });

  const [fabrics, setFabrics] = useState<FabricOption[]>([]);
  // Generic options state
  const [options, setOptions] = useState<Record<string, CustomizationOption[]>>({});

  const [activeStep, setActiveStep] = useState('fabric');
  const [viewMode, setViewMode] = useState<'front' | 'back'>('front');

  const loadProduct = useCallback(async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error('Failed to load product');
      const data = await response.json();
      const productData: Product = data.data;
      setProduct(productData);
      setViewMode('front');
      setActiveStep('fabric');

      // Map Fabrics
      const mappedFabrics = (productData.customizationOptions?.fabrics || []).map((fabric) => ({
        id: fabric.id,
        name: fabric.name,
        image: fabric.imageUrl || fabric.image || fabric.previewImage,
        previewImage: fabric.previewImage || fabric.imageUrl || fabric.image,
        backPreviewImage: fabric.backPreviewImage, // Pant Support
        priceModifier: fabric.priceModifier || 0,
        colors: fabric.colors || (fabric.color ? [fabric.color] : undefined),
      }));
      setFabrics(mappedFabrics);

      // Map Options
      const mapOption = (option: any, category: string) => ({
        id: option.id,
        name: option.name,
        image: option.image || option.imageUrl || option.previewImage,
        previewImage: option.previewImage || option.imageUrl || option.image,
        priceModifier: option.priceModifier || 0,
        category: option.category || category,
        fabricPreviewImages: option.fabricPreviewImages || {},
        backHalfFabricPreviewImages: option.backHalfFabricPreviewImages || {},
        backFullFabricPreviewImages: option.backFullFabricPreviewImages || {},
        layersByFabric: option.layersByFabric || {},
        layersByView: option.layersByView || {},
        isDefault: option.isDefault || false,
        order: option.order || 0,
        tags: option.tags || [],
      });

      const optionGroups = productData.customizationOptions?.optionGroups || [];
      const mappedOptions: Record<string, CustomizationOption[]> = {};

      if (optionGroups.length > 0) {
        optionGroups.forEach((group: any) => {
          const key = group.category || group.id;
          mappedOptions[key] = (group.options || []).map((option: any) => mapOption(option, key));
        });
      }

      setOptions(mappedOptions);

      // Set Defaults
      const defaultFabric = mappedFabrics.find((f: any) => f.isDefault) || mappedFabrics[0] || null;

      // Initialize config with defaults
      const initialStyles: Record<string, CustomizationOption | null> = {};
      Object.entries(mappedOptions).forEach(([key, opts]) => {
        initialStyles[key] = opts.find(o => o.isDefault) || opts[0] || null;
      });

      setConfig(prev => ({
        ...prev,
        fabric: defaultFabric,
        styles: initialStyles,
        // Keep legacy fields for backward compatibility if needed, using generic map
        collar: initialStyles['collar'] || null,
        cuff: initialStyles['cuff'] || null,
        pocket: initialStyles['pocket'] || null,
        button: initialStyles['button'] || null,
        sleeve: initialStyles['sleeve'] || null,
        placket: initialStyles['placket'] || null,
        back: initialStyles['back'] || null,
        necktie: initialStyles['necktie'] || null,
        bowtie: initialStyles['bowtie'] || null,
      }));

    } catch (error) {
      console.error('Failed to load product', error);
    }
  }, []);

  const setOption = (category: string, option: CustomizationOption | null) => {
    setConfig(prev => ({
      ...prev,
      styles: { ...prev.styles, [category]: option },
      // Update legacy fields for compatibility
      [category]: option
    }));
  };

  const totalPrice = useMemo(() => {
    const basePrice = Number(product?.basePrice || 0);
    const fabricPrice = Number(config.fabric?.priceModifier || 0);
    const stylePrice = Object.values(config.styles || {}).reduce(
      (sum, option) => sum + Number(option?.priceModifier || 0),
      0
    );
    return basePrice + fabricPrice + stylePrice;
  }, [product, config.fabric, config.styles]);

  const saveToBackend = (data: any) => {
    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch((err) => console.error('Failed to save data:', err));
  };

  const addFabric = (fabric: FabricOption) => {
    const newFabrics = [...fabrics, fabric];
    setFabrics(newFabrics);
    // saveToBackend logic... (simplified for brevity, assume admin handles persistence mostly)
  };

  const addOption = (option: CustomizationOption) => {
    const category = option.category;
    const currentOptions = options[category] || [];
    const newOptions = [...currentOptions, option];
    setOptions(prev => ({ ...prev, [category]: newOptions }));
  };

  const removeFabric = (id: string) => {
    setFabrics(prev => prev.filter(f => f.id !== id));
  };

  const removeOption = (id: string, category: string) => {
    setOptions(prev => ({
      ...prev,
      [category]: (prev[category] || []).filter(o => o.id !== id)
    }));
  };

  const updateFabric = (id: string, updates: Partial<FabricOption>) => {
    setFabrics(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const updateOption = (id: string, category: string, updates: Partial<CustomizationOption>) => {
    setOptions(prev => ({
      ...prev,
      [category]: (prev[category] || []).map(o => o.id === id ? { ...o, ...updates } : o)
    }));
  };

  return (
    <CustomizationContext.Provider value={{
      product,
      config,
      options,
      fabrics,
      setOption,
      setFabric: (fabric) => {
        const defaultColor = fabric?.colors && fabric.colors.length > 0 ? fabric.colors[0] : '#FFFFFF';
        setConfig(prev => ({ ...prev, fabric, fabricColor: defaultColor }));
      },
      setFabricColor: (color) => setConfig(prev => ({ ...prev, fabricColor: color })),
      // Legacy Setters (mapped to setOption)
      setCollar: (opt) => setOption('collar', opt),
      setCuff: (opt) => setOption('cuff', opt),
      setPocket: (opt) => setOption('pocket', opt),
      setButton: (opt) => setOption('button', opt),
      setSleeve: (opt) => setOption('sleeve', opt),
      setPlacket: (opt) => setOption('placket', opt),
      setBack: (opt) => setOption('back', opt),
      setNecktie: (opt) => setOption('necktie', opt),
      setBowtie: (opt) => setOption('bowtie', opt),
      setStyle: (category, option) => setOption(category, option),

      addFabric,
      addOption,
      // Generic addCustomization for compatibility
      addCustomization: addOption,
      removeFabric,
      removeOption,
      // Generic removeCustomization for compatibility
      removeCustomization: removeOption,
      updateFabric,
      updateOption,
      // Generic updateCustomization for compatibility
      updateCustomization: updateOption,

      updateMeasurements: (measurements) => setConfig(prev => ({
        ...prev,
        measurements: { ...prev.measurements, ...measurements }
      })),
      activeStep,
      setActiveStep,
      viewMode,
      setViewMode,
      totalPrice,
      loadProduct,

      // Legacy Getters (derived from options)
      collars: options['collar'] || [],
      cuffs: options['cuff'] || [],
      pockets: options['pocket'] || [],
      buttons: options['button'] || [],
      sleeves: options['sleeve'] || [],
      plackets: options['placket'] || [],
      backs: options['back'] || [],
      neckties: options['necktie'] || [],
      bowties: options['bowtie'] || [],
      styleGroups: options,
      productFabrics: fabrics,
    }}>
      {children}
    </CustomizationContext.Provider>
  );
}

export function useCustomization() {
  const context = useContext(CustomizationContext);
  if (!context) {
    throw new Error('useCustomization must be used within CustomizationProvider');
  }
  return context;
}
