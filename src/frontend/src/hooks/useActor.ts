import { useActor as useCoreActor } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";

/**
 * Returns the typed backend actor instance.
 * Wraps the core-infrastructure useActor with the app's generated createActor function.
 */
export function useActor() {
  return useCoreActor(createActor);
}
