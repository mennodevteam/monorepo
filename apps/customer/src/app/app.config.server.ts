import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { provideSsrDataTransfer } from './core/providers/ssr-data.provider';

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes)), provideSsrDataTransfer()],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
