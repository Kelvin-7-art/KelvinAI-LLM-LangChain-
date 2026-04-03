import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import routes from "./routes.ts";
import { setupVite } from "./vite.ts";
import { serveStatic } from "./static.ts";

dotenv.config();

const app = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api", routes);

(async () => {
  if (process.env.NODE_ENV === "development") {
    await setupVite(server, app); // ✅ FIXED
  } else {
    serveStatic(app);
  }

  const port = 3000;
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
})();