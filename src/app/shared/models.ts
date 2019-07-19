export interface List {
  modified: Date | firebase.firestore.FieldValue;
  id: string;
  name: string;
  acl: string[];
  groupsOrder: string[];
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
  modified: Date;
}
