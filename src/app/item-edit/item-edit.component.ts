import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { map, filter, switchMap, take } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { Item, Group } from '../shared/models';
import { DialogService } from '../shared/dialog-service/dialog.service';
import * as firebase from 'firebase/app';
import { takeValue, takeAsyncValue } from '../shared/utils';

@Component({
  selector: 'gl-item-edit',
  templateUrl: './item-edit.component.html',
  styleUrls: ['./item-edit.component.scss']
})
export class ItemEditComponent implements OnInit {
  ids: Observable<{ listId: string; itemId: string }>;
  item: Observable<Item | undefined>;
  groups: Observable<Group[]>;

  constructor(private route: ActivatedRoute, private db: AngularFirestore, private dialogService: DialogService) {}

  ngOnInit() {
    this.ids = this.route.paramMap.pipe(
      filter(params => params.get('listId') !== null && params.get('itemId') !== null),
      map((params: ParamMap) => ({ listId: params.get('listId') as string, itemId: params.get('itemId') as string }))
    );

    this.item = this.ids.pipe(
      switchMap(({ listId, itemId }) => this.db.doc<Item>(`/lists/${listId}/items/${itemId}`).valueChanges())
    );

    this.groups = this.ids.pipe(
      switchMap(({ listId }) =>
        this.db
          .collection<Group>(`lists/${listId}/groups`)
          .snapshotChanges()
          .pipe(map(groups => groups.map(group => ({ id: group.payload.doc.id, ...group.payload.doc.data() }))))
      )
    );
  }

  onGroupAdd() {
    // const dialogRef = this.dialogService.input({
    //   data: { actionLabel: 'Lisa', title: 'Grupi lisamine', placeholder: 'Grupi nimi' }
    // });
    // dialogRef.afterClosed().subscribe(async name => {
    //   if (!name) return;
    //   const { listId } = takeValue(this.ids);
    //   const groups = await takeAsyncValue(this.groups);
    //   console.log('current groups', groups);
    //   const lastGroup = groups[groups.length - 1];
    //   const prevGroupId = lastGroup ? lastGroup.id : null;
    //   this.db.collection<Group>(`lists/${listId}/groups`).add({
    //     name,
    //     prevGroupId,
    //     modified: firebase.firestore.FieldValue.serverTimestamp() as any
    //   } as Group);
    // });
  }

  onItemUpdated(item: Item) {
    console.log(item);
    this.ids.pipe(take(1)).subscribe(({ listId, itemId }) => {
      this.db.doc(`/lists/${listId}/items/${itemId}`).update(item);
    });
  }
}
