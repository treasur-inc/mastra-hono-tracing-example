import { registerApiRoute } from "@mastra/core/server";
import { Agent } from "@mastra/core/agent";
import { handwryttenTools } from "./handwrytten-mcp.js";

export const testAgent = new Agent({
  name: "test-agent",
  instructions: "You are a helpful assistant.",
  model: "openai/gpt-4o-mini",
  tools: handwryttenTools,
});

export const mastraEndpoint = registerApiRoute("/service-mastra", {
  method: "GET",
  handler: async (c: any) => {
    const response = await testAgent.generate("Hello, how are you?");
    console.log(response);
    return c.json({ message: "service-mastra response: " + response.text });
  },
});
