import { OverlayContainer } from '@angular/cdk/overlay';
import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { State } from '../state/app.reducer';
import { AppTheme, selectTheme } from '../state/config/config.reducer';
import * as configActions from '../state/config/config.actions';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private store = inject<Store<State>>(Store);
  private overlayContainer = inject(OverlayContainer);
  private document = inject<Document>(DOCUMENT);

  private darkClass = 'app-dark';
  private systemThemeSubject = new BehaviorSubject<AppTheme>('light');
  private activeThemeSubject = new BehaviorSubject<AppTheme>('light');

  systemThemeValueChanges() {
    return this.systemThemeSubject.asObservable();
  }

  activeThemeValueChanges() {
    return this.activeThemeSubject.asObservable();
  }

  selectedThemeValueChanges() {
    return this.store.select(selectTheme);
  }

  constructor() {
    this.init();
  }

  setTheme(theme: AppTheme) {
    this.store.dispatch(configActions.setTheme({ theme }));
  }

  private init() {
    // If matchMedia is not defined 'system' theme will always be light
    if (typeof window.matchMedia === 'function') this.initSystemThemeListener();

    combineLatest([this.store.select(selectTheme), this.systemThemeSubject.asObservable()])
      .pipe(
        delay(0),
        map(([theme, systemTheme]) => (theme === 'system' ? systemTheme : theme))
      )
      .subscribe((theme) => {
        console.log('4388', theme);
        this.activeThemeSubject.next(theme);
        const overlayClassList = this.overlayContainer.getContainerElement().classList;
        const bodyClassList = this.document.body.classList;
        if (theme === 'dark') {
          overlayClassList.add(this.darkClass);
          bodyClassList.add(this.darkClass);
        } else {
          overlayClassList.remove(this.darkClass);
          bodyClassList.remove(this.darkClass);
        }
      });
  }

  private initSystemThemeListener() {
    const matchTransform = (isDark: boolean) => (isDark ? 'dark' : 'light');
    const matcher = window.matchMedia('(prefers-color-scheme: dark)');

    // Change event only fires on changes, get initial value here
    this.systemThemeSubject.next(matchTransform(matcher.matches));

    if (typeof matcher.addEventListener === 'function') {
      matcher.addEventListener('change', (event) => this.systemThemeSubject.next(matchTransform(event.matches)));
    } else if (typeof matcher.addListener === 'function') {
      matcher.addListener((event) => this.systemThemeSubject.next(matchTransform(event.matches)));
    }
  }
}
