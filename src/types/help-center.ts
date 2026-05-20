export interface HelpArticleUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface HelpArticle {
  id: string;
  title: string;
  questions: string[];
  answer: string;
  category: string;
  tags: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: HelpArticleUser | null;
  updatedBy?: HelpArticleUser | null;
}

export interface HelpArticlePayload {
  title: string;
  questions: string[];
  answer: string;
  category: string;
  tags: string[];
  active?: boolean;
}

export interface HelpChatResponse {
  answer: string;
  matched: boolean;
  article?: {
    id: string;
    title: string;
    category: string;
  };
}
