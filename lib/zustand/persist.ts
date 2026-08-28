/** Bump when persisted store shape changes and add migration steps below. */
export const PERSIST_VERSION = 5;

/**
 * Default migrate handler — passes through persisted state from older versions.
 * Zustand requires `migrate` whenever `version` is set; without it, unversioned
 * localStorage entries (version 0) log a warning on load.
 */
export function persistMigrate<T>(persistedState: unknown): T {
  return persistedState as T;
}
