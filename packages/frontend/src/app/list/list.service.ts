import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Firestore, collection, addDoc, doc, updateDoc, serverTimestamp } from '@angular/fire/firestore';
import { Item } from '../shared/models';

@Injectable({
  providedIn: 'root',
})
export class ListService {
  private firestore: Firestore = inject(Firestore);
  private injector = inject(EnvironmentInjector);

  constructor() {}

  addNewItem(listId: string, name: string) {
    return runInInjectionContext(this.injector, () => {
      return addDoc(collection(this.firestore, 'lists/' + listId + '/items'), {
        name: name.trim(),
        active: true,
        modified: serverTimestamp(),
      });
    });
  }

  markItemDone(listId: string, item: Item) {
    console.log('5787', listId, item);
    return this.markItem(listId, item, false);
  }

  markItemTodo(listId: string, item: Item) {
    return this.markItem(listId, item, true);
  }

  private markItem(listId: string, item: Item, active: boolean) {
    const path = 'lists/' + listId + '/items/' + item.id;
    return runInInjectionContext(this.injector, () => {
      const itemDoc = doc(this.firestore, path);
      const updateDto: any = {
        active,
        modified: serverTimestamp(),
        description: item?.description ?? null,
      };
      console.log(updateDto);
      return updateDoc(itemDoc, updateDto);
    });
  }
}
