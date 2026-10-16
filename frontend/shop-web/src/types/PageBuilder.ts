export type BlockType = 'hero' | 'rich_text' | 'gallery' | 'categories' | 'featured_products' | 'banner';

export interface BlockStyle {
  backgroundColor?: string | null;
  backgroundImageUrl?: string | null;
  textColor?: string | null;
  fontFamily?: string | null;
  paddingSize?: 'sm' | 'md' | 'lg';
}

export interface HeroContent { title?: string; subtitle?: string; buttonText?: string; buttonLink?: string }
export interface RichTextContent { html?: string; /** Use the full 1200px content width instead of the 760px reading column. */ wide?: boolean }
export interface GalleryImage { url: string; caption?: string }
export interface GalleryContent { images?: GalleryImage[] }
export interface BannerContent { title?: string; subtitle?: string; buttonText?: string; buttonLink?: string }
export interface CategoriesContent { title?: string; subtitle?: string }
export interface FeaturedContent { title?: string; subtitle?: string }

export type BlockContent = HeroContent & RichTextContent & GalleryContent & BannerContent & CategoriesContent & FeaturedContent & {
  /** English overrides for the text fields above; empty/missing values fall back to Polish. */
  en?: { title?: string; subtitle?: string; buttonText?: string; html?: string };
};

export interface PageBlock {
  id: number;
  pageId: number;
  type: BlockType;
  order: number;
  isVisible: boolean;
  content: BlockContent;
  style: BlockStyle;
}

export interface Page {
  id: number;
  slug: string;
  title: string;
  isSystem: boolean;
}
