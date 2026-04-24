export type ContentType = 'NOTICIA' | 'INFORMACAO' | 'VLOG';

export interface PortalContentAuthor {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface PortalContent {
  id: string;
  title: string;
  summary: string;
  body: string;
  type: ContentType;
  campaignName?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  highlight: boolean;
  coverImageUrl?: string | null;
  videoUrl?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  author: PortalContentAuthor;
}

export interface PortalContentPayload {
  title: string;
  summary: string;
  body: string;
  type: ContentType;
  campaignName?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  highlight?: boolean;
  coverImageUrl?: string;
  videoUrl?: string;
  isPublished?: boolean;
}
