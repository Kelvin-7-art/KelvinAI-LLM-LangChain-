import type { Express, Request, Response } from "express";

// Rule-based response function - easy to extend to OpenAI or other LLM APIs later
function getRuleBasedResponse(message: string): string {
  const lowerMessage = message.toLowerCase().trim();
  
  // Greetings
  if (lowerMessage.match(/^(hi|hello|hey|howdy|greetings)/)) {
    return "Hello! How can I help you today?";
  }
  
  // How are you
  if (lowerMessage.includes("how are you") || lowerMessage.includes("how's it going")) {
    return "I'm doing great, thank you for asking! How can I assist you?";
  }
  
  // Name questions
  if (lowerMessage.includes("your name") || lowerMessage.includes("who are you")) {
    return "I'm ChatBot, your friendly AI assistant. I'm here to help answer your questions!";
  }
  
  // Time
  if (lowerMessage.includes("what time") || lowerMessage.includes("current time")) {
    return `The current time is ${new Date().toLocaleTimeString()}.`;
  }
  
  // Date
  if (lowerMessage.includes("what date") || lowerMessage.includes("today's date") || lowerMessage.includes("what day")) {
    return `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
  }
  
  // Help
  if (lowerMessage.includes("help") || lowerMessage === "?") {
    return "I can help you with:\n- General greetings\n- Telling you the time and date\n- Answering basic questions\n- Telling jokes\n\nJust type your question and I'll do my best to help!";
  }
  
  // Thank you
  if (lowerMessage.includes("thank") || lowerMessage.includes("thanks")) {
    return "You're welcome! Is there anything else I can help you with?";
  }
  
  // Goodbye
  if (lowerMessage.match(/^(bye|goodbye|see you|later|farewell)/)) {
    return "Goodbye! Have a great day!";
  }
  
  // Weather (placeholder)
  if (lowerMessage.includes("weather")) {
    return "I don't have access to real-time weather data yet, but you can check your local weather service for accurate forecasts!";
  }
  
  // Jokes
  if (lowerMessage.includes("joke") || lowerMessage.includes("funny")) {
    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything!",
      "Why did the scarecrow win an award? He was outstanding in his field!",
      "What do you call a fake noodle? An impasta!",
      "Why don't eggs tell jokes? They'd crack each other up!"
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }
  
  // Fallback response
  return "I'm not sure how to respond to that. Try asking me something else, or type 'help' to see what I can do!";
}

export function registerChatRoutes(app: Express): void {
  // Simple rule-based chat endpoint (POST /api/chat)
  // Accepts { message: string } and returns { reply: string }
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }
      
      const reply = getRuleBasedResponse(message);
      res.json({ reply });
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });
}
