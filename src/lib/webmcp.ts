"use client";
import { runTool, tools } from "./tools";
import { store } from "./store";

type ModelContextLike = {
  registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => Promise<void> | void;
  unregisterTool?: (name: string) => void;
  provideContext?: (ctx: { tools: Record<string, unknown>[] }) => void;
};

/**
 * WebMCP is exposed as `navigator.modelContext` in Chrome's early preview
 * and as `document.modelContext` in the current explainer. Support both.
 */
export function getModelContext(): ModelContextLike | undefined {
  if (typeof window === "undefined") return undefined;
  const d = document as unknown as { modelContext?: ModelContextLike };
  const n = navigator as unknown as { modelContext?: ModelContextLike };
  return d.modelContext ?? n.modelContext;
}

function toToolResult(output: unknown) {
  const text = typeof output === "string" ? output : JSON.stringify(output, null, 0);
  return { content: [{ type: "text", text }], structuredContent: output };
}

export interface RegisterResult {
  available: boolean;
  registered: number;
  errors: string[];
}

export async function registerWebMcpTools(signal: AbortSignal): Promise<RegisterResult> {
  const mc = getModelContext();
  if (!mc) return { available: false, registered: 0, errors: [] };
  const errors: string[] = [];
  let registered = 0;

  const defs = tools.map((t) => ({
    name: t.name,
    title: t.title,
    description: t.description,
    inputSchema: t.inputSchema,
    annotations: t.annotations,
    execute: async (input: Record<string, unknown>, options?: { signal?: AbortSignal }) =>
      toToolResult(await runTool(t.name, input ?? {}, "agent", options?.signal)),
  }));

  if (typeof mc.registerTool === "function") {
    for (const def of defs) {
      try {
        await mc.registerTool(def, { signal });
        registered += 1;
      } catch (e) {
        errors.push(`${def.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } else if (typeof mc.provideContext === "function") {
    try {
      mc.provideContext({ tools: defs });
      registered = defs.length;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  store.setAgentConnected(registered > 0);
  return { available: true, registered, errors };
}
