import { ArizeExporter } from "@mastra/arize";
import { Mastra } from "@mastra/core";
import {
  Observability,
  SamplingStrategyType,
  SensitiveDataFilter,
} from "@mastra/observability";
import { httpInstrumentationMiddleware } from "@hono/otel";
import { mastraEndpoint, testAgent } from "./endpoint.js";

const PROJECT_NAME = process.env.ARIZE_PROJECT_NAME || "tracing-exp";

export const mastra: Mastra = new Mastra({
  observability: new Observability({
    configs: {
      default: {
        serviceName: PROJECT_NAME,
        sampling: { type: SamplingStrategyType.ALWAYS },
        spanOutputProcessors: [new SensitiveDataFilter()],
        exporters: [
          new ArizeExporter({
            projectName: PROJECT_NAME,
            spaceId: process.env.ARIZE_SPACE_ID,
            apiKey: process.env.ARIZE_API_KEY,
          }),
        ],
      },
    },
  }),
  agents: { "test-agent": testAgent },
  server: {
    port: 4111,
    apiRoutes: [mastraEndpoint],
    build: {
      openAPIDocs: true,
      swaggerUI: true,
    },
    middleware: { path: "*", handler: httpInstrumentationMiddleware() },
  },
  bundler: {
    externals: [],
    sourcemap: process.env.NODE_ENV !== "production",
  },
});
