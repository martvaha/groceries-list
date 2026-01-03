import { Component, Input, ChangeDetectionStrategy, inject, output, input } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Item, Group } from '../../shared/models';

@Component({
  standalone: false,
  selector: 'app-item-edit-form',
  templateUrl: './item-edit-form.component.html',
  styleUrls: ['./item-edit-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemEditFormComponent {
  private formBuilder = inject(FormBuilder);

  // TODO: Skipped for migration because:
  //  Accessor inputs cannot be migrated as they are too complex.
  @Input()
  set item(value: Item | null | undefined) {
    if (!value) return;
    this._item = value;
    this.form.patchValue(value as any);
  }
  get item() {
    return this._item;
  }
  readonly groups = input<Group[] | null>();
  readonly updated = output<Item>();
  readonly return = output<void>();
  form = this.formBuilder.group({
    name: [undefined as string | undefined, [Validators.required]],
    description: [undefined as string | undefined],
    active: [undefined as boolean | undefined, [Validators.required]],
    groupId: [undefined as string | undefined],
  });
  readonly groupAdd = output<void>();
  private _item?: Item | null;

  onUpdate() {
    console.log(this.item, this.form.getRawValue());
    this.updated.emit({ ...this.item, ...this.form.getRawValue() } as Item);
  }
}
