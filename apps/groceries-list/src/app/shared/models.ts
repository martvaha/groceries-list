export interface List {
  modified: Date;
  id: string;
  name: string;
  acl: string[];
  groupsOrder: string[];
  shared: boolean;
}

export interface Group {
  id: string;
  name: string;
  modified: Date;
}
export interface Item {
  id: string;
  name: string;
  active: boolean;
  groupId: string;
  displayName?: string;
  description?: string;
  modified: Date;
}

export interface GroupWithItems extends Group {
  items: Item[];
  active?: boolean;
}
