export function maxModified(items: any[] | undefined | null) {
  return (items || []).reduce((prev, cur) => {
    const curModified = cur.modified || new Date(0);
    return curModified.getTime() > prev.getTime() ? curModified : prev;
  }, new Date(0));
}

export interface ObjectWithName {
  name: string;
  [prop: string]: any;
}

export function sortByName(a: ObjectWithName, b: ObjectWithName): number {
  return a.name.localeCompare(b.name);
}

export const universalStorage: Storage = {
  length: 0,
  clear: function(): void {
    if (window && window.localStorage) {
      window.localStorage.clear();
      this.length = window.localStorage.length;
    }
  },
  getItem: function(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  key: function(index: number): string | null {
    try {
      return window.localStorage.key(index);
    } catch {
      return null;
    }
  },
  removeItem: function(key: string): void {
    try {
      window.localStorage.removeItem(key);
      this.length = window.localStorage.length;
    } catch {
      return;
    }
  },
  setItem: function(key: string, data: string): void {
    try {
      window.localStorage.setItem(key, data);
      this.length = window.localStorage.length;
    } catch {
      return;
    }
  }
};
