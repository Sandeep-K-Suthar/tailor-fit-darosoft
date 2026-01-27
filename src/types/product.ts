export type CustomizationOption = {
  id: string;
  name: string;
  category?: string;
  image?: string;
  imageUrl?: string;
  previewImage?: string;
  layersByFabric?: Record<string, string>;
  layersByView?: Record<string, string>;
  priceModifier?: number;
  order?: number;
  isDefault?: boolean;
  tags?: string[];
};

export type FabricOption = {
  id: string;
  name: string;
  color?: string;
  colors?: string[]; // Add colors array
  pattern?: string;
  image?: string;    // Add image property
  imageUrl?: string;
  previewImage?: string;
  backPreviewImage?: string;
  layersByFabric?: Record<string, string>;
  layersByView?: Record<string, string>;
  priceModifier?: number;
  order?: number;
  isDefault?: boolean;
  tags?: string[];
};

export type Product = {
  _id: string;
  name: string;
  description: string;
  category:
  | 'suit'
  | 'shirt'
  | 'pants'
  | 'jacket'
  | 'vest'
  | 'blazer'
  | 'jeans'
  | 'chinos'
  | 'tuxedo'
  | 'coat'
  | 'polo'
  | 'dress-shoes'
  | 'sneakers';
  basePrice: number;
  images?: {
    baseImage?: string;
    backImage?: string;
    thumbnailImage?: string;
    gallery?: string[];
  };
  customizationOptions?: {
    fabrics?: FabricOption[];
    styles?: Record<string, CustomizationOption[]>;
    optionGroups?: {
      id: string;
      label: string;
      category: string;
      order?: number;
      options: CustomizationOption[];
    }[];
  };
};
