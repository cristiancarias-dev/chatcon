import { request } from "./http";
import type {
  WhatsAppTemplateCreate,
  WhatsAppTemplateRead,
  WhatsAppTemplateUpdate,
} from "../types";

export const whatsappTemplateService = {
  getByAccount(accountId: number): Promise<WhatsAppTemplateRead[] | null> {
    return request(`/whatsapp-templates/accounts/${accountId}/templates`);
  },

  getById(accountId: number, templateId: number): Promise<WhatsAppTemplateRead | null> {
    return request(`/whatsapp-templates/accounts/${accountId}/templates/${templateId}`);
  },

  refreshFromMeta(accountId: number): Promise<WhatsAppTemplateRead[] | null> {
    return request(`/whatsapp-templates/accounts/${accountId}/templates/refresh`, {
      method: "POST",
    });
  },

  syncOrphans(accountId: number): Promise<WhatsAppTemplateRead[] | null> {
    return request(`/whatsapp-templates/accounts/${accountId}/templates/sync`, {
      method: "POST",
    });
  },

  create(
    accountId: number,
    data: WhatsAppTemplateCreate
  ): Promise<WhatsAppTemplateRead | null> {
    return request(`/whatsapp-templates/accounts/${accountId}/templates`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(
    accountId: number,
    templateId: number,
    data: WhatsAppTemplateUpdate
  ): Promise<WhatsAppTemplateRead | null> {
    return request(`/whatsapp-templates/accounts/${accountId}/templates/${templateId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete(accountId: number, templateId: number): Promise<null> {
    return request(`/whatsapp-templates/accounts/${accountId}/templates/${templateId}`, {
      method: "DELETE",
    });
  },
};
