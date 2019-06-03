import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription, combineLatest, BehaviorSubject, Subject } from 'rxjs';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { switchMap, map, debounceTime, startWith, delay, tap, take, withLatestFrom, takeUntil } from 'rxjs/operators';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { ErrorStateMatcher, MatSnackBar } from '@angular/material';
import { LoadingService } from '../shared/loading-service';
import { highlight } from '../shared/utils';
import * as Fuse from 'fuse.js';
import { Item } from '../shared/models';

export interface FuseMatch {
  indices: [number, number][];
  value: string;
  key: string;
  arrayIndex: number;
}

export interface FuseAdvancedResult<T> {
  item: T;
  matches: FuseMatch[];
}

@Component({
  selector: 'gl-list-container',
  templateUrl: './list-container.component.html',
  styleUrls: ['./list-container.component.scss']
})
export class ListContainerComponent implements OnInit, OnDestroy {
  private itemsSubject = new BehaviorSubject<Item[]>([]);
  private destroy$ = new Subject<any>();

  public listId: Observable<string>;
  public activeItems: Observable<Item[]>;
  public filteredItems$: Observable<Item[]>;
  public inputControl: FormControl;
  public inputForm: FormGroup;
  private unselectedSubscription: Subscription;
  private fuse: Fuse<Item>;
  public items = this.itemsSubject.asObservable();

  public inputValid: ErrorStateMatcher = {
    isErrorState: (control: FormControl) => {
      return !control.pristine && !control.valid;
    }
  };

  constructor(
    private route: ActivatedRoute,
    private db: AngularFirestore,
    private loading: LoadingService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loading.start();
    this.fuse = new Fuse<Item>([], {
      keys: ['name'],
      includeMatches: true,
      threshold: 0.6
    });
    this.inputControl = new FormControl('', [Validators.required]);
    this.inputForm = new FormGroup({ inputControl: this.inputControl });
    this.listId = this.route.paramMap.pipe(map((params: ParamMap) => params.get('id') as string));
    this.listId
      .pipe(
        switchMap(listId => {
          const path = 'lists/' + listId + '/items';
          return this.db
            .collection<Item>(path, ref => ref.orderBy('name'))
            .snapshotChanges()
            .pipe(
              map(items =>
                items.map(item => {
                  const data = item.payload.doc.data();
                  const id = item.payload.doc.id;
                  return { id, ...data };
                })
              ),
              tap(d => console.log(d)),
              takeUntil(this.destroy$)
            );
        })
      )
      .subscribe(items => this.itemsSubject.next(items));

    this.items.pipe(take(1)).subscribe(() => this.loading.end());

    this.activeItems = this.items.pipe(map(items => items.filter(item => item.active)));

    const search$ = this.inputControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      map((input: string | { name: string }) => (typeof input === 'string' ? input : input.name))
    );

    const unselected$ = this.items.pipe(
      map(items => items.filter(item => !item.active)),
      map(items => {
        this.fuse.setCollection(items);
        return { items, fuse: this.fuse };
      })
    );

    this.filteredItems$ = combineLatest(search$, unselected$).pipe(
      map(([search, { items, fuse }]) =>
        fuse && search.length
          ? fuse.search(search).map((match: any) => ({
              ...match.item,
              displayName: highlight(match.item.name, match.matches[0].indices)
            }))
          : items.map(item => ({ ...item, displayName: item.name }))
      )
    );
  }

  addItem() {
    const { valid, value } = this.inputControl;
    if (valid && value) {
      if (typeof value === 'object' && 'id' in value) {
        console.log('add object', value);
        this.listId.pipe(take(1)).subscribe(listId => {
          const path = 'lists/' + listId + '/items/' + value.id;
          this.db.doc(path).update({ active: true });
        });
      } else if (typeof value === 'string') {
        console.log('add string', `"${value}"`);
        const trimmedValue = value.trim();
        this.listId
          .pipe(
            withLatestFrom(this.items),
            take(1)
          )
          .subscribe(([listId, items]) => {
            const existingValue = items.find(item => item.name === trimmedValue);
            console.log(existingValue);
            existingValue
              ? this.db.doc('lists/' + listId + '/items/' + existingValue.id).update({ active: true })
              : this.db.collection('lists/' + listId + '/items').add({ name: trimmedValue, active: true });
          });
      }
      this.inputControl.reset('', { emitEvent: true });
    }
  }

  markDone(item: Item) {
    this.listId.pipe(delay(300)).subscribe(listId => {
      const path = 'lists/' + listId + '/items/' + item.id;
      this.db.doc(path).update({ active: false });
      const snackBarRef = this.snackBar.open(`${item.name} ostetud!`, 'Taasta', { duration: 5000 });
      snackBarRef.afterDismissed().subscribe(data => {
        if (data.dismissedByAction) {
          this.db.doc(path).update({ active: true });
        }
      });
    });
  }

  inputDisplay(item?: Item): string | undefined {
    return item ? item.name : undefined;
  }

  trackById(index: number, item: Item) {
    return item.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    delete this.destroy$;
  }
}
