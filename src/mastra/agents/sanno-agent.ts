import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";

import { buildPersonaInstructions } from "./instructions";
import { personaRetrievalTool } from "../tools/persona-retrieval-tool";

export const sannoAgent = new Agent({
  name: "sannoAgent",
  instructions: buildPersonaInstructions("sanno"),
  model: openai("gpt-4o-mini"),
  tools: {
    personaRetrievalTool,
  },
  defaultGenerateOptions: {
    toolChoice: "auto",
    temperature: 0.7,
  },
});
