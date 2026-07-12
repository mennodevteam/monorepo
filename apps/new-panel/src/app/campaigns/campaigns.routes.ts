import { Route } from '@angular/router';
import { CampaignsListComponent } from './campaigns-list.component';
import { CampaignsEditComponent } from './campaigns-edit.component';
import { CampaignReportComponent } from './campaign-report.component';

export const campaignsRoutes: Route[] = [
  {
    path: '',
    component: CampaignsListComponent,
  },
  {
    path: 'edit',
    component: CampaignsEditComponent,
  },
  {
    path: 'report',
    component: CampaignReportComponent,
  },
];
