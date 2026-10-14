export interface SocialLink {
  id: number;
  platform: string;
  url: string;
  order: number;
  isVisible: boolean;
}

export interface Footer {
  footerText: string;
  footerTextEn?: string | null;
  contactEmail?: string | null;
  socialLinks: SocialLink[];
}
