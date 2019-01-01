import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { AngularFirestore } from 'angularfire2/firestore';
import { switchMap, map, debounceTime, startWith, delay, tap, combineLatest, take } from 'rxjs/operators';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material';
import { LoadingService } from '../shared/loading-service';
import { SearchService } from '../shared/search.service';
import { highlight } from '../shared/utils';

@Component({
  selector: 'gl-list-container',
  templateUrl: './list-container.component.html',
  styleUrls: ['./list-container.component.scss']
})
export class ListContainerComponent implements OnInit, OnDestroy {
  public listId: Observable<string>;
  public items: Observable<any[]>;
  public activeItems: Observable<any[]>;
  public filteredItems: Observable<any[]>;
  public inputControl: FormControl;
  public inputForm: FormGroup;
  private unselectedSubscription: Subscription;

  public inputValid: ErrorStateMatcher = {
    isErrorState: (control: FormControl) => {
      return !control.pristine && !control.valid;
    }
  };

  constructor(
    private route: ActivatedRoute,
    private db: AngularFirestore,
    private loading: LoadingService,
    private search: SearchService
  ) {}

  ngOnInit() {
    this.loading.start();
    this.search.setOptions({ keys: ['name'], includeMatches: true, threshold: 0.9 });
    this.inputControl = new FormControl('', [Validators.required]);
    this.inputForm = new FormGroup({ inputControl: this.inputControl });
    this.listId = this.route.paramMap.pipe(map((params: ParamMap) => params.get('id') as string));
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
    this.items.pipe(take(1)).subscribe(() => this.loading.end());

    this.activeItems = this.items.pipe(map(items => items.filter(item => item.active)));

    const inputChanges = this.inputControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      map((input: string | { name: string }) => (typeof input === 'string' ? input : input.name))
    );

    this.unselectedSubscription = this.items
      .pipe(map(items => items.filter(item => !item.active)))
      .subscribe(items => this.search.setData(items));

    this.filteredItems = inputChanges.pipe(
      map(input => {
        const result: any[] = [];
        this.search.search<any>(input).forEach(match => {
          const item = { ...match.item, displayName: highlight(match.item.name, match.matches[0].indices) };
          result.push(item);
        });
        return result;
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
      this.inputControl.reset('', { emitEvent: true });
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

  ngOnDestroy(): void {
    this.unselectedSubscription.unsubscribe();
  }
}
