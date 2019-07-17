export interface Item {
  id: string;
  name: string;
  active: boolean;
  groupId: string;
  displayName?: string;
  modified: Date;
}

export interface Group {
  id: string;
  name: string;
  modified: Date;
  nextId: string | null;
  active: boolean;
}

export interface List {
  modified: Date;
  id: string;
  name: string;
  acl: { [id: string]: boolean };
}
