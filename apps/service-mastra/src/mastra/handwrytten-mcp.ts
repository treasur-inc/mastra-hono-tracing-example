import { MCPClient } from "@mastra/mcp";

const apiKey = process.env.HANDWRYTTEN_API_KEY;

if (!apiKey) {
  throw new Error("HANDWRYTTEN_API_KEY must be set to use the Handwrytten MCP server.");
}

export const handwryttenMcpClient = new MCPClient({
  servers: {
    handwrytten: {
      url: new URL("https://mcp.handwrytten.com/mcp"),
      requestInit: {
        headers: {
          "X-API-Key": apiKey,
        },
      },
    },
  },
});

export const handwryttenTools = await handwryttenMcpClient.getTools();
