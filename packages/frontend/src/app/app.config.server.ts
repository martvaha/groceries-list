import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes, withAppShell } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { AppShellComponent } from './app-shell/app-shell.component';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(
      withRoutes(serverRoutes),
      withAppShell(AppShellComponent),
    ),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
