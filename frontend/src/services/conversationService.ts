import { request } from "./http";
import type {
  ConversationCreate,
  ConversationRead,
  ConversationDetail,
  ConversationStatusUpdate,
  ConversationUpdate,
  MessageCreate,
  MessageRead,
  PaginationParams,
} from "../types";

export const conversationService = {
  getAll(params: PaginationParams = {}): Promise<ConversationRead[] | null> {
    const q = new URLSearchParams();
    if (params.skip) q.set("skip", String(params.skip));
    if (params.limit) q.set("limit", String(params.limit));
    if (params.status) q.set("status", params.status);
    if (params.search) q.set("search", params.search);
    return request(`/conversations/?${q}`);
  },

  count(params: { status?: string; search?: string } = {}): Promise<{ count: number } | null> {
    const q = new URLSearchParams();
    if (params.status) q.set("status", params.status);
    if (params.search) q.set("search", params.search);
    return request(`/conversations/count?${q}`);
  },

  getById(id: number): Promise<ConversationDetail | null> {
    return request(`/conversations/${id}`);
  },

  create(data: ConversationCreate): Promise<ConversationRead | null> {
    return request("/conversations/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateStatus(id: number, data: ConversationStatusUpdate): Promise<ConversationRead | null> {
    return request(`/conversations/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: ConversationUpdate): Promise<ConversationRead | null> {
    return request(`/conversations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  getMessages(id: number, params: PaginationParams = {}): Promise<MessageRead[] | null> {
    const q = new URLSearchParams();
    if (params.skip) q.set("skip", String(params.skip));
    if (params.limit) q.set("limit", String(params.limit));
    return request(`/conversations/${id}/messages?${q}`);
  },

  sendMessage(id: number, data: MessageCreate): Promise<MessageRead | null> {
    return request(`/conversations/${id}/messages`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  markRead(id: number): Promise<{ updated: number } | null> {
    return request(`/conversations/${id}/read`, { method: "POST" });
  },
};
