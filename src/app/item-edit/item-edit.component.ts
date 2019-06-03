import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { map, filter, switchMap, take } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { Item, Category } from '../shared/models';

@Component({
  selector: 'gl-item-edit',
  templateUrl: './item-edit.component.html',
  styleUrls: ['./item-edit.component.scss']
})
export class ItemEditComponent implements OnInit {
  ids: Observable<{ listId: string; itemId: string }>;
  item: Observable<Item | undefined>;
  categories: Category[] = [
    { id: '1', name: 'Puuviljad', order: 1 },
    { id: '2', name: 'Piimatooted', order: 2 },
    { id: '4', name: 'Liha', order: 3 }
  ];
  constructor(private route: ActivatedRoute, private db: AngularFirestore) {}

  ngOnInit() {
    this.ids = this.route.paramMap.pipe(
      filter(params => params.get('listId') !== null && params.get('itemId') !== null),
      map((params: ParamMap) => ({ listId: params.get('listId') as string, itemId: params.get('itemId') as string }))
    );

    this.item = this.ids.pipe(
      switchMap(({ listId, itemId }) => this.db.doc<Item>(`/lists/${listId}/items/${itemId}`).valueChanges())
    );
  }

  onItemUpdated(item: Item) {
    console.log(item);
    this.ids.pipe(take(1)).subscribe(({ listId, itemId }) => {
      this.db.doc(`/lists/${listId}/items/${itemId}`).update(item);
    });
  }
}
