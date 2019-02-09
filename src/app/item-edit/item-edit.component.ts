import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { map, filter, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { ListItem } from '../shared/models';

@Component({
  selector: 'gl-item-edit',
  templateUrl: './item-edit.component.html',
  styleUrls: ['./item-edit.component.scss']
})
export class ItemEditComponent implements OnInit {
  ids: Observable<{ listId: string; itemId: string }>;
  item: Observable<ListItem | undefined>;
  constructor(private route: ActivatedRoute, private db: AngularFirestore) {}

  ngOnInit() {
    this.ids = this.route.paramMap.pipe(
      filter(params => params.get('listId') !== null && params.get('itemId') !== null),
      map((params: ParamMap) => ({ listId: params.get('listId') as string, itemId: params.get('itemId') as string }))
    );

    this.item = this.ids.pipe(
      switchMap(({ listId, itemId }) => this.db.doc<ListItem>(`/lists/${listId}/items/${itemId}`).valueChanges())
    );
  }
}
