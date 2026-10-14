export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  isActive: boolean;
  categoryId: number;
  categoryName: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}
