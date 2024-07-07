import { FlexLayoutModule } from '@angular/flex-layout';
import { COMMON_DIRECTIVES } from './directives';
import { COMMON_PIPES } from './pipes';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

const COMMON_MATERIAL = [MatButtonModule];

const COMMON_LIBS = [FlexLayoutModule, TranslateModule];

export const COMMON = [COMMON_DIRECTIVES, COMMON_PIPES, COMMON_MATERIAL, COMMON_LIBS];
