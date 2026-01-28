export type FabricCategory = 'cotton' | 'wool' | 'linen' | 'silk' | 'polyester' | 'denim';

export interface Fabric3D {
    _id: string;
    name: string;
    category: FabricCategory;
    // PBR Texture Maps
    colorMapUrl: string;
    normalMapUrl?: string;
    roughnessMapUrl?: string;
    // Material Properties
    baseColor: string;
    roughness: number;
    metalness: number;
    normalScale: number;
    // Pricing
    price: number;
    // Status
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export const FABRIC_CATEGORIES: { value: FabricCategory; label: string; icon: string }[] = [
    { value: 'cotton', label: 'Cotton', icon: '🌿' },
    { value: 'wool', label: 'Wool', icon: '🐑' },
    { value: 'linen', label: 'Linen', icon: '🌾' },
    { value: 'silk', label: 'Silk', icon: '✨' },
    { value: 'polyester', label: 'Polyester', icon: '🔮' },
    { value: 'denim', label: 'Denim', icon: '👖' }
];
