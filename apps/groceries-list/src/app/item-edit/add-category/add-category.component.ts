import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-add-category',
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddCategoryComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
