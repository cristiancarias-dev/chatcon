import { request } from "./http";
import type { WhatsAppAccountCreate, WhatsAppAccountRead, WhatsAppAccountUpdate } from "../types";

export const whatsappAccountService = {
  getAll(): Promise<WhatsAppAccountRead[] | null> {
    return request("/whatsapp-accounts/");
  },

  getById(id: number): Promise<WhatsAppAccountRead | null> {
    return request(`/whatsapp-accounts/${id}`);
  },

  create(data: WhatsAppAccountCreate): Promise<WhatsAppAccountRead | null> {
    return request("/whatsapp-accounts/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: WhatsAppAccountUpdate): Promise<WhatsAppAccountRead | null> {
    return request(`/whatsapp-accounts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete(id: number): Promise<null> {
    return request(`/whatsapp-accounts/${id}`, { method: "DELETE" });
  },

  subscribeWebhook(id: number): Promise<{ success: boolean } | null> {
    return request(`/whatsapp-accounts/${id}/subscribe-webhook`, {
      method: "POST",
    });
  },
};
