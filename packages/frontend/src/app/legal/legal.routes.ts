import { Routes } from '@angular/router';
import { DeleteDataComponent } from './delete-data/delete-data.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';

export const LEGAL_ROUTES: Routes = [
  { path: 'delete-data', component: DeleteDataComponent },
  { path: 'privacy', component: PrivacyPolicyComponent },
];
