"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Ticket,
  ShieldCheck,
  Search,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  ShoppingBag,
  Sparkles,
  Phone,
  User,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface TicketInfo {
  id: string;
  title: string | null;
  from: string | null;
  to: string | null;
  price: number | null;
  travelDate: string | null;
  travelTime: string | null;
  seatNumber: string | null;
  ticketType: string | null;
  ticketStatus: string;
  operatorName?: string | null;
  coachType?: string | null;
  bogeyNumber?: string | null;
}

interface PartnerInfo {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
}

interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface ConversationItem {
  id: string;
  ticket: TicketInfo | null;
  partner: PartnerInfo;
  lastMessage: MessageItem | null;
  unreadCount: number;
  updatedAt: string;
}

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramConversationId = searchParams.get("conversationId");
  const paramTicketId = searchParams.get("ticketId");
  const paramSellerId = searchParams.get("sellerId");

  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    paramConversationId || null
  );
  const [activeConversation, setActiveConversation] = useState<{
    id: string;
    ticket: TicketInfo | null;
    partner: PartnerInfo;
    messages: MessageItem[];
  } | null>(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Check current logged-in user
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
        } else {
          router.push("/login?redirect=/messages");
        }
      })
      .catch(() => {
        router.push("/login?redirect=/messages");
      });
  }, [router]);

  // 2. Fetch conversations list
  const loadConversations = async (selectIdAfterLoad?: string) => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations || []);

        if (selectIdAfterLoad) {
          setSelectedConversationId(selectIdAfterLoad);
        } else if (!selectedConversationId && data.conversations.length > 0 && !paramTicketId) {
          setSelectedConversationId(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // 3. If navigated with ticketId/sellerId, locate or trigger initial message
  useEffect(() => {
    if (paramTicketId && paramSellerId && conversations.length > 0) {
      const existing = conversations.find(
        (c) => c.ticket?.id === paramTicketId || c.partner.id === paramSellerId
      );
      if (existing) {
        setSelectedConversationId(existing.id);
      }
    }
  }, [paramTicketId, paramSellerId, conversations]);

  // 4. Fetch messages for selected conversation
  const loadActiveChat = async (convId: string, isSilent = false) => {
    if (!isSilent) setLoadingChat(true);
    try {
      const res = await fetch(`/api/messages/${convId}`);
      const data = await res.json();
      if (data.success) {
        setActiveConversation(data.conversation);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      if (!isSilent) setLoadingChat(false);
    }
  };

  useEffect(() => {
    if (!selectedConversationId) return;

    loadActiveChat(selectedConversationId);

    // Setup periodic polling every 3.5s for real-time experience
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    pollingTimerRef.current = setInterval(() => {
      loadActiveChat(selectedConversationId, true);
    }, 3500);

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [selectedConversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  // 5. Send message handler
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || messageText;
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      const payload: {
        content: string;
        conversationId?: string;
        ticketId?: string;
        recipientId?: string;
      } = { content: text.trim() };

      if (selectedConversationId) {
        payload.conversationId = selectedConversationId;
      } else if (paramTicketId) {
        payload.ticketId = paramTicketId;
        payload.recipientId = paramSellerId || undefined;
      }

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send message.");

      setMessageText("");

      if (data.conversationId) {
        if (selectedConversationId !== data.conversationId) {
          setSelectedConversationId(data.conversationId);
        }
        await loadActiveChat(data.conversationId, true);
        await loadConversations();
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error sending message");
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    const partnerName = c.partner.name.toLowerCase();
    const ticketTitle = (c.ticket?.title || "").toLowerCase();
    const fromTo = `${c.ticket?.from || ""} ${c.ticket?.to || ""}`.toLowerCase();
    return partnerName.includes(q) || ticketTitle.includes(q) || fromTo.includes(q);
  });

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800 font-sans">
      {/* Top Header Banner */}
      <div className="bg-[#1A1C43] text-white py-6 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-500/20 text-[#5EEAD4] border border-teal-500/30">
                <MessageSquare size={18} />
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Direct Buyer & Seller Chat
              </h1>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Discuss ticket details, seat positions, and arrange delivery with 100% Escrow Protection.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold bg-white/10 px-3.5 py-1.5 rounded-xl backdrop-blur-sm border border-white/10 text-emerald-300">
            <ShieldCheck size={16} />
            <span>Escrow Protected Chats</span>
          </div>
        </div>
      </div>

      {/* Main Messaging Container */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[620px] max-h-[800px]">
          {/* =========================================================
              LEFT PANEL: CONVERSATIONS LIST (4 cols on desktop)
          ========================================================== */}
          <div
            className={`md:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50/60 ${
              selectedConversationId ? "hidden md:flex" : "flex"
            }`}
          >
            {/* Search Header */}
            <div className="p-4 border-b border-slate-200 bg-white">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search buyer, seller, route..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Conversation Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loadingList ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                  <Loader2 size={24} className="animate-spin text-teal-600 mx-auto" />
                  <p>Loading your conversations...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                    <MessageSquare size={22} />
                  </div>
                  <p className="font-bold text-slate-700">No conversations yet</p>
                  <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                    Browse tickets and click &ldquo;Chat with Seller&rdquo; to start discussing.
                  </p>
                  <Link
                    href="/tickets"
                    className="inline-block mt-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition"
                  >
                    Browse Tickets
                  </Link>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = selectedConversationId === conv.id;
                  const formattedTime = conv.lastMessage
                    ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "";

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversationId(conv.id)}
                      className={`w-full text-left p-3.5 sm:p-4 transition flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? "bg-teal-50/80 border-l-4 border-teal-600 shadow-sm"
                          : "hover:bg-slate-100/70"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1A1C43] to-slate-700 text-teal-300 font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                        {conv.partner.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-xs text-slate-900 truncate">
                            {conv.partner.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                            {formattedTime}
                          </span>
                        </div>

                        {/* Ticket route badge */}
                        {conv.ticket && (
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-semibold text-teal-700 truncate">
                            <Ticket size={12} className="shrink-0" />
                            <span className="truncate">
                              {conv.ticket.from} ➔ {conv.ticket.to} (৳{conv.ticket.price})
                            </span>
                          </div>
                        )}

                        {/* Last message preview */}
                        <p className="text-xs text-slate-500 truncate mt-1">
                          {conv.lastMessage?.content || "No messages yet"}
                        </p>
                      </div>

                      {/* Unread badge */}
                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* =========================================================
              RIGHT PANEL: ACTIVE CHAT WINDOW (8 cols on desktop)
          ========================================================== */}
          <div
            className={`md:col-span-8 flex flex-col bg-white ${
              !selectedConversationId ? "hidden md:flex" : "flex"
            }`}
          >
            {activeConversation ? (
              <>
                {/* Chat Partner Top Bar */}
                <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-white flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedConversationId(null)}
                      className="md:hidden p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                    >
                      <ArrowLeft size={16} />
                    </button>

                    <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-700 font-bold flex items-center justify-center text-sm border border-teal-500/20">
                      {activeConversation.partner.name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm text-slate-900 leading-none">
                          {activeConversation.partner.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 uppercase">
                          {activeConversation.partner.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{activeConversation.partner.email}</span>
                        {activeConversation.partner.phone && (
                          <span className="flex items-center gap-1 text-teal-600">
                            <Phone size={10} />
                            {activeConversation.partner.phone}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {activeConversation.ticket && (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/tickets/${activeConversation.ticket.id}`}
                        target="_blank"
                        className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
                      >
                        <Ticket size={12} />
                        <span>View Listing</span>
                        <ExternalLink size={10} />
                      </Link>

                      <Link
                        href={`/checkout?ticketId=${activeConversation.ticket.id}`}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm transition"
                      >
                        <ShoppingBag size={12} />
                        <span>Escrow Buy</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Ticket Details Highlight Banner */}
                {activeConversation.ticket && (
                  <div className="bg-gradient-to-r from-teal-50 via-emerald-50/40 to-teal-50 border-b border-teal-100/80 px-4 py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-extrabold text-[#1A1C43]">
                        {activeConversation.ticket.from} ➔ {activeConversation.ticket.to}
                      </span>
                      {activeConversation.ticket.operatorName && (
                        <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded">
                          {activeConversation.ticket.operatorName}
                        </span>
                      )}
                      {activeConversation.ticket.coachType && (
                        <span className="text-[10px] bg-slate-200/80 text-slate-700 font-semibold px-2 py-0.5 rounded hidden sm:inline">
                          {activeConversation.ticket.coachType}
                        </span>
                      )}
                      {activeConversation.ticket.seatNumber && (
                        <span className="text-[10px] text-slate-600 font-semibold hidden md:inline">
                          Seat: {activeConversation.ticket.seatNumber}
                        </span>
                      )}
                    </div>

                    <div className="font-black text-teal-700 shrink-0">
                      ৳{activeConversation.ticket.price?.toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Chat Messages History Body */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8FAFC]">
                  {loadingChat ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      <Loader2 size={24} className="animate-spin text-teal-600 mx-auto mb-2" />
                      Loading messages...
                    </div>
                  ) : activeConversation.messages.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                      <Sparkles size={24} className="text-teal-500 mx-auto" />
                      <p className="font-bold text-slate-700">Start the conversation</p>
                      <p className="text-slate-400 max-w-xs mx-auto">
                        Ask any questions about departure points, seating, or arrange instant Escrow checkout.
                      </p>
                    </div>
                  ) : (
                    activeConversation.messages.map((msg) => {
                      const isMe = msg.senderId === currentUser?.id;
                      const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2 ${
                            isMe ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!isMe && (
                            <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                              {activeConversation.partner.name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div
                            className={`max-w-[78%] sm:max-w-[65%] rounded-2xl p-3 shadow-xs text-xs ${
                              isMe
                                ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-br-xs"
                                : "bg-white border border-slate-200 text-slate-800 rounded-bl-xs"
                            }`}
                          >
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            <div
                              className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                                isMe ? "text-teal-100" : "text-slate-400"
                              }`}
                            >
                              <span>{timeStr}</span>
                              {isMe &&
                                (msg.isRead ? (
                                  <CheckCheck size={12} className="text-teal-200" />
                                ) : (
                                  <Check size={12} />
                                ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Reply Suggestions */}
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex overflow-x-auto gap-2">
                  {[
                    "Is this ticket still available?",
                    "Can you confirm the departure time?",
                    "Is the price negotiable?",
                    "I am ready to buy via Escrow.",
                  ].map((quickText, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(quickText)}
                      className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-medium text-slate-600 hover:border-teal-500 hover:text-teal-700 whitespace-nowrap transition cursor-pointer shadow-2xs"
                    >
                      {quickText}
                    </button>
                  ))}
                </div>

                {/* Message Input Box */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Type your message here..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1 py-2.5 px-4 bg-slate-100 border border-slate-200 rounded-2xl text-xs outline-none focus:border-teal-500 focus:bg-white transition"
                  />

                  <button
                    type="submit"
                    disabled={!messageText.trim() || sending}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-2xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    {sending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <span>Send</span>
                        <Send size={14} />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                  <MessageSquare size={32} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Select a Conversation</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Choose a chat on the left or click &ldquo;Chat with Seller&rdquo; on any ticket listing to start a secure conversation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-teal-600" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
