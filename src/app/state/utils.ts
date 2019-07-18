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
