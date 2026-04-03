import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type Conversation = {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
};

const STORAGE_KEY = "chatai_conversations";

function readConversations(): Conversation[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to read conversations from storage:", error);
    return [];
  }
}

function writeConversations(conversations: Conversation[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

function getConversationById(id: number | null): Conversation | null {
  if (!id) return null;
  const conversations = readConversations();
  return conversations.find((conversation) => conversation.id === id) ?? null;
}

function updateConversation(
  conversationId: number,
  updater: (conversation: Conversation) => Conversation
) {
  const conversations = readConversations();
  const next = conversations.map((conversation) =>
    conversation.id === conversationId ? updater(conversation) : conversation
  );
  writeConversations(next);
}

function makeConversation(title?: string): Conversation {
  const now = new Date().toISOString();

  return {
    id: Date.now(),
    title: title?.trim() || "New Chat",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

function makeMessage(role: "user" | "assistant", content: string): ChatMessage {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

export function useConversations() {
  return useQuery({
    queryKey: ["local-conversations"],
    queryFn: async () => {
      return readConversations().sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    },
  });
}

export function useConversation(id: number | null) {
  return useQuery({
    queryKey: ["local-conversation", id],
    enabled: !!id,
    queryFn: async () => {
      return getConversationById(id);
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (title?: string) => {
      const conversations = readConversations();
      const newConversation = makeConversation(title);

      writeConversations([newConversation, ...conversations]);
      return newConversation;
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ["local-conversations"] });
      queryClient.invalidateQueries({
        queryKey: ["local-conversation", newConversation.id],
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create new chat.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const conversations = readConversations();
      const next = conversations.filter((conversation) => conversation.id !== id);
      writeConversations(next);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["local-conversations"] });

      toast({
        title: "Deleted",
        description: "Conversation deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete conversation.",
        variant: "destructive",
      });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (
      conversationId: number,
      content: string,
      onChunk: (chunk: string) => void
    ) => {
      const trimmedContent = content.trim();

      if (!trimmedContent) {
        throw new Error("Message cannot be empty");
      }

      let assistantText = "";

      setIsStreaming(true);
      abortControllerRef.current = new AbortController();

      try {
        const existingConversation = getConversationById(conversationId);

        if (!existingConversation) {
          throw new Error("Conversation not found");
        }

        const userMessage = makeMessage("user", trimmedContent);

        updateConversation(conversationId, (conversation) => ({
          ...conversation,
          updatedAt: new Date().toISOString(),
          title:
            conversation.title === "New Chat"
              ? trimmedContent.slice(0, 40)
              : conversation.title,
          messages: [...conversation.messages, userMessage],
        }));

        queryClient.invalidateQueries({
          queryKey: ["local-conversation", conversationId],
        });
        queryClient.invalidateQueries({ queryKey: ["local-conversations"] });

        const isNetlify =
          window.location.hostname.includes("netlify.app") ||
          window.location.hostname.includes("netlify.live");

        const endpoint = isNetlify
          ? "/.netlify/functions/chat"
          : "/api/chat";

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmedContent }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          let errorMessage = `Failed to send message: ${response.status}`;

          try {
            const errorData = await response.json();
            if (errorData?.error) {
              errorMessage = errorData.error;
            }
          } catch {
            // ignore parse error
          }

          throw new Error(errorMessage);
        }

        if (isNetlify) {
          const data = await response.json();
          const reply =
            typeof data?.reply === "string" ? data.reply.trim() : "";

          if (!reply) {
            throw new Error("No reply received from chat function");
          }

          assistantText = reply;
          onChunk(reply);
        } else {
          if (!response.body) {
            throw new Error("No response body received from server");
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let streamCompleted = false;

          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const events = buffer.split("\n\n");
            buffer = events.pop() || "";

            for (const event of events) {
              const lines = event.split("\n");

              for (const line of lines) {
                const trimmedLine = line.trim();

                if (!trimmedLine.startsWith("data:")) continue;

                const payload = trimmedLine.slice(5).trim();

                if (!payload) continue;

                if (payload === "[DONE]") {
                  streamCompleted = true;
                  continue;
                }

                try {
                  const data = JSON.parse(payload);

                  if (data.error) {
                    throw new Error(data.error);
                  }

                  if (data.done) {
                    streamCompleted = true;
                    continue;
                  }

                  if (
                    typeof data.content === "string" &&
                    data.content.length > 0
                  ) {
                    assistantText += data.content;
                    onChunk(data.content);
                  }
                } catch (parseError) {
                  console.error("Error parsing stream chunk:", parseError, payload);
                }
              }
            }

            if (streamCompleted) {
              break;
            }
          }

          const finalChunk = buffer.trim();
          if (finalChunk.startsWith("data:")) {
            const payload = finalChunk.slice(5).trim();

            if (payload && payload !== "[DONE]") {
              try {
                const data = JSON.parse(payload);

                if (data.error) {
                  throw new Error(data.error);
                }

                if (
                  typeof data.content === "string" &&
                  data.content.length > 0
                ) {
                  assistantText += data.content;
                  onChunk(data.content);
                }
              } catch (parseError) {
                console.error("Error parsing final stream chunk:", parseError, payload);
              }
            }
          }
        }

        if (assistantText.trim()) {
          const assistantMessage = makeMessage("assistant", assistantText);

          updateConversation(conversationId, (conversation) => ({
            ...conversation,
            updatedAt: new Date().toISOString(),
            messages: [...conversation.messages, assistantMessage],
          }));
        }
      } catch (error: any) {
        if (error?.name === "AbortError") {
          return;
        }

        console.error("Chat error:", error);

        toast({
          title: "Error",
          description: error?.message || "Failed to send message.",
          variant: "destructive",
        });

        throw error;
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;

        queryClient.invalidateQueries({
          queryKey: ["local-conversation", conversationId],
        });
        queryClient.invalidateQueries({ queryKey: ["local-conversations"] });
      }
    },
    [queryClient, toast]
  );

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsStreaming(false);
  }, []);

  return { sendMessage, isStreaming, cancelStream };
}