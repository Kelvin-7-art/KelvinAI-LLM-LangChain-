import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatInterface } from "@/components/ChatInterface";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Moon, Sun, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";

function Header() {
  const { theme, setTheme } = useTheme();
  
  return (
    <header className="flex items-center justify-between gap-4 px-4 md:px-6 py-3 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
          <MessageCircle className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="text-lg font-bold tracking-tight" data-testid="text-app-title">ChatBot</h1>
      </div>
      
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        data-testid="button-theme-toggle"
      >
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>
    </header>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="chatbot-theme">
        <TooltipProvider>
          <div className="h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-1 overflow-hidden">
              <ChatInterface />
            </main>
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
