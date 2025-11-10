import { registerApiRoute } from "@mastra/core/server";

export const mastraEndpoint = registerApiRoute("/service-mastra", {
    method: "GET",
    handler: async (c: any) => {
      return c.json({ message: "service-mastra response" });
    },
  });