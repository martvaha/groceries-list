import { NgModule } from '@angular/core';

import { MaterialModule} from './material.module';

const modules = [ MaterialModule];

@NgModule({
  imports: modules,
  exports: modules,
  declarations: [],
  providers: [],
})
export class SharedModule { }
