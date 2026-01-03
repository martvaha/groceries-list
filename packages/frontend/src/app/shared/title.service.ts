import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TitleService {
  defaultTitle = environment.appName;
  private titleSubject = new BehaviorSubject(this.defaultTitle);
  title$ = this.titleSubject.asObservable();

  setTitle(title: string) {
    this.titleSubject.next(title);
  }

  clearTitle() {
    this.titleSubject.next(this.defaultTitle);
  }
}
