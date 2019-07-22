import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Item, Group } from '../../shared/models';

@Component({
  selector: 'app-item-edit-form',
  templateUrl: './item-edit-form.component.html',
  styleUrls: ['./item-edit-form.component.scss']
})
export class ItemEditFormComponent {
  @Input()
  set item(value: Item) {
    if (!value) return;
    this._item = value;
    this.form.patchValue(value);
  }
  get item() {
    return this._item;
  }
  @Input() groups: Group[];
  @Output() updated = new EventEmitter<Item>();
  @Output() return = new EventEmitter<void>();
  form = this.formBuilder.group({
    name: [undefined, [Validators.required]],
    active: [undefined, [Validators.required]],
    groupId: [undefined]
  });
  @Output() groupAdd = new EventEmitter<void>();
  private _item: Item;

  constructor(private formBuilder: FormBuilder) {}

  onUpdate() {
    console.log(this.item, this.form.getRawValue());
    this.updated.emit({ ...this.item, ...this.form.getRawValue() });
  }
}
