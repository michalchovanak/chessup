import { COACH_PROTOCOL } from "@/lib/prompts";

/**
 * Visible to humans as documentation, and readable by agents that inspect the
 * page, so a natural request leads to the right tool loop.
 */
export function CoachProtocol() {
  return (
    <section aria-label="Instructions for AI coaches" className="rounded-2xl border border-white/[0.06] bg-white/[0.015] px-4 py-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">For AI coaches reading this page</h2>
      <ol className="mt-2 space-y-1 text-xs text-slate-500 leading-relaxed list-decimal pl-4">
        {COACH_PROTOCOL.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ol>
    </section>
  );
}
