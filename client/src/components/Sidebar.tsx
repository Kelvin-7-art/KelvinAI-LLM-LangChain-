import { Link, useLocation } from "wouter";
import { useConversations, useCreateConversation, useDeleteConversation } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2, X, Menu, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

export function Sidebar({ className }: { className?: string }) {
  const [location] = useLocation();
  const { data: conversations, isLoading } = useConversations();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredConversations = conversations?.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNew = async () => {
    const newConv = await createConversation.mutateAsync();
    // Use window.location as wouter's setLocation might be outside context here if nested wrong, 
    // but typically useLocation is fine. Let's assume standard behavior.
    // We need to navigate to the new conversation.
    if (newConv) {
      // Direct navigation hack if needed, or better:
      window.location.href = `/chat/${newConv.id}`;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-xl border-r border-border/40">
      {/* Header */}
      <div className="p-4 border-b border-border/40">
        <Button 
          onClick={handleCreateNew} 
          disabled={createConversation.isPending}
          className="w-full justify-start gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 transition-all duration-300 h-12 rounded-xl text-base font-medium"
        >
          {createConversation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-muted/50 border border-transparent focus:bg-background focus:border-primary/20 focus:ring-2 focus:ring-primary/10 transition-all text-sm outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-3 px-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredConversations?.length === 0 ? (
          <div className="text-center py-10 px-4 text-muted-foreground text-sm">
            <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-20" />
            <p>No conversations found</p>
          </div>
        ) : (
          filteredConversations?.map((conv) => (
            <div
              key={conv.id}
              className="group relative flex items-center"
            >
              <Link
                href={`/chat/${conv.id}`}
                className={cn(
                  "flex-1 flex flex-col gap-0.5 px-4 py-3 rounded-lg text-sm transition-all duration-200 border border-transparent",
                  location === `/chat/${conv.id}`
                    ? "bg-primary/10 text-primary border-primary/10 shadow-sm"
                    : "text-foreground/80 hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <span className="font-medium truncate pr-6 block">{conv.title}</span>
                <span className="text-[10px] text-muted-foreground/70 font-normal">
                  {formatDistanceToNow(new Date(conv.createdAt), { addSuffix: true })}
                </span>
              </Link>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  deleteConversation.mutate(conv.id);
                }}
                className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/40 bg-muted/10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/10">
            <span className="font-bold text-xs text-primary">AI</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Guest User</p>
            <p className="text-xs text-muted-foreground truncate">Pro Plan</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden absolute left-4 top-4 z-50">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-80 border-r border-border/40">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className={cn("hidden md:block w-80 h-screen", className)}>
        <SidebarContent />
      </div>
    </>
  );
}
