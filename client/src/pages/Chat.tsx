import { Sidebar } from "@/components/Sidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { useParams } from "wouter";
import { useConversation } from "@/hooks/use-chat";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function Chat() {
  const { id } = useParams();
  const conversationId = id ? parseInt(id) : null;
  const { data: conversation, isLoading, error } = useConversation(conversationId);

  // Error handling or redirect could go here
  useEffect(() => {
    if (error) {
       console.error("Failed to load conversation", error);
    }
  }, [error]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col relative w-full h-full">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
             <div className="flex flex-col items-center gap-4">
               <Loader2 className="h-10 w-10 text-primary animate-spin" />
               <p className="text-muted-foreground animate-pulse">Loading conversation...</p>
             </div>
          </div>
        ) : conversation ? (
          <>
            {/* Header - Mobile Only (Desktop header is sidebar title) */}
            <div className="md:hidden h-14 border-b border-border/40 flex items-center justify-center bg-background/80 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
               <span className="font-semibold text-sm truncate max-w-[200px]">{conversation.title}</span>
            </div>
            
            <div className="flex-1 h-full pt-14 md:pt-0">
               <ChatInterface 
                 conversationId={conversation.id} 
                 initialMessages={conversation.messages || []} 
               />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Conversation not found
          </div>
        )}
      </main>
    </div>
  );
}
