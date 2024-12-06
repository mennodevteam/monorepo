import { DataLoadingComponent } from './components/data-loading/data-loading.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { CopyClipboardDirective } from './directives/copy-clipboard.directive';
import { GoBackDirective } from './directives/go-back.directive';
import { StopPropagationDirective } from './directives/stop-propagation.directive';
import { SHARED_MODULES } from './modules';
import { COMMON_MATERIAL_ANGULAR_MODULES } from './modules/material-angular';
import { PdatePipe } from './pipes/pdate.pipe';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';

export const SHARED = [
  SHARED_MODULES,
  COMMON_MATERIAL_ANGULAR_MODULES,

  SafeHtmlPipe,
  StopPropagationDirective,
  GoBackDirective,
  CopyClipboardDirective,
  PdatePipe,

  DataLoadingComponent,
  EmptyStateComponent,
];
