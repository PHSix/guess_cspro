import { serve } from "@hono/node-server";
import { app } from "./routes/index.js";

const port = Number(process.env.PORT) || 3001;

console.log(`Multiplayer service starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});
