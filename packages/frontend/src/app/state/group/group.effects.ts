import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatMap, switchMap } from 'rxjs/operators';
import * as GroupActions from './group.actions';
import { GroupService2 } from './group.service';

export const loadGroups$ = createEffect(
  (actions$ = inject(Actions), groupService = inject(GroupService2)) =>
    actions$.pipe(
      ofType(GroupActions.getGroups),
      switchMap(() => {
        return groupService.getGroups();
      })
    ),
  { functional: true }
);

export const addGroup$ = createEffect(
  (actions$ = inject(Actions), groupService = inject(GroupService2)) =>
    actions$.pipe(
      ofType(GroupActions.addGroup),
      concatMap(({ group, listId }) => groupService.addGroup(group, listId))
    ),
  { functional: true, dispatch: false }
);

export const groupEffects = {
  loadGroups$,
  addGroup$,
};
