export type ChatEntityType =
  | "LEAD"
  | "CLIENTE"
  | "COTACAO"
  | "PROPOSTA"
  | "TICKET";

export type ChatMessageVisibility =
  | "PUBLICA_CLIENTE"
  | "INTERNA"
  | "GESTAO_COMERCIAL"
  | "PRIVADA_USUARIOS";

export type ChatParticipantInput = {
  userId: string;
  canRead?: boolean;
  canWrite?: boolean;
};

export type CreateChatPayload = {
  entityType: ChatEntityType;
  entityId: string;
  title?: string;
  participants?: ChatParticipantInput[];
};

export type SendChatMessagePayload = {
  content: string;
  visibility: ChatMessageVisibility;
  authorizedUserIds?: string[];
};

export type UpdateChatMessagePayload = {
  content?: string;
  visibility?: ChatMessageVisibility;
  authorizedUserIds?: string[];
};

export type UpdateChatParticipantsPayload = {
  participants: ChatParticipantInput[];
};

export type ChatAuthor = {
  id: string;
  name: string;
  email?: string;
  role: string;
};

export type ChatMessageRecipient = {
  id: string;
  messageId: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email?: string;
    role: string;
  };
};

export type ChatMessage = {
  id: string;
  chatId: string;
  authorId: string;
  content: string;
  visibility: ChatMessageVisibility;
  createdAt: string;
  updatedAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  author?: ChatAuthor;
  recipients?: ChatMessageRecipient[];
};

export type ChatParticipant = {
  id: string;
  chatId: string;
  userId: string;
  canRead: boolean;
  canWrite: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    role: string;
  };
};

export type Chat = {
  id: string;
  entityType: ChatEntityType;
  entityId: string;
  title?: string | null;
  leadId?: string | null;
  clientId?: string | null;
  quoteId?: string | null;
  propostaId?: string | null;
  ticketId?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  participants?: ChatParticipant[];
};

export type ChatListItem = Chat & {
  client?: {
    id: string;
    companyName?: string | null;
    user?: {
      name: string;
    } | null;
  } | null;
  lead?: {
    id: string;
    name: string;
    company?: string | null;
  } | null;
  quote?: {
    id: string;
    code: string;
    serviceType: string;
  } | null;
  proposta?: {
    id: string;
    code: string;
    titulo: string;
    status: string;
  } | null;
  ticket?: {
    id: string;
    subject: string;
    status: string;
    internalOnly?: boolean;
  } | null;
  messages?: ChatMessage[];
};
