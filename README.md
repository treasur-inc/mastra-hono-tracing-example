# Tracing Experiment - Mastra Integration Test

A test project to verify OpenTelemetry trace propagation through Mastra. This demonstrates that traces are currently **NOT** being properly linked when making requests through Mastra.

## Purpose

This project tests whether [Mastra](https://mastra.ai/) properly propagates OpenTelemetry trace context (W3C Trace Context headers) when making HTTP requests. Currently, traces are **not linked** across the service chain, indicating that Mastra needs to be fixed to support distributed tracing.

## Current Issue

When a request flows through the service chain:
```
service-one → service-two → service-mastra (Mastra)
```

The trace context is **lost** at the Mastra boundary, resulting in disconnected traces instead of a unified distributed trace. 

## Architecture

```
service-one (port 3000)
    ↓ HTTP request (trace context propagated ✓)
service-two (port 3001)
    ↓ HTTP request (trace context propagated ✓)
service-mastra (port 4111) - MASTRA
    ❌ Trace context NOT propagated
```

### Services

- **service-one**: Entry point - properly instrumented with OpenTelemetry
- **service-two**: Intermediate service - properly instrumented with OpenTelemetry  
- **service-mastra**: Mastra-based service - **does not propagate trace context**

All services use:
- Hono framework for HTTP handling
- `@hono/otel` middleware for incoming request instrumentation
- Undici/fetch instrumentation for outgoing requests
- W3C Trace Context propagation

## Expected Behavior

With proper trace propagation, all three services should appear as spans within a single distributed trace in Arize, with:
- A root span from service-one
- A child span from service-two
- A grandchild span from service-mastra

## Actual Behavior

Currently, you will see **disconnected traces**:
- service-one and service-two are linked (trace context works here)
- service-mastra appears as a **separate trace** with a new trace ID

This indicates Mastra is not reading the `traceparent` header from incoming requests or not injecting it into outgoing requests.

## Tech Stack

- **Framework**: [Hono](https://hono.dev/)
- **Runtime**: Node.js (>=20)
- **Package Manager**: pnpm 10.20.0
- **Build System**: Turborepo
- **Tracing**: OpenTelemetry + Arize
- **Language**: TypeScript
- **Testing Target**: [Mastra](https://mastra.ai/)

## Prerequisites

- Node.js >= 20
- pnpm 10.20.0 (or use `corepack enable`)
- Arize account (for trace visualization)

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

```env
ARIZE_SPACE_ID=your_space_id
ARIZE_API_KEY=your_api_key
ARIZE_PROJECT_NAME=tracing-exp  # optional
OPENAI_API_KEY=your_openai_key  # required for service-mastra
```

### 3. Build Packages

```bash
pnpm build
```

### 4. Start Development

```bash
pnpm dev
```

This starts all three services:
- service-one: http://localhost:3000
- service-two: http://localhost:3001
- service-mastra: http://localhost:4111

## Reproducing the Issue

### 1. Make a test request

```bash
curl http://localhost:3000/service-one
```

### 2. Check Arize

View the traces in your Arize dashboard. You should see:

**What you'll observe (current broken behavior):**
- One trace containing service-one → service-two (linked correctly)
- A **separate** trace containing just service-mastra (disconnected)

**What should happen (expected behavior):**
- A **single** trace containing all three services as parent-child spans

### 3. Verify trace propagation

Check the console logs for trace IDs. You'll notice:
- service-one and service-two share the same `traceId`
- service-mastra has a **different** `traceId`

This confirms that Mastra is not extracting or propagating the W3C Trace Context.

## Project Structure

```
tracing-exp/
├── apps/
│   ├── service-one/       # Working: properly propagates traces
│   ├── service-two/       # Working: properly propagates traces
│   └── service-mastra/    # BROKEN: does not propagate traces
├── packages/
│   └── instrumentation/   # Shared OpenTelemetry configuration
├── .env.example
├── package.json
└── README.md
```

## Verification Steps

To verify that service-one and service-two are working correctly (they are):

1. Temporarily remove service-mastra from the chain
2. Make a request: `curl http://localhost:3000/service-one`
3. Observe that service-one and service-two appear in the same trace ✓

This confirms the issue is specifically with Mastra's trace propagation.

## OpenTelemetry Configuration

The working services use:

- **HTTP Instrumentation** (`@hono/otel`): Extracts `traceparent` from incoming requests
- **Fetch Instrumentation** (`UndiciInstrumentation`): Injects `traceparent` into outgoing requests
- **W3C Trace Context Propagator**: Standard trace context format
- **Arize Exporter**: Sends traces to visualization platform

All of these are standard OpenTelemetry components that Mastra should also be using.

## Scripts

- `pnpm dev` - Start all services in development mode
- `pnpm build` - Build all packages and services
- `pnpm check-types` - Run TypeScript type checking
- `pnpm clean` - Remove all build artifacts
