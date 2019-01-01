import { Component, OnInit } from '@angular/core';
import { switchMap, map, take } from 'rxjs/operators';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable } from 'rxjs';
import { AngularFirestore } from 'angularfire2/firestore';

export interface Item {
  id: string;
  name: string;
  displayName: string;
}

@Component({
  selector: 'list-edit',
  template: `
  <mat-list dense>
      <mat-list-item *ngFor="let item of items | async">
          {{item.name}}
          <button mat-icon-button (click)="deleteList(item.id)">
            <mat-icon>delete</mat-icon>
          </button>
      </mat-list-item>
  </mat-list>`
})
export class ListEditComponent implements OnInit {
  private listId: Observable<string>;
  public items: Observable<any[]>;
  constructor(private route: ActivatedRoute, private db: AngularFirestore) {}

  ngOnInit() {
    this.listId = this.route.paramMap.pipe(map((params: ParamMap) => params.get('id') as string));
    this.items = this.listId.pipe(
      switchMap(id => {
        const path = 'lists/' + id + '/items';
        return this.db
          .collection(path)
          .snapshotChanges()
          .pipe(
            map(items =>
              items.map(item => {
                const data = item.payload.doc.data();
                const id = item.payload.doc.id;
                return { id, ...data } as Item;
              })
            ),
            map(items => items.sort((a, b) => a.name.localeCompare(b.name)))
          );
      })
    );
  }

  deleteList(itemId) {
    this.listId.pipe(take(1)).subscribe(listId => {
      this.db.doc('lists/' + listId + '/items/' + itemId).delete();
    });
  }
}
