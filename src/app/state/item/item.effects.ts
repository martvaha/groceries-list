import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { switchMap, filter, tap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { State } from '../app.reducer';
import { ItemService } from './item.service';
import { getItems, setGroupId, updateItem, updateItemSuccess, updateItemFail } from './item.actions';
import { Router } from '@angular/router';

@Injectable()
export class ItemEffects {
  constructor(
    private actions$: Actions,
    private store: Store<State>,
    private itemService: ItemService,
    private router: Router
  ) {}

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getItems),
      switchMap(() => {
        return this.itemService.getItems();
      })
    )
  );

  setGroup$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(setGroupId),
        switchMap(({ item, groupId, listId }) => this.itemService.updateItem({ ...item, groupId }, listId))
      ),
    { dispatch: false }
  );

  update$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateItem),
      switchMap(({ item, listId, returnToList }) =>
        this.itemService
          .updateItem(item, listId)
          .then(resp => updateItemSuccess({ item, listId, returnToList }))
          .catch(error => updateItemFail(error))
      )
    )
  );

  returnToList$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(updateItemSuccess),
        filter(({ returnToList }) => returnToList),
        tap(({ listId }) => this.router.navigate(['home', 'list', listId]))
      ),
    { dispatch: false }
  );

  // add$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(ListActions.addList),
  //     concatMap(({ list }) => this.listService.addList(list).then(() => ListActions.addListSuccess()))
  //   )
  // );

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
