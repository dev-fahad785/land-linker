"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";

type MessageItem = {
  id: string;
  listing_id: string;
  listing_title: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  recipient_id: string;
  recipient_name?: string;
  recipient_email?: string;
  message: string;
  created_at: string;
};

type GroupedConversation = {
  threadKey: string;
  listingId: string;
  listingTitle: string;
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  lastMessage: MessageItem;
  messages: MessageItem[];
};

export default function MessagesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThreadKey, setSelectedThreadKey] = useState("");
  const [composerText, setComposerText] = useState("");
  const [sendingComposer, setSendingComposer] = useState(false);

  const outlineButton = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium border border-[#D1CBBF] hover:bg-[#F5F3ED]";
  const dangerButton = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium border border-[#B04A41] text-[#B04A41] hover:bg-[#FBEAE8]";
  const primaryButton = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white bg-[#2B4A3B] hover:bg-[#1E3329]";
  const inputClass = "w-full rounded-md border border-[#D1CBBF] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4A3B]/30";

  useEffect(() => {
    if (status === "authenticated") {
      void fetchMessages();
    }
  }, [status]);

  const conversations = useMemo<GroupedConversation[]>(() => {
    const grouped = new Map<string, GroupedConversation>();
    const currentUserId = session?.user?.id;

    for (const item of messages) {
      const participants = [item.sender_id, item.recipient_id].sort().join(":");
      const threadKey = `${item.listing_id}:${participants}`;
      const isCurrentUserSender = item.sender_id === currentUserId;

      if (!grouped.has(threadKey)) {
        grouped.set(threadKey, {
          threadKey,
          listingId: item.listing_id,
          listingTitle: item.listing_title,
          partnerId: isCurrentUserSender ? item.recipient_id : item.sender_id,
          partnerName: isCurrentUserSender ? item.recipient_name || item.recipient_email || "Contact" : item.sender_name,
          partnerEmail: isCurrentUserSender ? item.recipient_email || "" : item.sender_email,
          lastMessage: item,
          messages: [],
        });
      }

      const conversation = grouped.get(threadKey)!;
      conversation.messages.push(item);
      if (new Date(item.created_at).getTime() >= new Date(conversation.lastMessage.created_at).getTime()) {
        conversation.lastMessage = item;
        conversation.partnerId = isCurrentUserSender ? item.recipient_id : item.sender_id;
        conversation.partnerName = isCurrentUserSender ? item.recipient_name || item.recipient_email || "Contact" : item.sender_name;
        conversation.partnerEmail = isCurrentUserSender ? item.recipient_email || "" : item.sender_email;
      }
    }

    for (const item of grouped.values()) {
      item.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    return Array.from(grouped.values()).sort((a, b) => {
      return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
    });
  }, [messages, session?.user?.id]);

  useEffect(() => {
    if (conversations.length === 0) {
      setSelectedThreadKey("");
      return;
    }

    if (!selectedThreadKey || !conversations.some((conversation) => conversation.threadKey === selectedThreadKey)) {
      setSelectedThreadKey(conversations[0].threadKey);
    }
  }, [conversations, selectedThreadKey]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.threadKey === selectedThreadKey) || conversations[0] || null,
    [conversations, selectedThreadKey]
  );

  function formatTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown time";
    return date.toLocaleString();
  }

  async function fetchMessages() {
    try {
      setLoading(true);
      const response = await fetch("/api/messages");
      const data = (await response.json().catch(() => [])) as MessageItem[] | { error?: string };
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Failed to fetch messages");
      }
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return <div className="min-h-screen bg-[#FDFBF7] grid place-items-center text-[#59605D]">Loading messages...</div>;
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const role = session?.user?.role;
  const activeConversation = selectedConversation;
  const canCompose = Boolean(activeConversation);
  const composerRecipientId = activeConversation?.partnerId || "";
  const composerListingId = activeConversation?.listingId || "";
  const composerTitle = activeConversation?.partnerName || "No contact selected";
  const composerSubtitle = activeConversation?.listingTitle || "Choose a contact from the left panel";

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="border-b border-[#E8E3D9] bg-white/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-outfit text-[#1C211F]">Messages</h1>
            <p className="text-[#59605D] text-sm">Welcome, {session?.user?.name || "User"}</p>
          </div>
          <div className="flex items-center gap-2">
            {role === "buyer" && <Link href="/buyer"><button type="button" className={outlineButton}>Back to Buyer</button></Link>}
            {role === "seller" && <Link href="/seller"><button type="button" className={outlineButton}>Back to Seller</button></Link>}
            {role === "admin" && <Link href="/admin"><button type="button" className={outlineButton}>Back to Admin</button></Link>}
            <button type="button" className={dangerButton} onClick={() => signOut({ callbackUrl: "/login" })}>Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid min-h-[calc(100vh-10rem)] grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-6">
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#E8E3D9] bg-white shadow-sm">
            <div className="border-b border-[#E8E3D9] px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#59605D]">Recent contacts</p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-sm text-[#59605D]">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-sm text-[#59605D]">
                  No conversations yet. {role === "buyer" ? "Start from a property contact button." : "Wait for a buyer to message you."}
                </div>
              ) : (
                <div className="divide-y divide-[#E8E3D9]">
                  {conversations.map((conversation) => {
                    const active = conversation.threadKey === activeConversation?.threadKey;

                    return (
                      <button
                        key={conversation.threadKey}
                        type="button"
                        data-testid={`conversation-${conversation.threadKey}`}
                        className={`w-full text-left p-4 transition-colors ${active ? "bg-[#F5F3ED]" : "hover:bg-[#F9F8F4]"}`}
                        onClick={() => setSelectedThreadKey(conversation.threadKey)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[#1C211F]">{conversation.partnerName}</p>
                            <p className="truncate text-xs text-[#59605D]">{conversation.listingTitle}</p>
                          </div>
                          <span className="shrink-0 text-[11px] text-[#8A918E]">{formatTime(conversation.lastMessage.created_at)}</span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-[#59605D]">{conversation.lastMessage.message}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </aside>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#E8E3D9] bg-white shadow-sm">
            {activeConversation ? (
              <>
                <div className="border-b border-[#E8E3D9] px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-outfit font-medium text-[#1C211F]">{composerTitle}</h2>
                      <p className="truncate text-sm text-[#59605D]">{composerSubtitle}</p>
                      <p className="truncate text-xs text-[#8A918E]">{activeConversation.partnerEmail || ""}</p>
                    </div>
                    <div className="rounded-full bg-[#E5F0EA] px-3 py-1 text-xs font-medium text-[#2B4A3B]">
                      {activeConversation.messages.length} messages
                    </div>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#fcfbf8_0%,#fdfbf7_100%)] p-5">
                  <div className="space-y-3">
                    {activeConversation.messages.map((item) => {
                      const mine = item.sender_id === session?.user?.id;
                      return (
                        <div key={item.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${mine ? "bg-[#DCE9E0] text-[#1C211F]" : "bg-white border border-[#E8E3D9] text-[#1C211F]"}`}>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{item.message}</p>
                            <p className="mt-2 text-[11px] text-[#59605D]">
                              {mine ? "You" : item.sender_name} • {formatTime(item.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {canCompose ? (
                  <div className="border-t border-[#E8E3D9] bg-white p-4">
                    <form
                      className="flex items-end gap-3"
                      onSubmit={async (event) => {
                        event.preventDefault();
                        const text = composerText.trim();
                        if (!text) {
                          toast.error("Please enter a message");
                          return;
                        }

                        if (!composerListingId || !composerRecipientId) {
                          toast.error("Please select a contact");
                          return;
                        }

                        try {
                          setSendingComposer(true);

                          const response = await fetch("/api/messages", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              listing_id: composerListingId,
                              recipient_id: composerRecipientId,
                              message: text,
                            }),
                          });

                          const data = (await response.json().catch(() => ({}))) as { error?: string };
                          if (!response.ok) {
                            throw new Error(data.error || "Failed to send message");
                          }

                          toast.success("Message sent");
                          setComposerText("");
                          await fetchMessages();
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Failed to send message");
                        } finally {
                          setSendingComposer(false);
                        }
                      }}
                    >
                      <textarea
                        rows={2}
                        className={`${inputClass} flex-1 resize-none`}
                        placeholder={canCompose ? `Message ${composerTitle}` : "Select a contact first"}
                        value={composerText}
                        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setComposerText(event.target.value)}
                      />
                      <button
                        type="submit"
                        data-testid="message-reply-send-button"
                        className={primaryButton}
                        disabled={sendingComposer}
                      >
                        {sendingComposer ? "Sending..." : "Send"}
                      </button>
                    </form>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="grid h-full place-items-center p-8 text-center">
                <div className="max-w-md">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E5F0EA] text-[#2B4A3B]">
                    <span className="text-xl">*</span>
                  </div>
                  <h2 className="text-2xl font-outfit font-medium text-[#1C211F]">No conversation selected</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#59605D]">
                    Pick a recent contact from the left panel to continue chatting.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
