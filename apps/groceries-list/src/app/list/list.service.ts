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
    return this.markItem(listId, item, false);
  }

  markItemTodo(listId: string, item: Item) {
    return this.markItem(listId, item, true);
  }

  private markItem(listId: string, item: Item, active: boolean) {
    const path = 'lists/' + listId + '/items/' + item.id;
    const modified = firebase.firestore.FieldValue.serverTimestamp();
    return this.db.doc(path).update({ active, modified, description: item.description });
  }
}
