import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,  // client: mounted
    () => false  // server: not mounted
  );
}
