import { Injectable } from '@angular/core';
import { SharedModule } from './shared.module';
import * as Fuse from 'fuse.js';

@Injectable({
  providedIn: SharedModule
})
export class SearchService {
  private _fuse: Fuse;
  private _options: Fuse.FuseOptions;

  private _data: any[];

  setData(data: any[], options?: Fuse.FuseOptions) {
    console.log('setData', data);
    this._data = data;
    if (options === undefined && this._fuse) {
      (this._fuse as any).setCollection(data);
    } else {
      this._fuse = new Fuse(data, options || this._options || {});
    }
  }

  setOptions(options: Fuse.FuseOptions) {
    this._options = options;
    this._fuse = new Fuse(this._data || [], options);
  }

  search<T>(pattern: string): T[] {
    if (!this._fuse) {
      throw new Error('Search not initialized');
    };
    return this._fuse.search(pattern);
  }
}
