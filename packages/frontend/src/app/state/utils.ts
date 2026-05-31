import { ITEMS_FULL_RELOAD_TIMEOUT } from '../shared/const';

interface UpdateableObject {
  lastUpdated?: Date | null;
}

/** Constant to avoid creating new Date objects on every selector call */
const NEVER_UPDATED = new Date(0);

/**
 * lastUpdated is used to determine items collection query modified filter.
 * Only items modified after lastUpdated will be queried.
 */
export function lastUpdated({ lastUpdated }: UpdateableObject) {
  if (!lastUpdated) return NEVER_UPDATED;

  // If last updated date is older than 30 days return neverModifiedDate to reload all items
  if (lastUpdated.getTime() <= Date.now() - ITEMS_FULL_RELOAD_TIMEOUT) {
    return NEVER_UPDATED;
  }

  return lastUpdated;
}

export interface ObjectWithName {
  name: string;
  [prop: string]: any;
}

export function sortByName(a: ObjectWithName, b: ObjectWithName): number {
  return a.name.localeCompare(b.name);
}

export class Storage {
  public length = 0;

  clear(): void {
    if (window && window.localStorage) {
      window.localStorage.clear();
      this.length = window.localStorage.length;
    }
  }
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  key(index: number): string | null {
    try {
      return window.localStorage.key(index);
    } catch {
      return null;
    }
  }
  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key);
      this.length = window.localStorage.length;
    } catch {
      return;
    }
  }
  setItem(key: string, data: string): void {
    try {
      window.localStorage.setItem(key, data);
      this.length = window.localStorage.length;
    } catch {
      return;
    }
  }
}
