import express from "express";
import chatRouter from "./replit_integrations/chat/routes.ts";

const router = express.Router();

router.use("/chat", chatRouter);

export default router;