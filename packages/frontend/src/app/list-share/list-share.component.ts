import { Component, OnInit, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { map, take, withLatestFrom } from 'rxjs/operators';
import { COMMA, ENTER, FF_SEMICOLON } from '@angular/cdk/keycodes';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { MatChipInputEvent } from '@angular/material/chips';
import { FormControl, Validators, ValidationErrors } from '@angular/forms';
import { User, AuthService } from '../auth/auth.service';
import { Store } from '@ngrx/store';
import { selectActiveList } from '../state/list/list.reducer';

@Component({
  standalone: false,
  selector: 'app-list-share',
  styleUrls: ['./list-share.component.scss'],
  templateUrl: './list-share.component.html',
})
export class ListShareComponent implements OnInit {
  private route = inject(ActivatedRoute);

  private firestore: Firestore = inject(Firestore);
  private injector = inject(EnvironmentInjector);
  private authService = inject(AuthService);
  private store = inject(Store);

  emailControl = new FormControl<string | undefined>(undefined, {
    nonNullable: false,
    validators: [Validators.required, Validators.email]
  });
  users: Partial<User>[] = [];
  private listId!: Observable<string>;

  readonly separatorKeysCodes = [ENTER, COMMA, FF_SEMICOLON];
  readonly separatorChars = [';', ',', '\n'];
  readonly separatorRegex = new RegExp(this.separatorChars.join('|'), 'g');

  ngOnInit() {
    this.listId = this.route.paramMap.pipe(
      map((params: ParamMap) => params.get('id') as string)
    );
  }

  add(event: MatChipInputEvent) {
    this.addEmails(event.value);
  }

  remove(user: any): void {
    const index = this.users.indexOf(user);

    if (index >= 0) {
      this.users.splice(index, 1);
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    this.emailControl.patchValue(event?.clipboardData?.getData('text'));
  }

  addEmails(emails: string) {
    const invalid = [];
    const values = emails.split(this.separatorRegex);
    for (const value of values) {
      const trimmedValue = value.trim();
      if (!trimmedValue) continue;
      const { error, value: email } = this.validateEmail(trimmedValue);
      if (error) {
        invalid.push(email);
      } else {
        this.users.push({ email });
      }
    }
    this.emailControl.patchValue(invalid.join(this.separatorChars[0] + ' '));
  }

  validateEmail(value: string) {
    const form = new FormControl(undefined, [
      Validators.email,
      Validators.required,
    ]);

    form.patchValue(value as any);
    if (form.invalid) return { error: form.errors, value: value };

    return { value, error: (undefined as unknown) as ValidationErrors };
  }

  share(): void {
    if (this.users.length < 1) return;

    combineLatest([
      this.listId,
      this.authService.getUser(),
      this.store.select(selectActiveList)
    ]).pipe(take(1)).subscribe(([listId, currentUser, activeList]) => {
      runInInjectionContext(this.injector, () => {
        this.users.forEach((user) => {
          addDoc(collection(this.firestore, 'invites'), {
            listId: listId,
            to: user.email,
            listName: activeList?.name || '',
            userName: currentUser?.displayName || currentUser?.email || '',
          });
        });
      });
    });
  }
}
