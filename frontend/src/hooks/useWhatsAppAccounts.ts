import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { whatsappAccountService } from "../services/whatsappAccountService";
import type { WhatsAppAccountCreate, WhatsAppAccountUpdate } from "../types";

const WA_ACCOUNTS_KEY = "whatsapp-accounts";

export function useWhatsAppAccounts() {
  return useQuery({
    queryKey: [WA_ACCOUNTS_KEY],
    queryFn: () => whatsappAccountService.getAll(),
  });
}

export function useWhatsAppAccount(id: number) {
  return useQuery({
    queryKey: [WA_ACCOUNTS_KEY, id],
    queryFn: () => whatsappAccountService.getById(id),
    enabled: !!id,
  });
}

export function useCreateWhatsAppAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: WhatsAppAccountCreate) => whatsappAccountService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [WA_ACCOUNTS_KEY] }),
  });
}

export function useUpdateWhatsAppAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: WhatsAppAccountUpdate }) =>
      whatsappAccountService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [WA_ACCOUNTS_KEY] }),
  });
}

export function useDeleteWhatsAppAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => whatsappAccountService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [WA_ACCOUNTS_KEY] }),
  });
}
