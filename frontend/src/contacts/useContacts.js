import { request } from "../shared/http";

export function getContacts(params = {}) {
  const q = new URLSearchParams();
  if (params.skip) q.set("skip", params.skip);
  if (params.limit) q.set("limit", params.limit);
  if (params.search) q.set("search", params.search);
  return request(`/contacts/?${q}`);
}

export function countContacts(params = {}) {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  return request(`/contacts/count?${q}`);
}

export function getContact(id) {
  return request(`/contacts/${id}`);
}

export function createContact(data) {
  return request("/contacts/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateContact(id, data) {
  return request(`/contacts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteContact(id) {
  return request(`/contacts/${id}`, { method: "DELETE" });
}

export function assignContact(id, agentId) {
  return request(`/contacts/${id}/assign`, {
    method: "PUT",
    body: JSON.stringify({ agent_id: agentId }),
  });
}

export function getAssignableAgents() {
  return request("/contacts/assignable-agents/list");
}
