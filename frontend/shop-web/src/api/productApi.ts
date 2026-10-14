import { supabase } from '../lib/supabaseClient';
import { PagedResult, Product, Category } from '../types/Product';

export interface ProductQuery {
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
}

interface ProductRow {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  category_id: number;
  categories: { name: string } | null;
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    stock: row.stock,
    imageUrl: row.image_url,
    isActive: row.is_active,
    categoryId: row.category_id,
    categoryName: row.categories?.name || '',
  };
}

export const productApi = {
  list: async (query: ProductQuery = {}): Promise<PagedResult<Product>> => {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 && query.pageSize <= 100 ? query.pageSize : 12;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = supabase
      .from('products')
      .select('id, name, description, price, stock, image_url, is_active, category_id, categories(name)', { count: 'exact' })
      .eq('is_active', true);

    // Strip characters that have a meaning inside a PostgREST filter expression.
    const term = query.search?.replace(/[%,()*]/g, ' ').trim();
    if (term) q = q.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
    if (query.categoryId) q = q.eq('category_id', query.categoryId);
    if (query.minPrice != null) q = q.gte('price', query.minPrice);
    if (query.maxPrice != null) q = q.lte('price', query.maxPrice);

    switch (query.sortBy) {
      case 'price_asc': q = q.order('price', { ascending: true }); break;
      case 'price_desc': q = q.order('price', { ascending: false }); break;
      case 'name': q = q.order('name', { ascending: true }); break;
      default: q = q.order('created_at', { ascending: false });
    }

    const { data, error, count } = await q.range(from, to);
    if (error) throw error;

    return {
      items: (data as unknown as ProductRow[]).map(toProduct),
      totalCount: count || 0,
      page,
      pageSize,
    };
  },

  getById: async (id: number): Promise<Product> => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, price, stock, image_url, is_active, category_id, categories(name)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return toProduct(data as unknown as ProductRow);
  },

  categories: async (): Promise<Category[]> => {
    const { data, error } = await supabase.from('categories').select('id, name, description').order('name');
    if (error) throw error;
    return data;
  },

  // Admin
  create: async (data: Partial<Product>): Promise<Product> => {
    const { data: row, error } = await supabase
      .from('products')
      .insert({
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        image_url: data.imageUrl,
        category_id: data.categoryId,
      })
      .select('id, name, description, price, stock, image_url, is_active, category_id, categories(name)')
      .single();
    if (error) throw error;
    return toProduct(row as unknown as ProductRow);
  },

  update: async (id: number, data: Partial<Product>): Promise<Product> => {
    const { data: row, error } = await supabase
      .from('products')
      .update({
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        image_url: data.imageUrl,
        category_id: data.categoryId,
      })
      .eq('id', id)
      .select('id, name, description, price, stock, image_url, is_active, category_id, categories(name)')
      .single();
    if (error) throw error;
    return toProduct(row as unknown as ProductRow);
  },

  // Soft-delete — matches the original behaviour: deleted products stay out of every
  // list (including the admin one) but existing order history keeps its snapshot.
  remove: async (id: number): Promise<void> => {
    const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id);
    if (error) throw error;
  },
};
