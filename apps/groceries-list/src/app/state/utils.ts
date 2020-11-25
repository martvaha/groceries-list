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
