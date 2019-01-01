import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'gl-test',
  template: `<h1>Test</h1>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TestComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
