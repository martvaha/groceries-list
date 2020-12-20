import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { COMMA, ENTER, FF_SEMICOLON } from '@angular/cdk/keycodes';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatChipInputEvent } from '@angular/material/chips';
import { FormControl, Validators, ValidationErrors } from '@angular/forms';
import { User } from '../auth/auth.service';

@Component({
  selector: 'app-list-share',
  styleUrls: ['./list-share.component.scss'],
  templateUrl: './list-share.component.html',

})
export class ListShareComponent implements OnInit {
  emailControl = new FormControl(undefined, [
    Validators.required,
    Validators.email,
  ]);
  users: Partial<User>[] = [];
  private listId!: Observable<string>;
  constructor(private route: ActivatedRoute, private db: AngularFirestore) {}

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
    invalid.join(this.separatorChars[0] + ' ');
    this.emailControl.patchValue(invalid);
  }

  validateEmail(value: string) {
    const form = new FormControl(undefined, [
      Validators.email,
      Validators.required,
    ]);

    form.patchValue(value);
    if (form.invalid) return { error: form.errors, value: value };

    return { value, error: (undefined as unknown) as ValidationErrors };
  }

  share(): void {
    if (this.users.length < 1) return;
    this.listId.subscribe((listId) => {
      this.users.forEach((user) => {
        this.db.collection('invites').add({ listId: listId, to: user.email });
      });
    });
  }
}
