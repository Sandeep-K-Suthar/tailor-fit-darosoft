import type { Fabric3D, FabricCategory } from '@/types/fabric';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

/**
 * Fetch all active fabrics
 */
export async function fetchFabrics(): Promise<Fabric3D[]> {
    const response = await fetch(`${API_BASE_URL}/api/fabrics`);
    const result: ApiResponse<Fabric3D[]> = await response.json();

    if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch fabrics');
    }

    return result.data;
}

/**
 * Fetch fabrics by category
 */
export async function fetchFabricsByCategory(category: FabricCategory): Promise<Fabric3D[]> {
    const response = await fetch(`${API_BASE_URL}/api/fabrics/category/${category}`);
    const result: ApiResponse<Fabric3D[]> = await response.json();

    if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch fabrics by category');
    }

    return result.data;
}

/**
 * Get full URL for texture files
 */
export function getTextureUrl(texturePath: string | undefined): string | undefined {
    if (!texturePath) return undefined;
    if (texturePath.startsWith('http')) {
        return texturePath;
    }
    return `${API_BASE_URL}${texturePath}`;
}
