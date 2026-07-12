import { useEffect, useRef, useState, useCallback } from "react";
import {
  getConversations,
  getMessages,
  sendMessage,
  createConversation,
  updateConversationStatus,
  updateConversation,
  markAsRead,
  retryMessage,
} from "./useConversations";
import { getActiveAccounts, getTemplates } from "../whatsapp-accounts/useWhatsAppAccounts";
import { getContacts } from "../contacts/useContacts";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../shared/useWebSocket";
import Loading from "../shared/Loading";
import ErrorAlert from "../shared/ErrorAlert";

const SYSTEM_VARIABLES = [
  { key: "{contact_name}", label: "Contact Name", get: (conv) => conv.contact_name || "" },
  { key: "{contact_phone}", label: "Contact Phone", get: (conv) => conv.contact_phone || "" },
  { key: "{agent_name}", label: "Agent Name", get: (conv, user) => user?.name || "" },
  { key: "{date}", label: "Current Date", get: () => new Date().toISOString().split("T")[0] },
  { key: "{time}", label: "Current Time", get: () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
];

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
}

function WhatsAppStatusIcon({ status, errorCode, errorMessage, onRetry, isRetrying }) {
  if (!status) return null;
  if (status === "sent") {
    return (
      <svg className="h-3.5 w-3.5 text-blue-300" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
      </svg>
    );
  }
  if (status === "requires_template" || errorCode === 131047) {
    return (
      <div className="flex items-center gap-1">
        <div className="group relative">
          <svg className="h-3.5 w-3.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          {errorMessage && (
            <span className="absolute bottom-full left-1/2 z-50 mb-1 hidden w-48 -translate-x-1/2 rounded-lg bg-gray-900 px-2 py-1 text-center text-[10px] text-white group-hover:block">
              {errorMessage}
            </span>
          )}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="ml-1 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-600 hover:bg-amber-100 disabled:opacity-50"
            title="Resend as template"
          >
            {isRetrying ? "..." : "Template"}
          </button>
        )}
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex items-center gap-1">
        <div className="group relative">
          <svg className="h-3.5 w-3.5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          {errorMessage && (
            <span className="absolute bottom-full left-1/2 z-50 mb-1 hidden w-56 -translate-x-1/2 rounded-lg bg-gray-900 px-2 py-1 text-center text-[10px] text-white group-hover:block">
              {errorMessage}
            </span>
          )}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="ml-1 rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
            title="Retry sending"
          >
            {isRetrying ? "..." : "Retry"}
          </button>
        )}
      </div>
    );
  }
  return null;
}

export default function ConversationInbox() {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const messagesEndRef = useRef(null);
  const [convCount, setConvCount] = useState(0);

  const [showCreate, setShowCreate] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [waAccounts, setWaAccounts] = useState([]);
  const [newConvContact, setNewConvContact] = useState("");
  const [newConvWA, setNewConvWA] = useState("");
  const [creating, setCreating] = useState(false);

  const [showWASelector, setShowWASelector] = useState(false);
  const [waAccountsList, setWaAccountsList] = useState([]);
  const [retryingMsgId, setRetryingMsgId] = useState(null);
  const [resendingMsgId, setResendingMsgId] = useState(null);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [templateParams, setTemplateParams] = useState([]);
  const [templateParamCount, setTemplateParamCount] = useState(0);
  const { user } = useAuth();

  function isWithin24h(lastIncomingAt) {
    if (!lastIncomingAt) return true;
    const diff = Date.now() - new Date(lastIncomingAt).getTime();
    return diff <= 24 * 60 * 60 * 1000;
  }

  const withinWindow = activeConv ? isWithin24h(activeConv.last_incoming_at) : true;

  function loadConversations() {
    setError("");
    setLoading(true);
    const params = { limit: 100 };
    if (statusFilter) params.status = statusFilter;
    if (search) params.search = search;
    Promise.all([
      getConversations(params),
      getConversations({ ...params, limit: 1 }).then(
        (r) => Array.isArray(r) && r.length
      ),
    ])
      .then(([data]) => {
        setConversations(data || []);
        setConvCount(data?.length || 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadConversations();
    getActiveAccounts().then(setWaAccountsList).catch(() => {});
  }, [statusFilter, search]);

  function selectConversation(conv) {
    setActiveConv(conv);
    setMessages([]);
    setError("");
    getMessages(conv.id, { limit: 500 })
      .then((data) => {
        setMessages(data || []);
        markAsRead(conv.id).catch(() => {});
      })
      .catch((err) => setError(err.message));
    setShowTemplates(false);
    setSelectedTemplate(null);
    setTemplateParams([]);
  }

  function handleSend(e) {
    e.preventDefault();
    if ((!input.trim() && !selectedTemplate) || sending || !activeConv) return;
    const content = selectedTemplate
      ? input.trim() || `[Template: ${selectedTemplate}]`
      : input.trim();
    if (!content) return;
    setSending(true);
    const template_params =
      selectedTemplate && templateParams.length > 0
        ? templateParams
        : null;
    sendMessage(activeConv.id, {
      content,
      message_type: selectedTemplate ? "template" : "text",
      template_name: selectedTemplate || null,
      template_params,
    })
      .then((msg) => {
        setMessages((prev) => [...prev, msg]);
        setInput("");
        setSelectedTemplate(null);
        setTemplateParams([]);
        setShowTemplates(false);
        loadConversations();
      })
      .catch((err) => setError(err.message))
      .finally(() => setSending(false));
  }

  function handleResendAsTemplate(msg) {
    if (resendingMsgId || !activeConv) return;
    setResendingMsgId(msg.id);
    setError("");

    const waAccount = waAccountsList.find(
      (a) => a.id === activeConv.whatsapp_account_id
    );
    const templateName = waAccount?.default_template_name || "hello_world";

    sendMessage(activeConv.id, {
      content: msg.content,
      message_type: "template",
      template_name: templateName,
    })
      .then((newMsg) => {
        setMessages((prev) => [...prev, newMsg]);
        loadConversations();
      })
      .catch((err) => setError(err.message))
      .finally(() => setResendingMsgId(null));
  }

  function handleToggleStatus() {
    if (!activeConv) return;
    const newStatus = activeConv.status === "open" ? "closed" : "open";
    updateConversationStatus(activeConv.id, newStatus)
      .then((updated) => {
        setActiveConv((prev) => ({ ...prev, status: updated.status }));
        loadConversations();
      })
      .catch((err) => setError(err.message));
  }

  function handleAssignWA(accountId) {
    if (!activeConv) return;
    updateConversation(activeConv.id, { whatsapp_account_id: accountId || null })
      .then((updated) => {
        setActiveConv((prev) => ({ ...prev, whatsapp_account_id: updated.whatsapp_account_id }));
        setShowWASelector(false);
        loadConversations();
      })
      .catch((err) => setError(err.message));
  }

  function handleRetry(messageId) {
    if (retryingMsgId || !activeConv) return;
    setRetryingMsgId(messageId);
    setError("");
    retryMessage(activeConv.id, messageId)
      .then((updated) => {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
        loadConversations();
      })
      .catch((err) => setError(err.message))
      .finally(() => setRetryingMsgId(null));
  }

  const handleWsMessage = useCallback((msg) => {
    if (activeConv && msg.conversation_id === activeConv.id) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    }
    loadConversations();
  }, [activeConv?.id]);

  const handleWsStatus = useCallback((msgId, statusUpdate) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, ...statusUpdate } : m))
    );
  }, []);

  useWebSocket(activeConv?.id, { onMessage: handleWsMessage, onStatusUpdate: handleWsStatus });

  function openCreateModal() {
    setShowCreate(true);
    setNewConvContact("");
    setNewConvWA("");
    setError("");
    Promise.all([
      getContacts({ limit: 500 }),
      getActiveAccounts(),
    ])
      .then(([contactsData, waData]) => {
        const available = (contactsData || []).filter(
          (c) => !conversations.some((conv) => conv.contact_id === c.id)
        );
        setContacts(available);
        setWaAccounts(waData || []);
      })
      .catch((err) => setError(err.message));
  }

  function handleCreateConversation(e) {
    e.preventDefault();
    if (!newConvContact) return;
    setCreating(true);
    setError("");
    createConversation({
      contact_id: parseInt(newConvContact),
      whatsapp_account_id: newConvWA ? parseInt(newConvWA) : null,
    })
      .then((conv) => {
        setShowCreate(false);
        loadConversations();
        selectConversation(conv);
      })
      .catch((err) => setError(err.message))
      .finally(() => setCreating(false));
  }

  function openWASelector() {
    setShowWASelector(true);
    getActiveAccounts()
      .then(setWaAccountsList)
      .catch(() => {});
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activeConv?.whatsapp_account_id) {
      getTemplates(activeConv.whatsapp_account_id)
        .then(setAvailableTemplates)
        .catch(() => setAvailableTemplates([]));
    } else {
      setAvailableTemplates([]);
    }
  }, [activeConv?.whatsapp_account_id]);

  const filterTabs = [
    { label: "All", value: null },
    { label: "Open", value: "open" },
    { label: "Closed", value: "closed" },
  ];

  return (
    <div className="flex h-full min-h-[calc(100vh-8rem)]">
      {/* Left panel - conversation list */}
      <div className="flex w-80 flex-shrink-0 flex-col border-r border-gray-200 bg-white lg:w-96">
        {/* Filters */}
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="relative mb-3">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-xl border-0 bg-gray-100 px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder-gray-400 outline-none ring-1 ring-gray-200 transition-all focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <div className="flex items-center justify-between gap-1">
            <div className="flex gap-1">
              {filterTabs.map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    statusFilter === tab.value
                      ? "bg-primary-100 text-primary-700"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              onClick={openCreateModal}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-primary-100 hover:text-primary-600"
              title="New conversation"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <Loading />
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-sm font-medium text-gray-900">No conversations</p>
              <p className="text-xs text-gray-500 mt-1">
                {search
                  ? "No matches found."
                  : "Click + to start a conversation."}
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = activeConv?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`flex w-full items-center gap-3 border-b border-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                    isActive ? "bg-primary-50" : ""
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-bold text-white shadow-sm">
                      {conv.contact_name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                        conv.status === "open" ? "bg-green-400" : "bg-gray-400"
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {conv.contact_name}
                      </p>
                      {conv.last_message_at && (
                        <span className="ml-2 flex-shrink-0 text-xs text-gray-400">
                          {formatTime(conv.last_message_at)}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {conv.last_message || "No messages yet"}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          conv.status === "open"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {conv.status}
                      </span>
                      {conv.whatsapp_account_id && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          WA
                        </span>
                      )}
                      {conv.unread_count > 0 && (
                        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-500 px-1.5 text-[10px] font-bold text-white">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel - chat */}
      <div className="flex flex-1 flex-col bg-gray-50">
        {!activeConv ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-700">ChatCon Messages</h2>
            <p className="mt-1 text-sm text-gray-400">
              Select a conversation to start chatting
            </p>
            <button onClick={openCreateModal} className="btn-primary mt-6">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Conversation
            </button>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-bold text-white shadow-sm">
                {activeConv.contact_name?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {activeConv.contact_name}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {activeConv.contact_phone}
                </p>
              </div>
              <div className="relative">
                <button
                  onClick={openWASelector}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeConv.whatsapp_account_id
                      ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                  title={activeConv.whatsapp_account_id ? "WhatsApp connected" : "Connect WhatsApp"}
                >
                  <span className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    {activeConv.whatsapp_account_id ? "WA" : "No WA"}
                  </span>
                </button>
                {showWASelector && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-gray-200">
                    <div className="border-b border-gray-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      WhatsApp Account
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAssignWA(null)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                        !activeConv.whatsapp_account_id ? "bg-primary-50 text-primary-700" : "text-gray-700"
                      }`}
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-500">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                      None (DB only)
                    </button>
                    {waAccountsList.map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => handleAssignWA(acc.id)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                          activeConv.whatsapp_account_id === acc.id ? "bg-primary-50 text-primary-700" : "text-gray-700"
                        }`}
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600">
                          {acc.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{acc.name}</p>
                          <p className="truncate text-xs text-gray-400">{acc.phone_number}</p>
                        </div>
                        {activeConv.whatsapp_account_id === acc.id && (
                          <svg className="h-4 w-4 flex-shrink-0 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleToggleStatus}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeConv.status === "open"
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-green-50 text-green-600 hover:bg-green-100"
                }`}
              >
                {activeConv.status === "open" ? "Close" : "Reopen"}
              </button>
            </div>

            <ErrorAlert message={error} />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-gray-400">
                    No messages yet. Send the first message.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === "agent" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                          msg.sender_type === "agent"
                            ? "rounded-br-md bg-primary-500 text-white"
                            : "rounded-bl-md bg-white text-gray-800 ring-1 ring-gray-100"
                        }`}
                      >
                        {msg.message_type === "template" && (
                          <span
                            className={`mb-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                              msg.sender_type === "agent"
                                ? "bg-white/20 text-white"
                                : "bg-primary-50 text-primary-600"
                            }`}
                          >
                            Template: {msg.template_name || "unknown"}
                          </span>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                        <div
                          className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                            msg.sender_type === "agent"
                              ? "text-white/70"
                              : "text-gray-400"
                          }`}
                        >
                          {formatTime(msg.created_at)}
                          {msg.sender_type === "agent" && (
                            <>
                              <WhatsAppStatusIcon
                                status={msg.whatsapp_status}
                                errorCode={msg.whatsapp_error_code}
                                errorMessage={msg.whatsapp_error_message}
                                onRetry={
                                  (msg.whatsapp_status === "error" || msg.whatsapp_status === "requires_template")
                                    ? () => handleRetry(msg.id)
                                    : null
                                }
                                isRetrying={retryingMsgId === msg.id}
                              />
                              <svg
                                className={`h-3.5 w-3.5 ${
                                  msg.is_read ? "text-blue-300" : "text-white/50"
                                }`}
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                              </svg>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 bg-white px-4 py-3">
              {activeConv.status === "closed" ? (
                <p className="py-2 text-center text-sm text-gray-400">
                  This conversation is closed.{" "}
                  <button
                    onClick={handleToggleStatus}
                    className="font-medium text-primary-600 hover:underline"
                  >
                    Reopen it
                  </button>{" "}
                  to send messages.
                </p>
              ) : activeConv.whatsapp_account_id ? (
                <>
                  {!withinWindow && (
                    <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                      <p className="text-xs text-amber-700 font-medium">
                        24-hour window expired. Only template messages can be sent.
                      </p>
                    </div>
                  )}
                  <form onSubmit={handleSend} className="flex items-end gap-2">
                    <div className="relative flex-1">
                      {selectedTemplate && (
                        <div className="mb-1.5 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                              Template: {selectedTemplate}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTemplate(null);
                                  setShowTemplates(false);
                                  setTemplateParams([]);
                                }}
                                className="ml-1 text-primary-400 hover:text-primary-600"
                              >
                                &times;
                              </button>
                            </span>
                          </div>
                          {templateParams.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {templateParams.map((val, i) => (
                                <input
                                  key={i}
                                  type="text"
                                  value={val}
                                  onChange={(e) => {
                                    const next = [...templateParams];
                                    next[i] = e.target.value;
                                    setTemplateParams(next);
                                  }}
                                  placeholder={`Var {{${i + 1}}}`}
                                  className="w-28 rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none focus:border-primary-400"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                          selectedTemplate
                            ? "Add optional note to template..."
                            : withinWindow
                              ? "Type a message..."
                              : "Only template messages allowed (24h window expired)"
                        }
                        disabled={!withinWindow && !selectedTemplate}
                        rows={1}
                        className="input-field resize-none py-3 pr-12"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend(e);
                          }
                        }}
                      />
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="btn-secondary rounded-xl px-3 py-3"
                      title="Send template"
                    >
                      <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                      </svg>
                    </button>
                    {showTemplates && (
                      <div className="absolute bottom-full right-0 mb-2 w-64 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-gray-200">
                        {availableTemplates.length === 0 && (
                          <p className="px-4 py-3 text-xs text-gray-400">No templates found</p>
                        )}
                        {availableTemplates.map((t) => {
                          let paramCount = 0;
                          try {
                            const comps = typeof t.components === "string" ? JSON.parse(t.components) : (t.components || []);
                            const body = comps.find((c) => c.type === "BODY" || c.type === "body");
                            if (body?.text) {
                              const matches = body.text.match(/\{\{\d+\}\}/g);
                              paramCount = matches ? Math.max(...matches.map((m) => parseInt(m.replace(/\D/g, "")))) : 0;
                            }
                          } catch {}
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                setSelectedTemplate(t.name);
                                setTemplateParams(Array(paramCount).fill(""));
                                setShowTemplates(false);
                              }}
                              className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                                selectedTemplate === t.name
                                  ? "bg-primary-50 text-primary-700"
                                  : "text-gray-700"
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-medium">{t.name}</div>
                                <div className="truncate text-xs text-gray-400">{t.category || "—"}</div>
                              </div>
                              {t.status && (
                                <span className={`ml-2 flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  t.status === "APPROVED"
                                    ? "bg-green-100 text-green-700"
                                    : t.status === "PENDING"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-gray-100 text-gray-500"
                                }`}>
                                  {t.status}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={(!input.trim() && !selectedTemplate) || sending || (!withinWindow && !selectedTemplate)}
                    className="btn-primary rounded-xl px-4 py-3"
                  >
                    {sending ? (
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    )}
                  </button>
                </form>
                </>
              ) : (
                <div className="py-3 text-center">
                  <p className="text-sm text-gray-400 mb-2">
                    Connect a WhatsApp account to send messages
                  </p>
                  <button
                    onClick={openWASelector}
                    className="btn-primary text-xs"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Connect WhatsApp
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* New Conversation Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowCreate(false)}>
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">New Conversation</h3>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateConversation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                {contacts.length === 0 ? (
                  <p className="text-sm text-gray-400">No available contacts. Create a contact first.</p>
                ) : (
                  <select
                    value={newConvContact}
                    onChange={(e) => setNewConvContact(e.target.value)}
                    required
                    className="input-field"
                  >
                    <option value="">Select a contact...</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Account <span className="text-xs text-gray-400">(optional)</span>
                </label>
                <select
                  value={newConvWA}
                  onChange={(e) => setNewConvWA(e.target.value)}
                  className="input-field"
                >
                  <option value="">No WhatsApp (DB only)</option>
                  {waAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} — {a.phone_number}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={creating || contacts.length === 0} className="btn-primary">
                  {creating ? "Creating..." : "Start Conversation"}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
