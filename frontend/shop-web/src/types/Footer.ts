export interface SocialLink {
  id: number;
  platform: string;
  url: string;
  order: number;
  isVisible: boolean;
}

export interface Footer {
  footerText: string;
  contactEmail?: string | null;
  socialLinks: SocialLink[];
}
