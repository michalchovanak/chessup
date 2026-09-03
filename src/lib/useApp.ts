"use client";
import { useSyncExternalStore } from "react";
import { store } from "./store";

export function useApp() {
  return useSyncExternalStore(store.subscribe, store.getState, store.getServerState);
}
