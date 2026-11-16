/**
 * Ready-made chat UI over the `ai` platform service. Drop it into a view:
 *
 *   <ChatPanel title="Ask the assistant" placeholder="Type a question…" />
 *
 * History is per signed-in user and per `conversationId`; streaming replies
 * come from this app's own `/api/chat` route. Nothing to configure here — the
 * assistant's system prompt and model tier are platform config.
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, ImagePlus, Send, Trash2 } from "lucide-react";
import { chatHistory, clearChatHistory, fileToDataUrl, streamChat, type ChatMessage } from "../lib/orvis";
import { Button, Card, EmptyState, inputCls } from "./ui";

interface Props {
  title?: string;
  placeholder?: string;
  conversationId?: string;
  emptyHint?: string;
}

export function ChatPanel({
  title = "Assistant",
  placeholder = "Ask anything…",
  conversationId = "default",
  emptyHint = "Ask a question to get started.",
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Attached pictures for the NEXT message only — the assistant can see them.
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    chatHistory(conversationId)
      .then((h) => alive && setMessages(h))
      .catch(() => alive && setMessages([]));
    return () => {
      alive = false;
    };
  }, [conversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if ((!text && images.length === 0) || busy) return;
    const attached = images;
    setDraft("");
    setImages([]);
    setError(null);
    setBusy(true);
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: attached.length ? `${text}\n[${attached.length} image(s) attached]`.trim() : text,
    };
    const replyId = `a-${Date.now()}`;
    setMessages((m) => [...m, userMsg, { id: replyId, role: "assistant", content: "" }]);
    try {
      const { id } = await streamChat(
        { message: text, conversation_id: conversationId, images: attached.map((i) => i.url) },
        (delta) =>
          setMessages((m) => m.map((x) => (x.id === replyId ? { ...x, content: x.content + delta } : x))),
      );
      if (id) setMessages((m) => m.map((x) => (x.id === replyId ? { ...x, id } : x)));
    } catch (err) {
      setError((err as Error).message);
      setMessages((m) => m.filter((x) => x.id !== replyId || x.content));
    } finally {
      setBusy(false);
    }
  }

  async function pickImages(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    try {
      const picked = await Promise.all(
        Array.from(files).slice(0, 4).map(async (f) => ({ name: f.name, url: await fileToDataUrl(f) })),
      );
      setImages((cur) => [...cur, ...picked].slice(0, 4));
    } catch (err) {
      setError((err as Error).message);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function clear() {
    await clearChatHistory(conversationId);
    setMessages([]);
  }

  return (
    <Card className="flex flex-col h-[70vh] min-h-[420px]" data-chat-panel>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Bot size={18} /> {title}
        </h2>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => void clear()}
            className="text-sm text-(--color-muted) hover:text-(--color-danger) flex items-center gap-1"
          >
            <Trash2 size={14} /> Clear
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && <EmptyState icon={<Bot size={22} />} title="No messages yet" subtitle={emptyHint} />}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                (m.role === "user"
                  ? "bg-(--color-accent) text-white"
                  : "bg-(--color-canvas) border border-(--color-border) text-(--color-ink)") +
                " max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap"
              }
              data-role={m.role}
            >
              {m.content || (busy && m.role === "assistant" ? "…" : "")}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-(--color-danger) mt-2">
          {error}
        </p>
      )}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {images.map((img, i) => (
            <span key={`${img.name}-${i}`} className="relative">
              <img src={img.url} alt={img.name} className="h-14 w-14 rounded-lg object-cover border border-(--color-border)" />
              <button
                type="button"
                aria-label={`Remove ${img.name}`}
                onClick={() => setImages((cur) => cur.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-(--color-ink) text-white text-xs leading-none cursor-pointer border-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <form onSubmit={submit} className="flex gap-2 mt-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          multiple
          hidden
          onChange={(e) => void pickImages(e.target.files)}
        />
        <button
          type="button"
          data-chat-attach
          title="Attach a picture"
          aria-label="Attach a picture"
          onClick={() => fileRef.current?.click()}
          disabled={busy || images.length >= 4}
          className="shrink-0 rounded-xl border border-(--color-border) px-3 text-(--color-muted) hover:text-(--color-ink) disabled:opacity-50 disabled:cursor-not-allowed bg-transparent cursor-pointer"
        >
          <ImagePlus size={16} />
        </button>
        <input
          name="chat-message"
          className={inputCls}
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={busy}
          autoComplete="off"
        />
        <Button type="submit" disabled={busy || (!draft.trim() && images.length === 0)}>
          <Send size={16} />
        </Button>
      </form>
    </Card>
  );
}
