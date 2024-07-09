import { FlexLayoutModule } from '@angular/flex-layout';
import { COMMON_DIRECTIVES } from './directives';
import { COMMON_PIPES } from './pipes';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';

const COMMON_CORE = [RouterModule];

const COMMON_MATERIAL = [MatButtonModule, MatDividerModule];

const COMMON_LIBS = [FlexLayoutModule, TranslateModule];

export const COMMON = [COMMON_CORE, COMMON_DIRECTIVES, COMMON_PIPES, COMMON_MATERIAL, COMMON_LIBS];
