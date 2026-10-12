import { afterEach, describe, expect, it, vi } from "vitest";

const getTools = vi.fn().mockResolvedValue({
  handwrytten_send_card: {},
});

vi.mock("@mastra/mcp", () => ({
  MCPClient: class {
    getTools = getTools;
  },
}));

describe("Handwrytten MCP", () => {
  afterEach(() => {
    delete process.env.HANDWRYTTEN_API_KEY;
    vi.resetModules();
  });

  it("registers Handwrytten tools with the Mastra agent", async () => {
    process.env.HANDWRYTTEN_API_KEY = "test-api-key";

    const { testAgent } = await import("../src/mastra/endpoint.js");
    const tools = await testAgent.getTools();

    expect(getTools).toHaveBeenCalledOnce();
    expect(tools).toHaveProperty("handwrytten_send_card");
  });
});
