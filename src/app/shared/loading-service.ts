import { Injectable } from '@angular/core';
import { BehaviorSubject } from '../../../node_modules/rxjs/BehaviorSubject';
import { distinctUntilChanged } from '../../../node_modules/rxjs/operators';

@Injectable()
export class LoadingService {
  private _counter = 0;
  private _loading = new BehaviorSubject(false);
  public isLoading = this._loading.pipe(distinctUntilChanged());

  start() {
    this._counter = this._counter <= 0 ? 1 : this._counter + 1;
    this._loading.next(this._counter > 0);
  }

  end() {
    this._counter = this._counter < 0 ? 0 : this._counter - 1;
    this._loading.next(this._counter > 0);
  }
}
