import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contactService } from "../services/contactService";
import type { ContactCreate, ContactUpdate, ContactAssign, PaginationParams } from "../types";

const CONTACTS_KEY = "contacts";

export function useContacts(params: PaginationParams = {}) {
  return useQuery({
    queryKey: [CONTACTS_KEY, params],
    queryFn: () => contactService.getAll(params),
  });
}

export function useContactsCount(search?: string) {
  return useQuery({
    queryKey: [CONTACTS_KEY, "count", search],
    queryFn: () => contactService.count(search),
  });
}

export function useContact(id: number) {
  return useQuery({
    queryKey: [CONTACTS_KEY, id],
    queryFn: () => contactService.getById(id),
    enabled: !!id,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ContactCreate) => contactService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CONTACTS_KEY] }),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ContactUpdate }) =>
      contactService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CONTACTS_KEY] }),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => contactService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CONTACTS_KEY] }),
  });
}

export function useAssignAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ContactAssign }) =>
      contactService.assignAgent(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CONTACTS_KEY] }),
  });
}

export function useAssignableAgents() {
  return useQuery({
    queryKey: [CONTACTS_KEY, "assignable-agents"],
    queryFn: () => contactService.getAssignableAgents(),
  });
}
