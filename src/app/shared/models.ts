export interface Item {
  id?: string;
  name: string;
  active: boolean;
  categoryId: string;
  displayName?: string;
}

export interface Category {
  id?: string;
  name: string;
  order: number;
}
