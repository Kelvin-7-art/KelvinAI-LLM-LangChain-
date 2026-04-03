import { Sidebar } from "@/components/Sidebar";
import { useConversations } from "@/hooks/use-chat";
import { MessageSquare, Sparkles } from "lucide-react";

export default function Home() {
  const { data: conversations, isLoading } = useConversations();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-primary/20 rotate-3 hover:rotate-6 transition-transform duration-500">
             <Sparkles className="w-12 h-12 text-white" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground">
              Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">KelvinAI</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Your intelligent assistant for coding, writing, and creative problem solving.
              Start a new conversation to begin.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {[
              { icon: "⚡", title: "Fast Responses", desc: "Get answers in seconds with streaming" },
              { icon: "🎨", title: "Creative", desc: "Generate ideas, stories, and designs" },
              { icon: "🛡️", title: "Secure", desc: "Your conversations are private and safe" },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-bold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Mobile-only hint */}
        <div className="md:hidden mt-12 text-muted-foreground flex items-center gap-2 text-sm animate-pulse">
          <MessageSquare className="w-4 h-4" />
          Tap the menu to start chatting
        </div>
      </main>
    </div>
  );
}
