import { Api } from '@/utils/Api';
import type { CreateInternalQuotePayload, CreateQuotePayload, Quote, QuoteStatus, } from '@/types/quotes';

export const QuotesService = {
  createQuote: async (payload: CreateQuotePayload) => {
    const { data } = await Api.post<Quote>(`/quotes`, payload);
    return data;
  },

  getMyQuotes: async () => {
    const { data } = await Api.get<Quote[]>(`/quotes/me`);
    return data;
  },

  getAllQuotes: async () => {
    const { data } = await Api.get<Quote[]>(`/quotes`);
    return data;
  },

  getQuoteById: async (id: string) => {
    const { data } = await Api.get<Quote>(`/quotes/${id}`);
    return data;
  },

  createInternalQuote: async (payload: CreateInternalQuotePayload) => {
    const { data } = await Api.post<Quote>(`/quotes/internal`, payload);
    return data;
  },

  respondQuote: async (id: string, payload: {
    price: number;
    commercialNotes?: string;
  }) => {
    const { data } = await Api.patch<Quote>(`/quotes/${id}/respond`, payload);
    return data;
  },

  updateQuoteStatus: async (id: string, payload: {
    status: QuoteStatus;
    notes?: string;
  }) => {
    const { data } = await Api.patch<Quote>(`/quotes/${id}/status`, payload);
    return data;
  },

  updateQuote: async (id: string, payload: Partial<CreateQuotePayload>) => {
    const { data } = await Api.patch<Quote>(`/quotes/${id}`, payload);
    return data;
  },

  deleteQuote: async (id: string) => {
    const { data } = await Api.post<{
      message: string;
    }>(`/quotes/${id}/delete`, undefined);
    return data;
  },
};
