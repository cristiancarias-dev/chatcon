import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { whatsappTemplateService } from "../services/whatsappTemplateService";
import type { WhatsAppTemplateCreate } from "../types";

const TEMPLATES_KEY = "whatsapp-templates";

export function useWhatsAppTemplates(accountId: number) {
  return useQuery({
    queryKey: [TEMPLATES_KEY, accountId],
    queryFn: () => whatsappTemplateService.getByAccount(accountId),
    enabled: !!accountId,
  });
}

export function useRefreshTemplates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: number) => whatsappTemplateService.refreshFromMeta(accountId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TEMPLATES_KEY] }),
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, data }: { accountId: number; data: WhatsAppTemplateCreate }) =>
      whatsappTemplateService.create(accountId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TEMPLATES_KEY] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, templateId }: { accountId: number; templateId: number }) =>
      whatsappTemplateService.delete(accountId, templateId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TEMPLATES_KEY] }),
  });
}
