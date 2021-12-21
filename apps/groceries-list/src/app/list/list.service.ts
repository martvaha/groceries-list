import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import firebase from 'firebase/app';
import { Item } from '../shared/models';

@Injectable({
  providedIn: 'root',
})
export class ListService {
  constructor(private db: AngularFirestore) {}

  addNewItem(listId: string, name: string) {
    return this.db.collection('lists/' + listId + '/items').add({
      name: name.trim(),
      active: true,
      modified: firebase.firestore.FieldValue.serverTimestamp(),
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
    const updateDto: Partial<Item> = {
      active,
      modified: firebase.firestore.FieldValue.serverTimestamp() as any,
      description: item?.description ?? null,
    };
    console.log(updateDto);
    return this.db.doc(path).update(updateDto);
  }
}
