import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatChipInputEvent } from '@angular/material/chips';

@Component({
  selector: 'gl-list-share',
  styleUrls: ['./list-share.component.scss'],
  templateUrl: './list-share.component.html'
})
export class ListShareComponent implements OnInit {
  private listId: Observable<string>;
  public users: any[] = [];
  constructor(private route: ActivatedRoute, private db: AngularFirestore) {}
  readonly separatorKeysCodes = [ENTER, COMMA];

  ngOnInit() {
    this.listId = this.route.paramMap.pipe(map((params: ParamMap) => params.get('id') as string));
  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our fruit
    if ((value || '').trim()) {
      this.users.push({ email: value.trim() });
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  remove(user: any): void {
    const index = this.users.indexOf(user);

    if (index >= 0) {
      this.users.splice(index, 1);
    }
  }

  share(): void {
    if (this.users.length < 1) return;
    this.listId.subscribe(listId => {
      this.users.forEach(user => {
        this.db.collection('invites').add({ listId: listId, to: user.email });
      });
    });
  }
}
