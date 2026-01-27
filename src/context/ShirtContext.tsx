import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ShirtConfiguration, FabricOption, CustomizationOption, ShirtMeasurements } from '@/types/shirt';
import { Product } from '@/types/product';

interface ShirtContextType {
  product: Product | null;
  config: ShirtConfiguration;
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
  setFabric: (fabric: FabricOption | null) => void;
  setFabricColor: (color: string) => void;
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
  addFabric: (fabric: FabricOption) => void;
  addCustomization: (option: CustomizationOption) => void;
  removeFabric: (id: string) => void;
  removeCustomization: (id: string, category: string) => void;
  updateFabric: (id: string, updates: Partial<FabricOption>) => void;
  updateCustomization: (id: string, category: string, updates: Partial<CustomizationOption>) => void;
  updateMeasurements: (measurements: Partial<ShirtMeasurements>) => void;
  activeStep: string;
  setActiveStep: (step: string) => void;
  viewMode: 'front' | 'back';
  setViewMode: (mode: 'front' | 'back') => void;
  totalPrice: number;
  loadProduct: (productId: string) => Promise<void>;
}

const ShirtContext = createContext<ShirtContextType | undefined>(undefined);

export function ShirtProvider({ children }: { children: React.ReactNode }) {
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
      neck: '',
      chest: '',
      waist: '',
      hips: '',
      shoulder: '',
      sleeveLength: '',
      shirtLength: '',
      inseam: '',
      outseam: '',
      rise: '',
      thigh: '',
      knee: '',
      legOpening: '',
      jacketLength: '',
      bicep: '',
      wrist: '',
      seat: '',
      lapelWidth: '',
    },
  });

  const [fabrics, setFabrics] = useState<FabricOption[]>([]);
  const [collars, setCollars] = useState<CustomizationOption[]>([]);
  const [cuffs, setCuffs] = useState<CustomizationOption[]>([]);
  const [pockets, setPockets] = useState<CustomizationOption[]>([]);
  const [buttons, setButtons] = useState<CustomizationOption[]>([]);
  const [sleeves, setSleeves] = useState<CustomizationOption[]>([]);
  const [plackets, setPlackets] = useState<CustomizationOption[]>([]);
  const [backs, setBacks] = useState<CustomizationOption[]>([]);
  const [neckties, setNeckties] = useState<CustomizationOption[]>([]);
  const [bowties, setBowties] = useState<CustomizationOption[]>([]);
  const [styleGroups, setStyleGroups] = useState<Record<string, CustomizationOption[]>>({});
  const [productFabrics, setProductFabrics] = useState<FabricOption[]>([]);

  const [activeStep, setActiveStep] = useState('fabric');
  const [viewMode, setViewMode] = useState<'front' | 'back'>('front');

  const loadProduct = useCallback(async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) {
        throw new Error('Failed to load product');
      }
      const data = await response.json();
      const productData: Product = data.data;
      setProduct(productData);
      setViewMode('front');
      setActiveStep('fabric');

      const mappedFabrics = (productData.customizationOptions?.fabrics || []).map((fabric) => ({
        id: fabric.id,
        name: fabric.name,
        image: fabric.imageUrl || fabric.image || fabric.previewImage,
        previewImage: fabric.previewImage || fabric.imageUrl || fabric.image,
        backPreviewImage: fabric.backPreviewImage,
        priceModifier: fabric.priceModifier || 0,
        colors: fabric.colors || (fabric.color ? [fabric.color] : undefined),
      }));
      setProductFabrics(mappedFabrics);

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
      const mappedStyles: Record<string, CustomizationOption[]> = {};

      if (optionGroups.length > 0) {
        optionGroups.forEach((group: any) => {
          const key = group.category || group.id;
          mappedStyles[key] = (group.options || []).map((option: any) => mapOption(option, key));
        });
      } else {
        const styles = productData.customizationOptions?.styles || {};
        Object.entries(styles).forEach(([category, options]) => {
          mappedStyles[category] = (options as any[]).map((option: any) => mapOption(option, category));
        });
      }

      setStyleGroups(mappedStyles);

      const defaultStyles = Object.fromEntries(
        Object.entries(mappedStyles).map(([category, options]) => [
          category,
          options.find((item) => item.isDefault) || options[0] || null,
        ])
      );

      // Set default fabric and styles
      const defaultFabric = mappedFabrics.find((f: any) => f.isDefault) || mappedFabrics[0] || null;

      if (productData.category !== 'shirt') {
        setConfig((prev) => ({
          ...prev,
          fabric: defaultFabric,
          styles: defaultStyles,
        }));
      } else if (optionGroups.length > 0) {
        setConfig((prev) => ({
          ...prev,
          fabric: defaultFabric || prev.fabric,
          collar: defaultStyles.collar || prev.collar,
          cuff: defaultStyles.cuff || prev.cuff,
          pocket: defaultStyles.pocket || prev.pocket,
          button: defaultStyles.button || prev.button,
          sleeve: defaultStyles.sleeve || prev.sleeve,
          placket: defaultStyles.placket || prev.placket,
          back: defaultStyles.back || prev.back,
          necktie: defaultStyles.necktie || prev.necktie,
          bowtie: defaultStyles.bowtie || prev.bowtie,
          styles: defaultStyles,
        }));
      }

      // Ensure productFabrics is set
      setProductFabrics(mappedFabrics);
    } catch (error) {
      console.error('Failed to load product', error);
    }
  }, []);

  useEffect(() => {
    fetch('/api/data')
      .then((res) => res.json())
      .then((data) => {
        if (data.fabrics) {
          const mapped = data.fabrics.map((fabric: FabricOption) => ({
            ...fabric,
            priceModifier: fabric.priceModifier || 0,
          }));
          setFabrics(mapped);
        }
        if (data.collars) setCollars(data.collars);
        if (data.cuffs) setCuffs(data.cuffs);
        if (data.pockets) setPockets(data.pockets);
        if (data.buttons) setButtons(data.buttons);
        if (data.sleeves) setSleeves(data.sleeves);
        if (data.plackets) setPlackets(data.plackets);
        if (data.backs) setBacks(data.backs);
        if (data.neckties) setNeckties(data.neckties);
        if (data.bowties) setBowties(data.bowties);
        setConfig((prev) => {
          const initialFabric = prev.fabric || data.fabrics?.[0] || null;
          return {
            ...prev,
            fabric: initialFabric,
            fabricColor: initialFabric?.colors?.[0] || prev.fabricColor,
            collar: prev.collar || data.collars?.[0] || null,
            cuff: prev.cuff || data.cuffs?.[0] || null,
            pocket: prev.pocket || data.pockets?.[0] || null,
            button: prev.button || data.buttons?.[0] || null,
            sleeve: prev.sleeve || data.sleeves?.[0] || null,
            placket: prev.placket || data.plackets?.[0] || null,
            back: prev.back || data.backs?.[0] || null,
            necktie: prev.necktie || data.neckties?.[0] || null,
            bowtie: prev.bowtie || data.bowties?.[0] || null,
          };
        });
      })
      .catch((err) => console.error('Failed to load shirt options:', err));
  }, []);

  // Auto-select first option when tab changes
  useEffect(() => {
    if (activeStep === 'fabric' && !config.fabric && fabrics.length > 0 && product?.category === 'shirt') {
      const first = fabrics[0];
      const defaultColor = first.colors?.[0] || '#FFFFFF';
      setConfig((prev) => ({ ...prev, fabric: first, fabricColor: defaultColor }));
    }
  }, [activeStep, fabrics, config.fabric, product?.category]);

  const totalPrice = useMemo(() => {
    const basePrice = Number(product?.basePrice || 0);
    const fabricPrice = Number(config.fabric?.priceModifier || 0);
    const stylePrice = Object.values(config.styles || {}).reduce(
      (sum, option) => sum + Number(option?.priceModifier || 0),
      0
    );
    const shirtPrice = [config.collar, config.cuff, config.pocket, config.button, config.sleeve, config.placket, config.back, config.necktie, config.bowtie]
      .reduce((sum, option) => sum + Number(option?.priceModifier || 0), 0);
    return basePrice + fabricPrice + stylePrice + shirtPrice;
  }, [product, config.fabric, config.styles, config.collar, config.cuff, config.pocket, config.button, config.sleeve, config.placket, config.back, config.necktie, config.bowtie]);

  const saveToBackend = (data: any) => {
    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch((err) => console.error('Failed to save data:', err));
  };

  const getCurrentState = () => ({
    fabrics,
    collars,
    cuffs,
    pockets,
    buttons,
    sleeves,
    plackets,
    backs,
    neckties,
    bowties,
  });

  const addFabric = (fabric: FabricOption) => {
    const newFabrics = [...fabrics, fabric];
    setFabrics(newFabrics);
    saveToBackend({ ...getCurrentState(), fabrics: newFabrics });
  };

  const addCustomization = (option: CustomizationOption) => {
    const state = getCurrentState();
    switch (option.category) {
      case 'collar': {
        const updated = [...collars, option];
        setCollars(updated);
        saveToBackend({ ...state, collars: updated });
        break;
      }
      case 'cuff': {
        const updated = [...cuffs, option];
        setCuffs(updated);
        saveToBackend({ ...state, cuffs: updated });
        break;
      }
      case 'pocket': {
        const updated = [...pockets, option];
        setPockets(updated);
        saveToBackend({ ...state, pockets: updated });
        break;
      }
      case 'button': {
        const updated = [...buttons, option];
        setButtons(updated);
        saveToBackend({ ...state, buttons: updated });
        break;
      }
      case 'sleeve': {
        const updated = [...sleeves, option];
        setSleeves(updated);
        saveToBackend({ ...state, sleeves: updated });
        break;
      }
      case 'placket': {
        const updated = [...plackets, option];
        setPlackets(updated);
        saveToBackend({ ...state, plackets: updated });
        break;
      }
      case 'back': {
        const updated = [...backs, option];
        setBacks(updated);
        saveToBackend({ ...state, backs: updated });
        break;
      }
      default:
        break;
    }
  };

  const removeFabric = (id: string) => {
    const updated = fabrics.filter((fabric) => fabric.id !== id);
    setFabrics(updated);
    saveToBackend({ ...getCurrentState(), fabrics: updated });
  };

  const removeCustomization = (id: string, category: string) => {
    const state = getCurrentState();
    switch (category) {
      case 'collar': {
        const updated = collars.filter((item) => item.id !== id);
        setCollars(updated);
        saveToBackend({ ...state, collars: updated });
        break;
      }
      case 'cuff': {
        const updated = cuffs.filter((item) => item.id !== id);
        setCuffs(updated);
        saveToBackend({ ...state, cuffs: updated });
        break;
      }
      case 'pocket': {
        const updated = pockets.filter((item) => item.id !== id);
        setPockets(updated);
        saveToBackend({ ...state, pockets: updated });
        break;
      }
      case 'button': {
        const updated = buttons.filter((item) => item.id !== id);
        setButtons(updated);
        saveToBackend({ ...state, buttons: updated });
        break;
      }
      case 'sleeve': {
        const updated = sleeves.filter((item) => item.id !== id);
        setSleeves(updated);
        saveToBackend({ ...state, sleeves: updated });
        break;
      }
      case 'placket': {
        const updated = plackets.filter((item) => item.id !== id);
        setPlackets(updated);
        saveToBackend({ ...state, plackets: updated });
        break;
      }
      case 'back': {
        const updated = backs.filter((item) => item.id !== id);
        setBacks(updated);
        saveToBackend({ ...state, backs: updated });
        break;
      }
      default:
        break;
    }
  };

  const updateFabric = (id: string, updates: Partial<FabricOption>) => {
    const updated = fabrics.map((fabric) => (fabric.id === id ? { ...fabric, ...updates } : fabric));
    setFabrics(updated);
    saveToBackend({ ...getCurrentState(), fabrics: updated });
  };

  const updateCustomization = (id: string, category: string, updates: Partial<CustomizationOption>) => {
    const state = getCurrentState();
    const updateList = (items: CustomizationOption[]) =>
      items.map((item) => (item.id === id ? { ...item, ...updates } : item));

    switch (category) {
      case 'collar': {
        const updated = updateList(collars);
        setCollars(updated);
        saveToBackend({ ...state, collars: updated });
        break;
      }
      case 'cuff': {
        const updated = updateList(cuffs);
        setCuffs(updated);
        saveToBackend({ ...state, cuffs: updated });
        break;
      }
      case 'pocket': {
        const updated = updateList(pockets);
        setPockets(updated);
        saveToBackend({ ...state, pockets: updated });
        break;
      }
      case 'button': {
        const updated = updateList(buttons);
        setButtons(updated);
        saveToBackend({ ...state, buttons: updated });
        break;
      }
      case 'sleeve': {
        const updated = updateList(sleeves);
        setSleeves(updated);
        saveToBackend({ ...state, sleeves: updated });
        break;
      }
      case 'placket': {
        const updated = updateList(plackets);
        setPlackets(updated);
        saveToBackend({ ...state, plackets: updated });
        break;
      }
      case 'back': {
        const updated = updateList(backs);
        setBacks(updated);
        saveToBackend({ ...state, backs: updated });
        break;
      }
      default:
        break;
    }
  };

  return (
    <ShirtContext.Provider value={{
      product,
      config,
      fabrics,
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
      productFabrics,
      setFabric: (fabric) => {
        const defaultColor = fabric?.colors && fabric.colors.length > 0 ? fabric.colors[0] : '#FFFFFF';
        setConfig(prev => ({ ...prev, fabric, fabricColor: defaultColor }));
      },
      setFabricColor: (fabricColor) => setConfig(prev => ({ ...prev, fabricColor })),
      setCollar: (collar) => setConfig(prev => ({ ...prev, collar })),
      setCuff: (cuff) => setConfig(prev => ({ ...prev, cuff })),
      setPocket: (pocket) => setConfig(prev => ({ ...prev, pocket })),
      setButton: (button) => setConfig(prev => ({ ...prev, button })),
      setSleeve: (sleeve) => setConfig(prev => ({ ...prev, sleeve })),
      setPlacket: (placket) => setConfig(prev => ({ ...prev, placket })),
      setBack: (back) => setConfig(prev => ({ ...prev, back })),
      setNecktie: (necktie) => setConfig(prev => ({ ...prev, necktie, bowtie: null })),
      setBowtie: (bowtie) => setConfig(prev => ({ ...prev, bowtie, necktie: null })),
      setStyle: (category, option) => {
        setConfig(prev => ({
          ...prev,
          styles: { ...prev.styles, [category]: option }
        }));
      },
      addFabric,
      addCustomization,
      removeFabric,
      removeCustomization,
      updateFabric,
      updateCustomization,
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
    }}>
      {children}
    </ShirtContext.Provider>
  );
}

export function useShirt() {
  const context = useContext(ShirtContext);
  if (!context) {
    throw new Error('useShirt must be used within ShirtProvider');
  }
  return context;
}
