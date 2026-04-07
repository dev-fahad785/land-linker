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
  listingId: string;
  listingTitle: string;
  messages: MessageItem[];
};

export default function MessagesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<Record<string, boolean>>({});

  const outlineButton = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium border border-[#D1CBBF] hover:bg-[#F5F3ED]";
  const dangerButton = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium border border-[#B04A41] text-[#B04A41] hover:bg-[#FBEAE8]";
  const primaryButton = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white bg-[#2B4A3B] hover:bg-[#1E3329]";
  const cardClass = "rounded-xl border border-[#E8E3D9] bg-white shadow-sm";
  const inputClass = "w-full rounded-md border border-[#D1CBBF] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4A3B]/30";

  useEffect(() => {
    if (status === "authenticated") {
      void fetchMessages();
    }
  }, [status]);

  const conversations = useMemo<GroupedConversation[]>(() => {
    const grouped = new Map<string, GroupedConversation>();

    for (const item of messages) {
      if (!grouped.has(item.listing_id)) {
        grouped.set(item.listing_id, {
          listingId: item.listing_id,
          listingTitle: item.listing_title,
          messages: [],
        });
      }
      grouped.get(item.listing_id)!.messages.push(item);
    }

    for (const item of grouped.values()) {
      item.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    return Array.from(grouped.values()).sort((a, b) => {
      const lastA = a.messages[a.messages.length - 1];
      const lastB = b.messages[b.messages.length - 1];
      return new Date(lastB.created_at).getTime() - new Date(lastA.created_at).getTime();
    });
  }, [messages]);

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

  async function sendSellerReply(listingId: string, recipientId: string) {
    const text = (replyText[listingId] || "").trim();
    if (!text) {
      toast.error("Please enter a message");
      return;
    }

    try {
      setSending((prev) => ({ ...prev, [listingId]: true }));

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId, recipient_id: recipientId, message: text }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Failed to send reply");
      }

      toast.success("Reply sent");
      setReplyText((prev) => ({ ...prev, [listingId]: "" }));
      await fetchMessages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send reply");
    } finally {
      setSending((prev) => ({ ...prev, [listingId]: false }));
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

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-[#59605D] text-center py-8">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <section className={cardClass}><div className="py-8 text-center text-[#59605D]">No conversations yet.</div></section>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => {
              const recipientForSeller =
                role === "seller"
                  ? conversation.messages.find((item) => item.sender_id !== session?.user?.id)
                  : null;

              return (
                <section key={conversation.listingId} className={cardClass}>
                  <div className="p-4 border-b border-[#E8E3D9]"><h2 className="font-semibold text-lg">{conversation.listingTitle}</h2></div>
                  <div className="p-4 space-y-3">
                    {conversation.messages.map((item) => {
                      const mine = item.sender_id === session?.user?.id;
                      return (
                        <div key={item.id} className={`rounded-lg p-3 ${mine ? "bg-[#E5F0EA]" : "bg-white border border-[#E8E3D9]"}`}>
                          <p className="text-sm text-[#1C211F]">{item.message}</p>
                          <p className="text-xs text-[#59605D] mt-1">
                            {item.sender_name} ({item.sender_email}) • {formatTime(item.created_at)}
                          </p>
                        </div>
                      );
                    })}

                    {role === "seller" && recipientForSeller && (
                      <div className="pt-2 border-t border-[#E8E3D9] space-y-2">
                        <textarea
                          rows={3}
                          className={inputClass}
                          placeholder="Reply to buyer"
                          value={replyText[conversation.listingId] || ""}
                          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                            setReplyText((prev) => ({ ...prev, [conversation.listingId]: event.target.value }))
                          }
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            className={primaryButton}
                            disabled={sending[conversation.listingId]}
                            onClick={() => sendSellerReply(conversation.listingId, recipientForSeller.sender_id)}
                          >
                            {sending[conversation.listingId] ? "Sending..." : "Send Reply"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
