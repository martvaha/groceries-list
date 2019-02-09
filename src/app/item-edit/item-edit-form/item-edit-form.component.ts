import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ListItem } from '../../shared/models';

@Component({
  selector: 'gl-item-edit-form',
  templateUrl: './item-edit-form.component.html',
  styleUrls: ['./item-edit-form.component.scss']
})
export class ItemEditFormComponent implements OnInit {
  @Input() item: ListItem;
  form: FormGroup;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      name: [this.item.name],
      active: [this.item.active]
    });
  }
}
