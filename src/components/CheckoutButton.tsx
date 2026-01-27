import { useMemo, useState } from 'react';
import { useCustomization as useShirt } from '@/context/CustomizationContext';
import { Button } from '@/components/ui/button';
import { Check, Save, ShoppingBag, Sparkles } from 'lucide-react';

export function CheckoutButton() {
  const { config, product, totalPrice } = useShirt();
  const [saved, setSaved] = useState(false);

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

  const saveDraft = () => {
    if (!product) return;
    const legacyStyles = {
      collar: config.collar?.id || '',
      cuff: config.cuff?.id || '',
      pocket: config.pocket?.id || '',
      button: config.button?.id || '',
      sleeve: config.sleeve?.id || '',
      placket: config.placket?.id || '',
      back: config.back?.id || '',
    };
    const payload = {
      id: `${product._id}-${Date.now()}`,
      productId: product._id,
      name: product.name,
      category: product.category,
      basePrice: product.basePrice,
      selectedFabricId: config.fabric?.id || '',
      selectedStyles: Object.fromEntries(
        Object.entries(config.styles || {}).map(([key, value]) => [key, value?.id || ''])
      ),
      selectedLegacyStyles: legacyStyles,
      totalPrice,
      savedAt: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem('tailorFitSavedConfigs') || '[]');
    const next = [payload, ...existing].slice(0, 20);
    localStorage.setItem('tailorFitSavedConfigs', JSON.stringify(next));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
      {/* Price Summary */}
      <div className="p-5 bg-gradient-to-br from-primary/5 to-accent/5 border-b border-border/50">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-muted-foreground">Your Total</span>
          <span className="inline-flex items-center gap-1 text-xs text-accent">
            <Sparkles className="w-3 h-3" />
            Live pricing
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground">{formatPrice(totalPrice)}</span>
          <span className="text-xs text-muted-foreground">PKR</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Includes all selected customizations
        </p>
      </div>

      {/* Actions */}
      <div className="p-5 space-y-3">
        <Button 
          className={`w-full h-12 rounded-xl font-semibold text-base transition-all ${
            saved 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-elevated'
          }`}
          onClick={saveDraft}
        >
          {saved ? (
            <>
              <Check className="w-5 h-5 mr-2" />
              Configuration Saved!
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Save Configuration
            </>
          )}
        </Button>

        <Button 
          variant="outline" 
          className="w-full h-12 rounded-xl font-semibold text-base border-2 hover:bg-accent/10 hover:border-accent/50"
          disabled
        >
          <ShoppingBag className="w-5 h-5 mr-2" />
          Add to Cart
          <span className="ml-2 text-xs text-muted-foreground">(Coming Soon)</span>
        </Button>
      </div>

      {/* Help Text */}
      <div className="px-5 pb-5">
        <p className="text-xs text-center text-muted-foreground">
          Save your design as a draft. You can return anytime to continue editing.
        </p>
      </div>
    </div>
  );
}
