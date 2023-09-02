import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class PanelLocalAuthGuard extends AuthGuard('panel-local') {}
