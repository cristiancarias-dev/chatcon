import { request } from "../shared/http";

export function getAccounts() {
  return request("/whatsapp-accounts/");
}

export function getAccount(id) {
  return request(`/whatsapp-accounts/${id}`);
}

export function createAccount(data) {
  return request("/whatsapp-accounts/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAccount(id, data) {
  return request(`/whatsapp-accounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteAccount(id) {
  return request(`/whatsapp-accounts/${id}`, { method: "DELETE" });
}

export async function getActiveAccounts() {
  const all = await request("/whatsapp-accounts/");
  return all.filter((a) => a.is_active);
}

export function subscribeWebhook(id) {
  return request(`/whatsapp-accounts/${id}/subscribe-webhook`, { method: "POST" });
}

export function getTemplates(accountId) {
  return request(`/whatsapp-templates/accounts/${accountId}/templates`);
}

export function refreshTemplates(accountId) {
  return request(`/whatsapp-templates/accounts/${accountId}/templates/refresh`, { method: "POST" });
}

export function syncTemplates(accountId) {
  return request(`/whatsapp-templates/accounts/${accountId}/templates/sync`, { method: "POST" });
}

export function createTemplate(accountId, data) {
  return request(`/whatsapp-templates/accounts/${accountId}/templates`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTemplate(accountId, templateId, data) {
  return request(`/whatsapp-templates/accounts/${accountId}/templates/${templateId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function getTemplate(accountId, templateId) {
  return request(`/whatsapp-templates/accounts/${accountId}/templates/${templateId}`);
}

export function deleteTemplate(accountId, templateId) {
  return request(`/whatsapp-templates/accounts/${accountId}/templates/${templateId}`, {
    method: "DELETE",
  });
}
