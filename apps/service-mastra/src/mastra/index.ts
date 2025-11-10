import { ArizeExporter } from "@mastra/arize";
import { Mastra } from "@mastra/core";
import {
  SamplingStrategyType,
  SensitiveDataFilter,
} from "@mastra/core/ai-tracing";
import { httpInstrumentationMiddleware } from "@hono/otel";
import { mastraEndpoint } from "./endpoint.js";

const PROJECT_NAME = process.env.ARIZE_PROJECT_NAME || "tracing-exp";

export const mastra: Mastra = new Mastra({
  observability: {
    default: { enabled: false },
    configs: {
      production: {
        serviceName: PROJECT_NAME,
        sampling: { type: SamplingStrategyType.ALWAYS },
        processors: [new SensitiveDataFilter()],
        exporters: [
          new ArizeExporter({
            projectName: PROJECT_NAME,
            spaceId: process.env.ARIZE_SPACE_ID,
            apiKey: process.env.ARIZE_API_KEY,
          }),
        ],
      },
    },
  },
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
    // Externalize native binary dependencies
    externals: [],
    // Enable source maps for debugging
    sourcemap: process.env.NODE_ENV !== "production",
  },
});
