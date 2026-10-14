export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  content: string;
  authorName: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}
