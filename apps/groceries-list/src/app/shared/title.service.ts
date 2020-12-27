import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TitleService {
  defaultTitle = 'Groceries List';
  private titleSubject = new BehaviorSubject(this.defaultTitle);
  title$ = this.titleSubject.asObservable();

  setTitle(title: string) {
    this.titleSubject.next(title);
  }

  clearTitle() {
    this.titleSubject.next(this.defaultTitle);
  }
}
