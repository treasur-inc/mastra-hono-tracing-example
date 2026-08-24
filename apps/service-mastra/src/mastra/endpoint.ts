import { registerApiRoute } from "@mastra/core/server";
import { Agent } from "@mastra/core/agent";
import { trace } from "@opentelemetry/api";

export const testAgent = new Agent({
  name: "test-agent",
  instructions: "You are a helpful assistant.",
  model: "openai/gpt-4o-mini",
});

export const mastraEndpoint = registerApiRoute("/service-mastra", {
  method: "GET",
  handler: async (c: any) => {
    const spanContext = trace.getActiveSpan()?.spanContext();
    const response = await testAgent.generate("Hello, how are you?", {
      tracingOptions: spanContext
        ? {
            traceId: spanContext.traceId,
            parentSpanId: spanContext.spanId,
          }
        : undefined,
    });
    console.log(response);
    return c.json({ message: "service-mastra response: " + response.text });
  },
});
