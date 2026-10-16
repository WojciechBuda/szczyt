import { supabase } from '../lib/supabaseClient';
import { BlogPost } from '../types/Blog';

interface PostRow {
  id: number; slug: string; title: string; title_en: string | null; excerpt: string; excerpt_en: string | null; cover_image_url: string | null;
  content: string; content_en: string | null; author_name: string; is_published: boolean; published_at: string | null; created_at: string;
}

function toPost(r: PostRow): BlogPost {
  return {
    id: r.id, slug: r.slug, title: r.title, titleEn: r.title_en, excerpt: r.excerpt, excerptEn: r.excerpt_en, coverImageUrl: r.cover_image_url,
    content: r.content, contentEn: r.content_en, authorName: r.author_name, isPublished: r.is_published,
    publishedAt: r.published_at, createdAt: r.created_at,
  };
}

const SELECT = 'id, slug, title, title_en, excerpt, excerpt_en, cover_image_url, content, content_en, author_name, is_published, published_at, created_at';

export const blogApi = {
  listPublished: async (): Promise<BlogPost[]> => {
    const { data, error } = await supabase.from('blog_posts').select(SELECT).eq('is_published', true).order('published_at', { ascending: false });
    if (error) throw error;
    return (data as PostRow[]).map(toPost);
  },

  getBySlug: async (slug: string): Promise<BlogPost | null> => {
    const { data, error } = await supabase.from('blog_posts').select(SELECT).eq('slug', slug).single();
    if (error) return null;
    return toPost(data as PostRow);
  },

  // Admin
  listAll: async (): Promise<BlogPost[]> => {
    const { data, error } = await supabase.from('blog_posts').select(SELECT).order('created_at', { ascending: false });
    if (error) throw error;
    return (data as PostRow[]).map(toPost);
  },

  create: async (post: Partial<BlogPost>): Promise<BlogPost> => {
    const { data, error } = await supabase.from('blog_posts').insert({
      slug: post.slug, title: post.title, title_en: post.titleEn || null, excerpt: post.excerpt, excerpt_en: post.excerptEn || null, cover_image_url: post.coverImageUrl,
      content: post.content, content_en: post.contentEn || null, author_name: post.authorName,
      is_published: post.isPublished, published_at: post.isPublished ? new Date().toISOString() : null,
    }).select(SELECT).single();
    if (error) throw error;
    return toPost(data as PostRow);
  },

  update: async (id: number, post: Partial<BlogPost>, wasPublished: boolean): Promise<BlogPost> => {
    const nowPublishing = post.isPublished && !wasPublished;
    const { data, error } = await supabase.from('blog_posts').update({
      slug: post.slug, title: post.title, title_en: post.titleEn || null, excerpt: post.excerpt, excerpt_en: post.excerptEn || null, cover_image_url: post.coverImageUrl,
      content: post.content, content_en: post.contentEn || null, author_name: post.authorName, is_published: post.isPublished,
      ...(nowPublishing ? { published_at: new Date().toISOString() } : {}),
    }).eq('id', id).select(SELECT).single();
    if (error) throw error;
    return toPost(data as PostRow);
  },

  remove: async (id: number): Promise<void> => {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) throw error;
  },
};
