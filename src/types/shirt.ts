export interface FabricOption {
  id: string;
  name: string;
  image?: string;
  imageUrl?: string;
  previewImage?: string;
  backPreviewImage?: string;
  colors?: string[];
  color?: string;
  priceModifier?: number;
  isDefault?: boolean;
}

export interface CustomizationOption {
  id: string;
  name: string;
  image?: string;
  previewImage?: string;
  fabricPreviewImages?: Record<string, string>;
  backHalfFabricPreviewImages?: Record<string, string>;
  backFullFabricPreviewImages?: Record<string, string>;
  layersByFabric?: Record<string, string>;
  layersByView?: Record<string, string>;
  priceModifier?: number;
  category: string;
  isDefault?: boolean;
  order?: number;
  tags?: string[];
}

export interface ShirtMeasurements {
  neck: string;
  chest: string;
  waist: string;
  hips: string;
  shoulder: string;
  sleeveLength: string;
  shirtLength: string;
  inseam?: string;
  outseam?: string;
  rise?: string;
  thigh?: string;
  knee?: string;
  legOpening?: string;
  jacketLength?: string;
  bicep?: string;
  wrist?: string;
  seat?: string;
  lapelWidth?: string;
  [key: string]: string | undefined; // Allow dynamic access
}

export interface ShirtConfiguration {
  fabric: FabricOption | null;
  fabricColor: string;
  collar: CustomizationOption | null;
  cuff: CustomizationOption | null;
  pocket: CustomizationOption | null;
  button: CustomizationOption | null;
  sleeve: CustomizationOption | null;
  placket: CustomizationOption | null;
  back: CustomizationOption | null;
  necktie: CustomizationOption | null;
  bowtie: CustomizationOption | null;
  styles: Record<string, CustomizationOption | null>;
  measurements: ShirtMeasurements;
}

export interface AdminCredentials {
  username: string;
  password: string;
}

export const DEFAULT_ADMIN: AdminCredentials = {
  username: 'admin',
  password: '#MiAdmin$'
};
