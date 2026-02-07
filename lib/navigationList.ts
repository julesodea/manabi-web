interface NavigationList {
  ids: string[];
  basePath: string;
}

const STORAGE_PREFIX = "nav:";

export function saveNavigationList(
  resourceKey: string,
  ids: string[],
  basePath: string
): void {
  if (typeof window === "undefined") return;
  try {
    const data: NavigationList = { ids, basePath };
    sessionStorage.setItem(STORAGE_PREFIX + resourceKey, JSON.stringify(data));
  } catch {
    // sessionStorage quota exceeded or unavailable
  }
}

export function getAdjacentIds(
  resourceKey: string,
  currentId: string
): { prevId: string | null; nextId: string | null; basePath: string | null } {
  if (typeof window === "undefined") {
    return { prevId: null, nextId: null, basePath: null };
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + resourceKey);
    if (!raw) return { prevId: null, nextId: null, basePath: null };

    const data: NavigationList = JSON.parse(raw);
    const index = data.ids.indexOf(currentId);
    if (index === -1) return { prevId: null, nextId: null, basePath: null };

    return {
      prevId: index > 0 ? data.ids[index - 1] : null,
      nextId: index < data.ids.length - 1 ? data.ids[index + 1] : null,
      basePath: data.basePath,
    };
  } catch {
    return { prevId: null, nextId: null, basePath: null };
  }
}
