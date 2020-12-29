import { Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { AuthService } from '../../auth/auth.service';
import { DialogService } from '../../shared/dialog-service/dialog.service';

@Injectable()
export class UserEffects {
  constructor(private actions$: Actions, private auth: AuthService, private dialogService: DialogService) {}

  /**
   * getUser effect is run after effect init. This is necessary to
   * bootstrap sync between firebase auth and Store.
   */
  // ngrxOnInitEffects(): Action {

  // }
}
