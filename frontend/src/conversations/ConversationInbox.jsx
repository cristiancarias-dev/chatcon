import { useEffect, useRef, useState } from "react";
import {
  getConversations,
  getMessages,
  sendMessage,
  updateConversationStatus,
  markAsRead,
} from "./useConversations";
import Loading from "../shared/Loading";
import ErrorAlert from "../shared/ErrorAlert";

const TEMPLATES = [
  { name: "welcome", label: "Welcome message" },
  { name: "order_confirmed", label: "Order confirmed" },
  { name: "support", label: "Support reply" },
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
  }

  function handleSend(e) {
    e.preventDefault();
    if ((!input.trim() && !selectedTemplate) || sending || !activeConv) return;
    const content = selectedTemplate
      ? `[Template: ${selectedTemplate}] ${input.trim()}`
      : input.trim();
    if (!content) return;
    setSending(true);
    sendMessage(activeConv.id, {
      content,
      message_type: selectedTemplate ? "template" : "text",
      template_name: selectedTemplate || null,
    })
      .then((msg) => {
        setMessages((prev) => [...prev, msg]);
        setInput("");
        setSelectedTemplate(null);
        setShowTemplates(false);
        loadConversations();
      })
      .catch((err) => setError(err.message))
      .finally(() => setSending(false));
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
                  : "Create a contact and start a conversation."}
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
                            <svg
                              className={`h-3.5 w-3.5 ${
                                msg.is_read ? "text-blue-300" : "text-white/50"
                              }`}
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
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
              ) : (
                <form onSubmit={handleSend} className="flex items-end gap-2">
                  <div className="relative flex-1">
                    {selectedTemplate && (
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                          Template: {selectedTemplate}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTemplate(null);
                              setShowTemplates(false);
                            }}
                            className="ml-1 text-primary-400 hover:text-primary-600"
                          >
                            &times;
                          </button>
                        </span>
                      </div>
                    )}
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={
                        selectedTemplate
                          ? "Add optional note to template..."
                          : "Type a message..."
                      }
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
                      <div className="absolute bottom-full right-0 mb-2 w-52 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-gray-200">
                        {TEMPLATES.map((t) => (
                          <button
                            key={t.name}
                            type="button"
                            onClick={() => {
                              setSelectedTemplate(t.name);
                              setShowTemplates(false);
                            }}
                            className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                              selectedTemplate === t.name
                                ? "bg-primary-50 text-primary-700"
                                : "text-gray-700"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={(!input.trim() && !selectedTemplate) || sending}
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
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
