import { Component, OnInit } from '@angular/core';
import { switchMap, map, take } from 'rxjs/operators';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable } from 'rxjs';
import { AngularFirestore } from 'angularfire2/firestore';
import { DialogService } from '../shared/dialog-service/dialog.service';

export interface Item {
  id: string;
  name: string;
  displayName: string;
}

@Component({
  selector: 'gl-list-edit',
  template: `
    <mat-list dense>
      <mat-list-item *ngFor="let item of (items | async)">
        {{ item.name }} <button mat-icon-button (click)="deleteList(item)"><mat-icon>delete</mat-icon></button>
      </mat-list-item>
    </mat-list>
  `
})
export class ListEditComponent implements OnInit {
  private listId: Observable<string>;
  public items: Observable<Item[]>;
  constructor(private route: ActivatedRoute, private db: AngularFirestore, private dialogService: DialogService) {}

  ngOnInit() {
    this.listId = this.route.paramMap.pipe(map((params: ParamMap) => params.get('id') as string));
    this.items = this.listId.pipe(
      switchMap(listId => {
        const path = 'lists/' + listId + '/items';
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

  deleteList(item: Item) {
    const dialogRef = this.dialogService.confirm({
      data: {
        title: 'Kustutamine',
        message: `Kas oled kindel, et soovid "${item.name}" kusutatad?`
      }
    });
    dialogRef.afterClosed().subscribe(resp => {
      if (!resp) return;
      this.listId.pipe(take(1)).subscribe(listId => {
        this.db.doc('lists/' + listId + '/items/' + item.id).delete();
      });
    });
  }
}
