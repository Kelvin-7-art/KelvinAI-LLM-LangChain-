import express from "express";
import type { Request, Response } from "express";
import { streamResponse } from "./index.ts";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  const { message } = req.body as { message?: string };

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    console.log("Received chat message:", message);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    await streamResponse(message, (chunk: string) => {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error("Chat route error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Chat failed",
      });
    }

    res.write(
      `data: ${JSON.stringify({
        error: error instanceof Error ? error.message : "Chat failed",
      })}\n\n`
    );
    res.end();
  }
});

export default router;