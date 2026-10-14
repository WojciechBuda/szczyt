export interface Product {
  id: number;
  name: string;
  nameEn?: string | null;
  description: string;
  descriptionEn?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  isActive: boolean;
  categoryId: number;
  categoryName: string;
  categoryNameEn?: string | null;
}

export interface Category {
  id: number;
  name: string;
  nameEn?: string | null;
  description?: string | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}
