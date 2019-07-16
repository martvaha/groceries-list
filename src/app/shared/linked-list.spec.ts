import { LinkedList } from './linked-list';

describe('LinkedList', () => {
  const data = [{ name: 'Test1' }, { name: 'Test2' }, { name: 'Test3' }];
  it('instanciates from array', () => {
    const linkedList = LinkedList.from(data);
    expect(linkedList.first && linkedList.first.data).toBe(data[0]);
  });
  it('next method works as intended', () => {
    const linkedList = LinkedList.from(data);
    let nextNode = linkedList.next();
    expect(nextNode.value && nextNode.value.name).toBe('Test1');
    nextNode = linkedList.next();
    expect(nextNode.value && nextNode.value.name).toBe('Test2');
  });
  it('can be used in forof loop', () => {
    const linkedList = LinkedList.from(data);
    const nodes: string[] = [];
    for (const item of linkedList) {
      if (!item) continue;
      nodes.push(item.name);
    }
    expect(nodes).toEqual(['Test1', 'Test2', 'Test3']);
    for (const item of linkedList) {
      if (!item) continue;
      nodes.push(item.name);
    }
    expect(nodes).toEqual(['Test1', 'Test2', 'Test3', 'Test1', 'Test2', 'Test3']);
  });
});
