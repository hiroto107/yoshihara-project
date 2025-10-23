import { Mastra } from "@mastra/core/mastra";

import { reisenAgent } from "./agents/reisen-agent";
import { sannoAgent } from "./agents/sanno-agent";
import { conversationRoute } from "./routes/conversation-route";

export const mastra = new Mastra({
  agents: {
    reisenAgent,
    sannoAgent,
  },
  server: {
    apiRoutes: [conversationRoute],
  },
});
