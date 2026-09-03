"use client";
import { runTool, tools, toolGroup, type ToolGroup } from "./tools";
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

function toDefinition(t: (typeof tools)[number]) {
  return {
    name: t.name,
    title: t.title,
    description: t.description,
    inputSchema: t.inputSchema,
    annotations: t.annotations,
    execute: async (input: Record<string, unknown>, options?: { signal?: AbortSignal }) =>
      toToolResult(await runTool(t.name, input ?? {}, "agent", options?.signal)),
  };
}

/** Which tool groups should exist for the current app state. */
export function desiredGroups(): Set<ToolGroup> {
  const st = store.getState();
  const groups = new Set<ToolGroup>(["core"]);
  const drillActive = st.drill?.status === "active";
  if (!drillActive) groups.add("board");
  if (!drillActive && st.settings.opponent === "agent") groups.add("sparring");
  return groups;
}

export interface RegisterResult {
  available: boolean;
  registered: number;
  errors: string[];
}

/**
 * Registers the tools and keeps the registered set in sync with the app state:
 * each group has its own AbortController, so a group is unregistered by aborting it
 * and re-registered when it becomes relevant again.
 */
export async function registerWebMcpTools(signal: AbortSignal): Promise<RegisterResult> {
  const mc = getModelContext();
  if (!mc) return { available: false, registered: 0, errors: [] };
  const errors: string[] = [];

  // Hosts without registerTool: one static registration of everything.
  if (typeof mc.registerTool !== "function") {
    if (typeof mc.provideContext === "function") {
      try {
        mc.provideContext({ tools: tools.map(toDefinition) });
        store.setAgentConnected(true);
        store.setRegisteredTools(tools.map((t) => t.name));
        return { available: true, registered: tools.length, errors };
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }
    return { available: true, registered: 0, errors };
  }

  const controllers = new Map<ToolGroup, AbortController>();
  let syncing = Promise.resolve();

  const registerGroup = async (g: ToolGroup) => {
    const ac = new AbortController();
    controllers.set(g, ac);
    // Abort with the page-level signal too.
    signal.addEventListener("abort", () => ac.abort(), { once: true });
    for (const t of tools) {
      if (toolGroup(t.name) !== g) continue;
      try {
        await mc.registerTool(toDefinition(t), { signal: ac.signal });
      } catch (e) {
        errors.push(`${t.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  };

  const unregisterGroup = (g: ToolGroup) => {
    const ac = controllers.get(g);
    if (!ac) return;
    ac.abort();
    controllers.delete(g);
    // Fallback for hosts that ignore the signal but expose unregisterTool.
    if (typeof mc.unregisterTool === "function") {
      for (const t of tools) if (toolGroup(t.name) === g) {
        try {
          mc.unregisterTool(t.name);
        } catch {
          /* ignore */
        }
      }
    }
  };

  const publish = () => {
    const names = tools.filter((t) => controllers.has(toolGroup(t.name))).map((t) => t.name);
    store.setRegisteredTools(names);
  };

  const sync = () => {
    syncing = syncing.then(async () => {
      if (signal.aborted) return;
      const want = desiredGroups();
      for (const g of [...controllers.keys()]) if (!want.has(g)) unregisterGroup(g);
      for (const g of want) if (!controllers.has(g)) await registerGroup(g);
      publish();
    });
    return syncing;
  };

  await sync();
  const unsubscribe = store.subscribe(() => {
    const want = desiredGroups();
    const have = new Set(controllers.keys());
    if (want.size !== have.size || [...want].some((g) => !have.has(g))) void sync();
  });
  signal.addEventListener("abort", unsubscribe, { once: true });

  const registered = store.getState().registeredTools.length;
  store.setAgentConnected(registered > 0);
  return { available: true, registered, errors };
}
