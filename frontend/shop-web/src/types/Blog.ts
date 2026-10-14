export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  titleEn?: string | null;
  excerpt: string;
  excerptEn?: string | null;
  coverImageUrl: string | null;
  content: string;
  contentEn?: string | null;
  authorName: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}
