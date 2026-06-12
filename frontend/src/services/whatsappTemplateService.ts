import { request } from "./http";
import type { WhatsAppTemplateCreate, WhatsAppTemplateRead } from "../types";

export const whatsappTemplateService = {
  getByAccount(accountId: number): Promise<WhatsAppTemplateRead[] | null> {
    return request(`/whatsapp-templates/accounts/${accountId}/templates`);
  },

  refreshFromMeta(accountId: number): Promise<WhatsAppTemplateRead[] | null> {
    return request(`/whatsapp-templates/accounts/${accountId}/templates/refresh`, {
      method: "POST",
    });
  },

  create(accountId: number, data: WhatsAppTemplateCreate): Promise<WhatsAppTemplateRead | null> {
    return request(`/whatsapp-templates/accounts/${accountId}/templates`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  delete(accountId: number, templateId: number): Promise<null> {
    return request(`/whatsapp-templates/accounts/${accountId}/templates/${templateId}`, {
      method: "DELETE",
    });
  },
};
