import { request } from "./http";
import type { ContactAssign, ContactCreate, ContactRead, ContactUpdate, PaginationParams } from "../types";

export const contactService = {
  getAll(params: PaginationParams = {}): Promise<ContactRead[] | null> {
    const q = new URLSearchParams();
    if (params.skip) q.set("skip", String(params.skip));
    if (params.limit) q.set("limit", String(params.limit));
    if (params.search) q.set("search", params.search);
    return request(`/contacts/?${q}`);
  },

  count(search?: string): Promise<{ count: number } | null> {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    return request(`/contacts/count${q}`);
  },

  getById(id: number): Promise<ContactRead | null> {
    return request(`/contacts/${id}`);
  },

  create(data: ContactCreate): Promise<ContactRead | null> {
    return request("/contacts/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: ContactUpdate): Promise<ContactRead | null> {
    return request(`/contacts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete(id: number): Promise<null> {
    return request(`/contacts/${id}`, { method: "DELETE" });
  },

  assignAgent(id: number, data: ContactAssign): Promise<ContactRead | null> {
    return request(`/contacts/${id}/assign`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  getAssignableAgents(): Promise<{ id: number; name: string; email: string }[] | null> {
    return request("/contacts/assignable-agents/list");
  },
};
