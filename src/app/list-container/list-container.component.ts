import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { AngularFirestore } from 'angularfire2/firestore';
import { switchMap, map, debounceTime, filter, startWith, delay } from 'rxjs/operators';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material';

@Component({
  selector: 'gl-list-container',
  templateUrl: './list-container.component.html',
  styleUrls: ['./list-container.component.scss']
})
export class ListContainerComponent implements OnInit {
  public listId: Observable<string>;
  public items: Observable<any[]>;
  public activeItems: Observable<any[]>;
  public filteredItems: Observable<any[]>;
  public inputControl: FormControl;
  public inputForm: FormGroup;

  public inputValid: ErrorStateMatcher = {
    isErrorState: (control: FormControl) => {
      return !control.pristine && !control.valid;
    }
  };

  constructor(private route: ActivatedRoute, private db: AngularFirestore) {}

  ngOnInit() {
    this.inputControl = new FormControl('', [Validators.required]);
    this.inputForm = new FormGroup({ inputControl: this.inputControl });
    this.listId = this.route.paramMap.map((params: ParamMap) => params.get('id') as string);
    this.items = this.listId.pipe(
      switchMap(id => {
        const path = 'lists/' + id + '/items';
        return this.db
          .collection(path)
          .snapshotChanges()
          .pipe(
            map(items =>
              items.map(item => {
                const data = item.payload.doc.data();
                const id = item.payload.doc.id;
                return { id, ...data };
              })
            )
          );
      })
    );
    this.activeItems = this.items.pipe(map(items => items.filter(item => item.active)));

    const inputChanges = this.inputControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      map((input: string | { name: string }) => (typeof input === 'string' ? input : input.name))
    );
    const unusedItems = this.items.pipe(map(items => items.filter(item => !item.active)));

    this.filteredItems = combineLatest(inputChanges, unusedItems, this.activeItems).pipe(
      map(([input, items, active]) => {
        return items.filter(item => item.name.toLowerCase().indexOf(input.toLowerCase()) === 0);
      })
    );
  }

  addItem() {
    const { valid, value } = this.inputControl;
    if (valid && value) {
      if (typeof value === 'object' && 'id' in value) {
        this.listId.subscribe(listId => {
          const path = 'lists/' + listId + '/items/' + value.id;
          this.db.doc(path).update({ active: true });
        });
      } else {
        this.listId.subscribe(listId => {
          const path = 'lists/' + listId + '/items';
          this.db.collection(path).add({ name: value, active: true });
        });
      }
      this.inputControl.reset('', { emitEvent: false });
    }
  }
  markDone(item) {
    this.listId.pipe(delay(300)).subscribe(listId => {
      const path = 'lists/' + listId + '/items/' + item.id;
      this.db.doc(path).update({ active: false });
    });
  }

  inputDisplay(item?): string | undefined {
    return item ? item.name : undefined;
  }
}
