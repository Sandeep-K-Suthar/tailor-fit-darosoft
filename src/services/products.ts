import { Product } from '@/types/product';

const API_BASE = '/api';

export async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${API_BASE}/products`);
  if (!response.ok) {
    throw new Error('Failed to load products');
  }
  const data = await response.json();
  return data.data || [];
}

export async function getProductById(id: string): Promise<Product> {
  const response = await fetch(`${API_BASE}/products/${id}`);
  if (!response.ok) {
    throw new Error('Failed to load product');
  }
  const data = await response.json();
  return data.data;
}
