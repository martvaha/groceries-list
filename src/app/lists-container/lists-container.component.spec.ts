import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListsContainerComponent } from './list-container.component';

describe('ListContainerComponent', () => {
  let component: ListsContainerComponent;
  let fixture: ComponentFixture<ListsContainerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListsContainerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListsContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
