import { useEffect, useMemo } from 'react';
import { useCustomization as useShirt } from '@/context/CustomizationContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ArrowLeftRight, Disc, Layers, PanelTop, Ruler, Settings2, Shirt, Square, Sparkles } from 'lucide-react';

const OPTIONAL_STEPS = new Set([
  'back',
  'necktie',
  'bowtie',
]);

export function CustomizationPanel() {
  const {
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
    activeStep,
    setActiveStep,
    viewMode,
    setViewMode,
    totalPrice,
    product,
  } = useShirt();

  const isShirt = !product || product.category === 'shirt';
  const showCuff = !config.sleeve?.name?.toLowerCase().includes('half');
  const optionGroups = product?.customizationOptions?.optionGroups || [];
  const fabricOptions = isShirt ? fabrics : productFabrics;

  const formatPrice = useMemo(
    () =>
      (value: number) =>
        new Intl.NumberFormat('en-PK', {
          style: 'currency',
          currency: 'PKR',
          maximumFractionDigits: 0,
        }).format(value || 0),
    []
  );

  const stepList = useMemo(() => {
    if (optionGroups.length > 0) {
      return [
        { id: 'fabric', label: 'Fabric', icon: Layers },
        ...optionGroups.map((group) => ({
          id: group.category || group.id,
          label: group.label || group.category || group.id,
          icon: Settings2,
        })),
        { id: 'measurements', label: 'Measurements', icon: Ruler },
      ];
    }

    if (isShirt) {
      const base = [
        { id: 'fabric', label: 'Fabric', icon: Layers },
        { id: 'sleeve', label: 'Sleeves', icon: ArrowLeftRight },
        { id: 'collar', label: 'Collar', icon: Shirt },
        { id: 'cuff', label: 'Cuffs', icon: Square },
        { id: 'chestpocket', label: 'Chestpocket', icon: PanelTop },
        { id: 'button', label: 'Buttons', icon: Disc },
        { id: 'necktie', label: 'Necktie', icon: Sparkles },
        { id: 'bowtie', label: 'Bowtie', icon: Sparkles },
        { id: 'back', label: 'Back', icon: Square },
        { id: 'measurements', label: 'Measurements', icon: Ruler },
      ];

      const available = new Set<string>();
      if (sleeves.length) available.add('sleeve');
      if (collars.length) available.add('collar');
      if (cuffs.length && showCuff) available.add('cuff');
      if (pockets.length) available.add('chestpocket');
      if (buttons.length) available.add('button');
      if (neckties.length) available.add('necktie');
      if (bowties.length) available.add('bowtie');
      if (backs.length) available.add('back');
      return base.filter((step) => step.id === 'fabric' || step.id === 'measurements' || available.has(step.id));
    }

    const styleSteps = Object.keys(styleGroups).map((id) => ({
      id,
      label: id,
      icon: Settings2,
    }));
    return [
      { id: 'fabric', label: 'Fabric', icon: Layers },
      ...styleSteps,
      { id: 'measurements', label: 'Measurements', icon: Ruler },
    ];
  }, [optionGroups, isShirt, collars.length, cuffs.length, pockets.length, buttons.length, sleeves.length, plackets.length, backs.length, styleGroups]);

  const measurementFields = useMemo(() => {
    if (product?.category === 'pants') {
      return [
        { id: 'waist', label: 'Waist', placeholder: 'e.g. 34' },
        { id: 'hips', label: 'Hips', placeholder: 'e.g. 38' },
        { id: 'rise', label: 'Rise', placeholder: 'e.g. 11' },
        { id: 'inseam', label: 'Inseam', placeholder: 'e.g. 32' },
        { id: 'outseam', label: 'Outseam', placeholder: 'e.g. 41' },
        { id: 'thigh', label: 'Thigh', placeholder: 'e.g. 24' },
        { id: 'knee', label: 'Knee', placeholder: 'e.g. 16' },
        { id: 'legOpening', label: 'Leg Opening', placeholder: 'e.g. 14' },
        { id: 'seat', label: 'Seat', placeholder: 'e.g. 40' },
      ];
    }
    if (product?.category === 'suit' || product?.category === 'tuxedo') {
      return [
        { id: 'neck', label: 'Neck', placeholder: 'e.g. 16' },
        { id: 'chest', label: 'Chest', placeholder: 'e.g. 40' },
        { id: 'waist', label: 'Waist', placeholder: 'e.g. 34' },
        { id: 'hips', label: 'Hips', placeholder: 'e.g. 38' },
        { id: 'shoulder', label: 'Shoulder', placeholder: 'e.g. 18' },
        { id: 'sleeveLength', label: 'Sleeve Length', placeholder: 'e.g. 34' },
        { id: 'jacketLength', label: 'Jacket Length', placeholder: 'e.g. 30' },
        { id: 'bicep', label: 'Bicep', placeholder: 'e.g. 13' },
        { id: 'wrist', label: 'Wrist', placeholder: 'e.g. 8' },
        { id: 'lapelWidth', label: 'Lapel Width', placeholder: 'e.g. 3' },
      ];
    }
    return [
      { id: 'neck', label: 'Neck', placeholder: 'e.g. 16' },
      { id: 'chest', label: 'Chest', placeholder: 'e.g. 40' },
      { id: 'waist', label: 'Waist', placeholder: 'e.g. 34' },
      { id: 'hips', label: 'Hips', placeholder: 'e.g. 38' },
      { id: 'shoulder', label: 'Shoulder', placeholder: 'e.g. 18' },
      { id: 'sleeveLength', label: 'Sleeve Length', placeholder: 'e.g. 34' },
      { id: 'shirtLength', label: 'Shirt Length', placeholder: 'e.g. 30' },
    ];
  }, [product?.category]);

  useEffect(() => {
    if (!stepList.find((step) => step.id === activeStep)) {
      setActiveStep(stepList[0]?.id || 'fabric');
    }
  }, [stepList, activeStep, setActiveStep]);

  const getStepOptions = (stepId: string) => {
    const group = optionGroups.find((g) => (g.category || g.id) === stepId);
    if (group?.options?.length) {
      return group.options;
    }

    if (isShirt) {
      switch (stepId) {
        case 'collar':
          return collars;
        case 'cuff':
          return cuffs;
        case 'chestpocket':
          return pockets;
        case 'button':
          return buttons;
        case 'sleeve':
          return sleeves;
        case 'placket':
          return plackets;
        case 'back':
          return backs;
        case 'necktie':
          return neckties;
        case 'bowtie':
          return bowties;
        default:
          return [];
      }
    }

    return styleGroups[stepId] || [];
  };

  const getSelectedOption = (stepId: string) => {
    if (isShirt && ['collar', 'cuff', 'chestpocket', 'button', 'sleeve', 'placket', 'back', 'necktie', 'bowtie'].includes(stepId)) {
      if (stepId === 'chestpocket') return config.pocket;
      return config[stepId as keyof typeof config] as any;
    }
    return config.styles?.[stepId] || null;
  };

  const handleSelectOption = (stepId: string, option: any | null) => {
    if (stepId === 'fabric') return;
    if (isShirt && ['collar', 'cuff', 'chestpocket', 'button', 'sleeve', 'placket', 'back', 'necktie', 'bowtie'].includes(stepId)) {
      switch (stepId) {
        case 'collar':
          setCollar(option);
          break;
        case 'cuff':
          setCuff(option);
          break;
        case 'chestpocket':
          setPocket(option);
          break;
        case 'button':
          setButton(option);
          break;
        case 'sleeve':
          setSleeve(option);
          break;
        case 'back':
          setBack(option);
          break;
        case 'necktie':
          setNecktie(option);
          break;
        case 'bowtie':
          setBowtie(option);
          break;
        case 'placket':
          setStyle('placket', option);
          break;
        default:
          break;
      }
      return;
    }

    setStyle(stepId, option);
  };

  const activeOptions = activeStep !== 'fabric' && activeStep !== 'measurements'
    ? getStepOptions(activeStep)
    : [];

  const renderOptionCard = (option: any, isSelected: boolean, onClick: () => void) => (
    <button
      key={option.id}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-lg text-left h-[200px]",
        isSelected ? "border-accent ring-1 ring-accent/50 shadow-gold" : "border-border/50 bg-card hover:border-accent/50"
      )}
    >
      <div className="flex-1 w-full p-2 flex items-center justify-center bg-white relative overflow-hidden">
        {option.image || option.previewImage ? (
          <img
            src={option.image || option.previewImage}
            alt={option.name}
            className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="text-muted-foreground/30">
            <Settings2 className="w-10 h-10" />
          </div>
        )}
        <div className="absolute inset-2 border border-black/5 border-dashed rounded opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="h-[34px] px-2 flex items-center justify-between bg-card border-t border-border/50 shrink-0">
        <span className="font-display font-medium text-xs truncate block text-foreground w-full">{option.name}</span>
        {option.priceModifier ? (
          <span className="text-[10px] text-muted-foreground ml-2">+{formatPrice(option.priceModifier)}</span>
        ) : null}
      </div>
      {isSelected && (
        <div className="absolute top-1 right-1 bg-accent text-accent-foreground p-0.5 rounded-full shadow-md z-10">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
      )}
    </button>
  );

  return (
    <div className="h-full flex flex-col bg-card rounded-xl shadow-xl border border-border/50 overflow-hidden">
      <div className="p-6 border-b bg-muted/30">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {product?.name || 'Design Your Look'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Choose fabrics, styles, and details to create your perfect fit.
            </p>
          </div>
          <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary sm:mt-0">
            {formatPrice(totalPrice)}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-48 border-b md:border-b-0 md:border-r border-border/60 bg-muted/20 p-4">
          <div className="grid gap-2">
            {stepList.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                  activeStep === step.id
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                )}
              >
                <step.icon className="w-4 h-4" />
                <span className="truncate">{step.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              View
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('front')}
                className={cn(
                  "flex-1 rounded-lg border px-2 py-1 text-xs",
                  viewMode === 'front' ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                )}
              >
                Front
              </button>
              <button
                onClick={() => setViewMode('back')}
                className={cn(
                  "flex-1 rounded-lg border px-2 py-1 text-xs",
                  viewMode === 'back' ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                )}
              >
                Back
              </button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 bg-background">
          <div className="p-6">
            {activeStep === 'fabric' && (
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" /> Select Fabric
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {fabricOptions.map((fabric) => (
                    <button
                      key={fabric.id}
                      onClick={() => setFabric(fabric)}
                      className={cn(
                        "group relative flex flex-col overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-lg text-left h-[200px]",
                        config.fabric?.id === fabric.id
                          ? "border-accent ring-1 ring-accent/50 shadow-gold"
                          : "border-border/50 bg-card hover:border-accent/50"
                      )}
                    >
                      <div className="flex-1 w-full overflow-hidden relative">
                        <div
                          className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                          style={{ backgroundImage: `url(${fabric.image || fabric.previewImage})` }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        <div className="absolute inset-2 border border-white/20 border-dashed rounded opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="h-[30px] px-2 flex items-center bg-card border-t border-border/50 shrink-0">
                        <span className="font-display font-medium text-xs truncate block text-foreground w-full">
                          {fabric.name}
                        </span>
                      </div>
                      {config.fabric?.id === fabric.id && (
                        <div className="absolute top-1 right-1 bg-primary text-primary-foreground p-0.5 rounded-full shadow-md z-10">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeStep !== 'fabric' && activeStep !== 'measurements' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg capitalize flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-primary" /> {activeStep.replace(/-/g, ' ')}
                </h3>
                {activeOptions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 p-6 text-sm text-muted-foreground">
                    No options added yet for this step. Add options from the admin panel to enable selections here.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {OPTIONAL_STEPS.has(activeStep) && renderOptionCard(
                      { id: 'none', name: `No ${activeStep}` },
                      !getSelectedOption(activeStep),
                      () => handleSelectOption(activeStep, null)
                    )}
                    {activeOptions
                      .filter((item) => (activeStep === 'cuff' ? showCuff : true))
                      .map((item: any) =>
                        renderOptionCard(
                          item,
                          getSelectedOption(activeStep)?.id === item.id,
                          () => handleSelectOption(activeStep, item)
                        )
                      )}
                  </div>
                )}
              </div>
            )}

            {activeStep === 'measurements' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Ruler className="w-5 h-5 text-primary" /> Body Measurements
                  </h3>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                    <p className="text-sm text-primary/80">
                      Please enter your body measurements in inches for a perfect fit. All fields are optional but recommended.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {measurementFields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id} className="text-sm font-medium">{field.label}</Label>
                        <Input
                          id={field.id}
                          placeholder={field.placeholder}
                          value={config.measurements?.[field.id] || ''}
                          onChange={(e) => updateMeasurements({ [field.id]: e.target.value })}
                          className="bg-background border-input hover:border-primary/50 focus:border-primary transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
