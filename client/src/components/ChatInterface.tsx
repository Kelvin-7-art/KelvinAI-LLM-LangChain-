import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, User, Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userContent = inputValue.trim();
    setInputValue("");
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: userContent,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userContent }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      
      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.reply,
        createdAt: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative" data-testid="chat-interface">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 space-y-6 md:space-y-8">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto p-8 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary/20 to-accent/20 flex items-center justify-center mb-6 shadow-xl shadow-primary/10">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-3 tracking-tight" data-testid="text-welcome-title">How can I help you today?</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              I'm a simple chatbot. Try saying hello, asking for a joke, or asking what time it is!
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10 w-full">
              {["Hello!", "Tell me a joke", "What time is it?", "Help"].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInputValue(prompt)}
                  data-testid={`button-suggestion-${prompt.toLowerCase().replace(/[^a-z]/g, '-')}`}
                  className="text-sm p-4 rounded-xl bg-muted/40 hover:bg-muted border border-border/50 hover:border-primary/20 transition-all text-left hover:shadow-md"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn(
                  "flex gap-4 md:gap-6 max-w-4xl mx-auto w-full group",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
                data-testid={`message-${msg.role}-${msg.id}`}
              >
                <div className={cn(
                  "w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border",
                  msg.role === "user" 
                    ? "bg-gradient-to-br from-primary to-accent border-transparent text-primary-foreground" 
                    : "bg-card border-border text-foreground"
                )}>
                  {msg.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5 text-primary" />}
                </div>

                <div className={cn(
                  "flex flex-col gap-1 min-w-0 max-w-[85%] md:max-w-[75%]",
                  msg.role === "user" ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "px-5 py-3.5 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed break-words",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border border-border/60 text-card-foreground rounded-tl-sm"
                  )}>
                    {msg.role === "user" ? (
                      msg.content
                    ) : (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    )}
                  </div>
                  
                  <span className="text-[11px] text-muted-foreground/60 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {format(new Date(msg.createdAt), 'h:mm a')}
                  </span>
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 md:gap-6 max-w-4xl mx-auto w-full"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border bg-card border-border text-foreground">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="px-5 py-3.5 rounded-2xl shadow-sm bg-card border border-border/60 rounded-tl-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>

      <div className="p-4 md:p-6 bg-gradient-to-t from-background via-background to-transparent pt-10">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative bg-card rounded-2xl shadow-xl border border-border/50 flex flex-col gap-2 p-2">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              data-testid="input-message"
              className="min-h-[50px] max-h-[200px] border-none focus-visible:ring-0 shadow-none resize-none px-4 py-3 bg-transparent text-base"
            />
            
            <div className="flex justify-between items-center px-2 pb-1">
              <div className="text-xs text-muted-foreground flex gap-2">
                <span className="bg-muted px-2 py-1 rounded text-[10px] font-medium hidden md:inline-block">Press Enter to send</span>
              </div>
              
              <Button 
                onClick={() => handleSubmit()}
                size="icon"
                disabled={!inputValue.trim() || isLoading}
                data-testid="button-send"
                className="h-10 w-10 rounded-xl transition-all duration-300 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
              >
                <Send className="h-5 w-5 ml-0.5" />
              </Button>
            </div>
          </div>
          <p className="text-center text-[10px] text-muted-foreground mt-3">
            Rule-based chatbot - type 'help' for available commands
          </p>
        </div>
      </div>
    </div>
  );
}
