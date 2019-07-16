export interface LinkedNode<T extends Object> {
  data: T;
  next: LinkedNode<T> | null;
}

export class LinkedList<T extends Object> implements IterableIterator<T | null> {
  private _first: LinkedNode<T> | null;
  private _node: LinkedNode<T> | null | undefined;

  constructor() {
    this._first = null;
  }

  get first() {
    return this._first;
  }

  static from<V>(array: V[]): LinkedList<V> {
    const linkedList = new LinkedList<V>();
    if (!(array && array.length)) return linkedList;
    const linkedNodeArray = array.map(node => ({ data: node, next: null } as LinkedNode<V>));
    for (let i = 0; i < linkedNodeArray.length; i++) {
      const node = linkedNodeArray[i];
      if (i === 0) linkedList.setHead(node);
      const nextNode = linkedNodeArray[i + 1];
      if (nextNode) {
        node.next = nextNode;
      }
    }
    return linkedList;
  }

  next(): IteratorResult<T> {
    // tslint:disable-next-line:no-var-keyword
    if (this._node === undefined) {
      this._node = this.first;
    }

    let value: unknown = null;
    let done = true;
    if (this._node !== null) {
      value = this._node.data;
      done = false;
      this._node = this._node.next;
    } else {
      this._node = undefined;
    }
    return { value: value as T, done };
  }

  [Symbol.iterator]() {
    return this;
  }

  removeNode(node: LinkedNode<T>) {
    const updated: Set<LinkedNode<T>> = new Set();
    if (node === this.first) {
      this.setHead(node.next);
      if (node.next) updated.add(node.next);
    } else {
      const prevNode = this.findPrevNode(node);
      if (!prevNode) throw new Error('Previous node cannot be empty');
      prevNode.next = node.next;
      updated.add(prevNode);
    }
    return updated;
  }

  addNode(node: T | LinkedNode<T>, next: LinkedNode<T> | null = null): Set<LinkedNode<T>> {
    if (!(node instanceof Object)) return new Set() as Set<LinkedNode<T>>;
    const linkedNode = (node.hasOwnProperty('next') ? node : { data: node, next: null }) as LinkedNode<T>;
    const updated = new Set([linkedNode]);
    if (next === this.first) {
      this.setHead(linkedNode);
    } else {
      const nextPrevNode = this.findPrevNode(next);
      console.log(nextPrevNode);
      if (!nextPrevNode) throw new Error('Previous node cannot be empty');
      nextPrevNode.next = linkedNode;
      updated.add(nextPrevNode);
    }
    linkedNode.next = next;
    return updated;
  }

  setNodeNext(node: LinkedNode<T>, next: LinkedNode<T>) {
    const removeUpdated = this.removeNode(node);
    const addUpdated = this.addNode(node, next);
    return new Set([...removeUpdated, ...addUpdated]);
  }

  findPrevNode(node: LinkedNode<T> | null) {
    if (this.first === null) return undefined;
    let current = this.first;
    while (current.next) {
      if (current.next === node) return current;
      current = current.next;
    }
    return current;
  }

  find(fn: (node: T) => boolean) {
    if (this.first === null) return undefined;
    let current = this.first;
    while (current.next) {
      if (fn(current.data)) {
        return current;
      }
      current = current.next;
    }
    return undefined;
  }

  getNodeAt(index: number) {
    if (this.first === null) return undefined;
    let current = this.first;
    let i = 0;
    while (i < index) {
      if (!current.next) throw new Error(`Index ${index} out of range`);
      i++;
      current = current.next;
    }
    return current;
  }

  protected setHead(head: LinkedNode<T> | null): LinkedList<T> {
    this._first = head;
    return this;
  }
}
