import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppShellComponent } from './app-shell.component';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

describe('AppShellComponent', () => {
  let component: AppShellComponent;
  let fixture: ComponentFixture<AppShellComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [MatButtonModule, MatIconModule, MatToolbarModule, MatProgressSpinnerModule],
      declarations: [AppShellComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
