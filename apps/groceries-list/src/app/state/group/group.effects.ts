import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, switchMap } from 'rxjs/operators';
import { State } from '../app.reducer';
import * as GroupActions from './group.actions';
import { GroupService2 } from './group.service';

@Injectable()
export class GroupEffects {
  constructor(private actions$: Actions, private store: Store<State>, private groupService: GroupService2) {}

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GroupActions.getGroups),
      switchMap(() => {
        return this.groupService.getGroups();
      })
    )
  );

  add$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(GroupActions.addGroup),
        concatMap(({ group, listId }) => this.groupService.addGroup(group, listId))
      ),
    { dispatch: false }
  );

  // remove$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(ListActions.removeList),
  //     concatMap(({ list }) =>
  //       this.listService
  //         .removeList(list)
  //         .then(() => ListActions.removeListSuccess({ list }))
  //         .catch(error => ListActions.removeListFail({ error, list }))
  //     )
  //   )
  // );

  // error$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(ListActions.removeListFail),
  //     switchMap(({ error, list }) => {
  //       const dialogRef = this.dialogService.confirm({
  //         data: { title: error.name, message: error.message, confirmLabel: 'Värskenda lehte', confirmColor: 'accent' }
  //       });

  //       return dialogRef.afterClosed().pipe(
  //         map(resp => {
  //           if (resp) {
  //             return ListActions.removeListFailReload({ error, list });
  //           } else {
  //             return ListActions.removeListFailIgnore({ error, list });
  //           }
  //         })
  //       );
  //     })
  //   )
  // );

  // reload$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(ListActions.removeListFailReload, ListActions.reload),
  //     switchMap(() => [ListActions.clearLists(), ListActions.loadLists()])
  //   )
  // );
}
