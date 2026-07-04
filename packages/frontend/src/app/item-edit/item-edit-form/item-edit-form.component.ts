import { ChangeDetectionStrategy, Component, inject, Input, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider } from "@angular/material/divider";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Group, Item } from '../../shared/models';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule, MatButtonModule, MatIconModule, MatTooltipModule, MatDivider],
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
