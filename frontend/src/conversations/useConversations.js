import { request } from "../shared/http";

export function getConversations(params = {}) {
  const q = new URLSearchParams();
  if (params.skip) q.set("skip", params.skip);
  if (params.limit) q.set("limit", params.limit);
  if (params.status) q.set("status", params.status);
  if (params.search) q.set("search", params.search);
  return request(`/conversations/?${q}`);
}

export function countConversations(params = {}) {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  if (params.search) q.set("search", params.search);
  return request(`/conversations/count?${q}`);
}

export function getConversation(id) {
  return request(`/conversations/${id}`);
}

export function createConversation(data) {
  return request("/conversations/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateConversationStatus(id, status) {
  return request(`/conversations/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function getMessages(conversationId, params = {}) {
  const q = new URLSearchParams();
  if (params.skip) q.set("skip", params.skip);
  if (params.limit) q.set("limit", params.limit);
  return request(`/conversations/${conversationId}/messages?${q}`);
}

export function sendMessage(conversationId, data) {
  return request(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function markAsRead(conversationId) {
  return request(`/conversations/${conversationId}/read`, {
    method: "POST",
  });
}
