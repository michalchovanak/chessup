"use client";
import { useEffect } from "react";
import { store } from "@/lib/store";
import { registerWebMcpTools, getModelContext } from "@/lib/webmcp";

/** Hydrates persisted state and registers the WebMCP tools once the API is present. */
export function WebMcpBridge() {
  useEffect(() => {
    store.hydrate();
    const controller = new AbortController();
    let done = false;
    const delays = [0, 400, 1200, 3000, 6000];
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const d of delays) {
      timers.push(
        setTimeout(async () => {
          if (done || !getModelContext()) return;
          done = true;
          const r = await registerWebMcpTools(controller.signal);
          if (r.errors.length) console.warn("[webmcp] registration issues", r.errors);
          else console.info(`[webmcp] registered ${r.registered} tools`);
        }, d)
      );
    }
    return () => {
      timers.forEach(clearTimeout);
      controller.abort();
    };
  }, []);
  return null;
}
