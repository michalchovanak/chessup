"use client";
import { useEffect, useState } from "react";
import { MEMES, MEME_CAPTIONS } from "@/lib/memes";

const INTERVAL_MS = 7000;

function pick<T>(arr: T[], avoid: number): number {
  if (arr.length < 2) return 0;
  let i = Math.floor(Math.random() * arr.length);
  while (i === avoid) i = Math.floor(Math.random() * arr.length);
  return i;
}

/** Rotating "chess player thinking" memes shown while the human waits for the coach's move. */
export function WaitingMeme({ label }: { label: string }) {
  const [img, setImg] = useState(() => Math.floor(Math.random() * MEMES.length));
  const [cap, setCap] = useState(() => Math.floor(Math.random() * MEME_CAPTIONS.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setImg((i) => pick(MEMES, i));
        setCap((c) => pick(MEME_CAPTIONS, c));
        setVisible(true);
      }, 350);
    }, INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  const m = MEMES[img];
  const c = MEME_CAPTIONS[cap];

  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-emerald-100/90">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        {label}
      </div>
      <div className="relative aspect-[16/9] bg-black/40" style={{ opacity: visible ? 1 : 0, transition: "opacity 350ms ease" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.src} alt={m.alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div className="meme-text absolute inset-x-2 top-2 text-center">{c.top}</div>
        <div className="meme-text absolute inset-x-2 bottom-2 text-center">{c.bottom}</div>
      </div>
      <div className="px-3 py-1.5 text-[10px] text-slate-500 truncate">
        <a href={m.source} target="_blank" rel="noreferrer" className="hover:text-slate-300">
          {m.credit} · {m.license}
        </a>
      </div>
    </div>
  );
}
