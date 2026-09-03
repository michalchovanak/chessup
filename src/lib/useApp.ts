"use client";
/** React hook that subscribes a component to the store (see store.ts). */
import { useSyncExternalStore } from "react";
import { store } from "./store";

export function useApp() {
  return useSyncExternalStore(store.subscribe, store.getState, store.getServerState);
}
