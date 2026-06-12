import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationService } from "../services/conversationService";
import type {
  ConversationCreate,
  ConversationStatusUpdate,
  ConversationUpdate,
  MessageCreate,
  PaginationParams,
} from "../types";

const CONVERSATIONS_KEY = "conversations";

export function useConversations(params: PaginationParams = {}) {
  return useQuery({
    queryKey: [CONVERSATIONS_KEY, params],
    queryFn: () => conversationService.getAll(params),
  });
}

export function useConversationsCount(params: { status?: string; search?: string } = {}) {
  return useQuery({
    queryKey: [CONVERSATIONS_KEY, "count", params],
    queryFn: () => conversationService.count(params),
  });
}

export function useConversation(id: number) {
  return useQuery({
    queryKey: [CONVERSATIONS_KEY, id],
    queryFn: () => conversationService.getById(id),
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ConversationCreate) => conversationService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] }),
  });
}

export function useUpdateConversationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ConversationStatusUpdate }) =>
      conversationService.updateStatus(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] }),
  });
}

export function useUpdateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ConversationUpdate }) =>
      conversationService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] }),
  });
}

export function useMessages(conversationId: number, params: PaginationParams = {}) {
  return useQuery({
    queryKey: [CONVERSATIONS_KEY, conversationId, "messages", params],
    queryFn: () => conversationService.getMessages(conversationId, params),
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, data }: { conversationId: number; data: MessageCreate }) =>
      conversationService.sendMessage(conversationId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] }),
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: number) => conversationService.markRead(conversationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] }),
  });
}
