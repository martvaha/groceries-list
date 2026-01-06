import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private _counter = 0;
  private _loading = new BehaviorSubject(false);
  public isLoading = this._loading.asObservable().pipe(distinctUntilChanged(), delay(0));

  start() {
    this._counter = this._counter <= 0 ? 1 : this._counter + 1;
    this._loading.next(this._counter > 0);
  }

  end() {
    this._counter = this._counter < 0 ? 0 : this._counter - 1;
    this._loading.next(this._counter > 0);
  }
}
