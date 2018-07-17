import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../auth/auth.service';
import { AngularFirestore } from 'angularfire2/firestore';
import { switchMap, map, mergeMap, concatMap, filter, tap, take } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { DialogService } from '../shared/dialog-service/dialog.service';
import { LoadingService } from '../shared/loading-service';

export interface UserDocument {
  lists: string[];
}

@Component({
  selector: 'gl-lists-container',
  templateUrl: './lists-container.component.html',
  styleUrls: ['./lists-container.component.scss']
})
export class ListsContainerComponent implements OnInit {
  public lists: Observable<any[]>;
  constructor(
    private db: AngularFirestore,
    private auth: AuthService,
    private dialogService: DialogService,
    private loading: LoadingService
  ) {}

  ngOnInit() {
    this.lists = this.auth.user.pipe(
      filter(user => !!user),
      tap(() => this.loading.start()),
      switchMap((user: User) =>
        this.db
          .collection('lists', ref => ref.where('acl.' + user.uid, '==', true))
          .snapshotChanges()
          .pipe(
            map(changes =>
              changes
                .map(change => {
                  const data = change.payload.doc.data();
                  const id = change.payload.doc.id;
                  return { id, ...data };
                })
                .sort((a: any, b: any) => a.name.localeCompare(b.name))
            )
          )
      ),
      tap(() => this.loading.end()),
      tap(console.log)
    );
  }

  addList() {
    this.auth.user.pipe(take(1)).subscribe(user => {
      if (user) {
        const dialog = this.dialogService.input({
          data: { placeholder: 'Nimekirja pealkiri', title: 'Nimekirja lisamine' }
        });
        dialog.afterClosed().subscribe(name => {
          this.db.collection('lists').add({ name, acl: { [user.uid]: true } });
        });
      }
    });
  }

  deleteList(listId) {
    this.db.doc('lists/' + listId).delete();
  }
}
