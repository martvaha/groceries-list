import { NgModule } from '@angular/core';

import { ListInviteComponent } from './list-invite.component';
import { ListInviteRoutingModule } from './list-invite-routing.module';
import { SharedModule } from '../shared/shared.module';
import { ListInviteContainerComponent } from './list-invite-container.component';

@NgModule({
  imports: [ListInviteRoutingModule, SharedModule],
  exports: [],
  declarations: [ListInviteComponent, ListInviteContainerComponent],
  providers: []
})
export class ListInviteModule {}
