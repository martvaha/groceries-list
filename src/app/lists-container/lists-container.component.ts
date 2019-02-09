import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../auth/auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { switchMap, map, filter, take } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { DialogService } from '../shared/dialog-service/dialog.service';
import { LoadingService } from '../shared/loading-service';

export interface List {
  id: string;
  name: string;
}

@Component({
  selector: 'gl-lists-container',
  templateUrl: './lists-container.component.html',
  styleUrls: ['./lists-container.component.scss']
})
export class ListsContainerComponent implements OnInit {
  public lists$: Observable<List[]>;
  constructor(
    private db: AngularFirestore,
    private auth: AuthService,
    private dialogService: DialogService,
    private loading: LoadingService
  ) {}

  ngOnInit() {
    this.loading.start();
    this.lists$ = this.auth.user.pipe(
      filter(user => !!user),
      switchMap((user: User) =>
        this.db
          .collection<List>('lists', ref => ref.where('acl.' + user.uid, '==', true))
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
      )
    );
    this.lists$.pipe(take(1)).subscribe(() => this.loading.end());
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

  deleteList(list: List) {
    const dialogRef = this.dialogService.confirm({
      data: {
        title: 'Nimekirja kustutamine',
        message: `Kas oled kindel, et soovid nimekirja "${list.name}" kusutatad?`
      }
    });
    dialogRef.afterClosed().subscribe(resp => {
      if (!resp) return;
      this.db.doc('lists/' + list.id).delete();
    });
  }
}
