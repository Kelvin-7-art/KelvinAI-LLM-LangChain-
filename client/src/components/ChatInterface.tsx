import { useState, useRef, useEffect } from "react";
import { useSendMessage } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, StopCircle, User, Sparkles, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { AnimatePresence, motion } from "framer-motion";
import { type Message } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ChatInterfaceProps {
  conversationId: number;
  initialMessages: Message[];
}

export function ChatInterface({
  conversationId,
  initialMessages,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const { sendMessage, isStreaming, cancelStream } = useSendMessage();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Sync when switching conversations only, or when not actively streaming
  useEffect(() => {
    if (!isStreaming) {
      setMessages(initialMessages);
    }
  }, [conversationId, initialMessages, isStreaming]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [inputValue]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!inputValue.trim() || isStreaming) return;

    const userContent = inputValue.trim();
    setInputValue("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const tempBase = Date.now();

    const userMessage: Message = {
      id: tempBase,
      conversationId,
      role: "user",
      content: userContent,
      createdAt: new Date(),
    };

    const assistantMessage: Message = {
      id: tempBase + 1,
      conversationId,
      role: "assistant",
      content: "",
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);

    try {
      await sendMessage(conversationId, userContent, (chunk) => {
        setMessages((prev) => {
          const next = [...prev];
          const lastIndex = next.length - 1;

          if (lastIndex >= 0 && next[lastIndex].role === "assistant") {
            next[lastIndex] = {
              ...next[lastIndex],
              content: (next[lastIndex].content || "") + chunk,
            };
          }

          return next;
        });
      });
    } catch (error) {
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessage.id));

      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 space-y-6 md:space-y-8 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto p-8 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary/20 to-accent/20 flex items-center justify-center mb-6 shadow-xl shadow-primary/10">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>

            <h2 className="text-3xl font-display font-bold mb-3 tracking-tight">
              How can I help you today?
            </h2>

            <p className="text-muted-foreground text-lg leading-relaxed">
              I can help you write code, draft emails, analyze data, or just
              brainstorm ideas.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10 w-full">
              {[
                "Explain quantum computing",
                "Write a python script",
                "Design a logo concept",
                "Debug my React code",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInputValue(prompt)}
                  className="text-sm p-4 rounded-xl bg-muted/40 hover:bg-muted border border-border/50 hover:border-primary/20 transition-all text-left hover:shadow-md"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn(
                  "flex gap-4 md:gap-6 max-w-4xl mx-auto w-full group",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border",
                    msg.role === "user"
                      ? "bg-gradient-to-br from-primary to-accent border-transparent text-primary-foreground"
                      : "bg-card border-border text-foreground"
                  )}
                >
                  {msg.role === "user" ? (
                    <User className="h-5 w-5" />
                  ) : (
                    <Sparkles className="h-5 w-5 text-primary" />
                  )}
                </div>

                <div
                  className={cn(
                    "flex flex-col gap-1 min-w-0 max-w-[85%] md:max-w-[75%]",
                    msg.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "px-5 py-3.5 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed break-words",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-card border border-border/60 text-card-foreground rounded-tl-sm prose dark:prose-invert max-w-none"
                    )}
                  >
                    {msg.role === "user" ? (
                      msg.content
                    ) : (
                      <ReactMarkdown
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || "");
                            return match ? (
                              <div className="relative group/code">
                                <div className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                                  <CopyButton text={String(children)} />
                                </div>
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </div>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {msg.content ||
                          (isStreaming && index === messages.length - 1
                            ? "Thinking..."
                            : "")}
                      </ReactMarkdown>
                    )}
                  </div>

                  <span className="text-[11px] text-muted-foreground/60 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {msg.createdAt
                      ? format(new Date(msg.createdAt), "h:mm a")
                      : "Just now"}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        <div ref={bottomRef} className="h-4" />
      </div>

      <div className="p-4 md:p-6 bg-gradient-to-t from-background via-background to-transparent pt-10">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />

          <div className="relative bg-card rounded-2xl shadow-xl border border-border/50 flex flex-col gap-2 p-2">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message..."
              className="min-h-[50px] max-h-[200px] border-none focus-visible:ring-0 shadow-none resize-none px-4 py-3 bg-transparent text-base"
            />

            <div className="flex justify-between items-center px-2 pb-1">
              <div className="text-xs text-muted-foreground flex gap-2">
                <span className="bg-muted px-2 py-1 rounded text-[10px] font-medium hidden md:inline-block">
                  Enter to send
                </span>
              </div>

              <Button
                onClick={isStreaming ? cancelStream : () => handleSubmit()}
                size="icon"
                disabled={!inputValue.trim() && !isStreaming}
                className={cn(
                  "h-10 w-10 rounded-xl transition-all duration-300",
                  isStreaming
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
                )}
              >
                {isStreaming ? (
                  <StopCircle className="h-5 w-5 animate-pulse" />
                ) : (
                  <Send className="h-5 w-5 ml-0.5" />
                )}
              </Button>
            </div>
          </div>

          <p className="text-center text-[10px] text-muted-foreground mt-3">
            AI can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      size="icon"
      variant="secondary"
      className="h-6 w-6 bg-background/80 hover:bg-background shadow-sm"
      onClick={copy}
      type="button"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );
}