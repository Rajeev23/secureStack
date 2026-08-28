/** A project monitors exactly one GitHub repository. Extra entries are ignored. */
export function primaryRepositories<T>(repositories: T[] | null | undefined): T[] {
  if (!Array.isArray(repositories) || repositories.length === 0) {
    return [];
  }
  return repositories.slice(0, 1);
}
