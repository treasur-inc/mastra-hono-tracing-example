import { convertGenAISpanAttributesToOpenInferenceSpanAttributes } from "@arizeai/openinference-genai";
import type { Mutable } from "@arizeai/openinference-genai/types";
import type { ExportResult } from "@opentelemetry/core";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import type { ReadableSpan } from "@opentelemetry/sdk-trace-base";
import { SemanticConventions } from "@arizeai/openinference-semantic-conventions";

export const isOpenInferenceSpan = (span: ReadableSpan) => {
  const maybeOpenInferenceSpanKind =
    span.attributes[SemanticConventions.OPENINFERENCE_SPAN_KIND];
  return typeof maybeOpenInferenceSpanKind === "string";
};

class OpenInferenceOTLPTraceExporter extends OTLPTraceExporter {
  export(
    spans: ReadableSpan[],
    resultCallback: (result: ExportResult) => void
  ) {
    const processedSpans = spans.map((span) => {
      if (!isOpenInferenceSpan(span)) {
        return span;
      }

      if (
        span.attributes?.["gen_ai.prompt"] &&
        typeof span.attributes["gen_ai.prompt"] === "string"
      ) {
        span.attributes["gen_ai.input.messages"] =
          convertMastraMessagesToGenAIMessages(
            span.attributes["gen_ai.prompt"]
          );
      }
      if (
        span.attributes?.["gen_ai.completion"] &&
        typeof span.attributes["gen_ai.completion"] === "string"
      ) {
        span.attributes["gen_ai.output.messages"] =
          convertMastraMessagesToGenAIMessages(
            span.attributes["gen_ai.completion"]
          );
      }

      const processedAttributes =
        convertGenAISpanAttributesToOpenInferenceSpanAttributes(
          span.attributes
        );
      if (processedAttributes) {
        (span as Mutable<ReadableSpan>).attributes = processedAttributes;
      }
      return span;
    });

    super.export(processedSpans, resultCallback);
  }
}

export const ARIZE_AX_ENDPOINT = "https://otlp.arize.com/v1/traces";

export type ArizeOpenInferenceOTLPTraceExporterConfig = {
  spaceId?: string;
  apiKey?: string;
  endpoint?: string;
  projectName?: string;
  headers?: Record<string, string>;
};

export class ArizeOpenInferenceOTLPTraceExporter extends OpenInferenceOTLPTraceExporter {
  private exportCount = 0;

  constructor(config: ArizeOpenInferenceOTLPTraceExporterConfig) {
    let endpoint: string | undefined = config.endpoint;
    const headers: Record<string, string> = {
      ...config.headers,
    };
    if (config.spaceId) {
      headers.space_id = config.spaceId;
      headers.api_key = config.apiKey ?? "";
      endpoint = config.endpoint || ARIZE_AX_ENDPOINT;
    } else if (config.apiKey) {
      headers.Authorization = `Bearer ${config.apiKey}`;
    }
    super({
      url: endpoint,
      headers,
    });

    console.log("Arize exporter initialized", {
      endpoint,
      hasSpaceId: !!config.spaceId,
      hasApiKey: !!config.apiKey,
      projectName: config.projectName,
    });
  }

  export(
    spans: ReadableSpan[],
    resultCallback: (result: ExportResult) => void
  ) {
    this.exportCount++;

    const wrappedCallback = (result: ExportResult) => {
      if (result.code !== 0) {
        console.log(`Arize export #${this.exportCount} failed`, {
          code: result.code,
          error: result.error,
          spanCount: spans.length,
        });
      }
      resultCallback(result);
    };

    super.export(spans, wrappedCallback);
  }
}

type GenAIMessagePart =
  | {
      type: "text";
      content: string;
    }
  | {
      type: "tool_call";
      id: string;
      name: string;
      arguments: string;
    }
  | {
      type: "tool_call_response";
      id: string;
      name: string;
      response: string;
    };

type GenAIMessage = {
  role: string;
  parts: GenAIMessagePart[];
};

type MastraMessagePart =
  | {
      type: "text";
      text: string;
    }
  | { type: "tool-call"; toolCallId: string; toolName: string; input: unknown }
  | {
      type: "tool-result";
      toolCallId: string;
      toolName: string;
      output: { value: unknown };
    };

type MastraMessage = {
  role: string;
  content: MastraMessagePart[];
};

const isMastraMessagePart = (p: unknown): p is MastraMessagePart => {
  return (
    typeof p === "object" &&
    p != null &&
    "type" in p &&
    (p.type === "text" || p.type === "tool-call" || p.type === "tool-result") &&
    ((p.type === "text" && "text" in p) ||
      (p.type === "tool-call" &&
        "toolCallId" in p &&
        "toolName" in p &&
        "input" in p) ||
      (p.type === "tool-result" &&
        "toolCallId" in p &&
        "toolName" in p &&
        "output" in p))
  );
};

const isMastraMessage = (m: unknown): m is MastraMessage => {
  return (
    typeof m === "object" &&
    m != null &&
    "role" in m &&
    "content" in m &&
    (typeof m.content === "string" ||
      (Array.isArray(m.content) && m.content.every(isMastraMessagePart)))
  );
};

export const convertMastraMessagesToGenAIMessages = (
  inputOutputString: string
): string => {
  try {
    const parsedIO = JSON.parse(inputOutputString) as unknown;
    if (
      typeof parsedIO !== "object" ||
      parsedIO == null ||
      (!("messages" in parsedIO) && !("text" in parsedIO))
    ) {
      return inputOutputString;
    }
    if ("text" in parsedIO) {
      return JSON.stringify([
        {
          role: "assistant",
          parts: [{ type: "text", content: parsedIO.text as string }],
        } satisfies GenAIMessage,
      ]);
    }
    if (Array.isArray(parsedIO.messages)) {
      return JSON.stringify(
        (parsedIO.messages as unknown[]).map((m) => {
          if (!isMastraMessage(m)) {
            return m;
          }
          const role = m.role;
          let parts: GenAIMessagePart[] = [];
          if (Array.isArray(m.content)) {
            parts = m.content.map((c) => {
              switch (c.type) {
                case "text":
                  return {
                    type: "text",
                    content: c.text,
                  };
                case "tool-call":
                  return {
                    type: "tool_call",
                    id: c.toolCallId,
                    name: c.toolName,
                    arguments: JSON.stringify(c.input),
                  };
                case "tool-result":
                  return {
                    type: "tool_call_response",
                    id: c.toolCallId,
                    name: c.toolName,
                    response: JSON.stringify(c.output.value),
                  };
                default:
                  return c;
              }
            });
          } else {
            parts = [
              {
                type: "text",
                content: m.content,
              },
            ];
          }
          return {
            role,
            parts,
          } satisfies GenAIMessage;
        })
      );
    }
    return inputOutputString;
  } catch {
    return inputOutputString;
  }
};
