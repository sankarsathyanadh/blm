/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { tokenInterceptor } from './interceptors/token-interceptor';
import { providePrimeNG } from 'primeng/config';
import Lara from '@primeng/themes/Lara';

import { MessageService } from 'primeng/api';


import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    MessageService,
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(
        withInterceptors([tokenInterceptor])
    ),
      providePrimeNG({
      theme: {
        preset: Lara,
        options: {
          darkModeSelector: false,
          // Backgrounds
          surface: '#ffffff',   // main background
          background: '#ffffff', // page background

          // Primary color (blue)
          primary: {
            50: '#e3f2fd',
            100: '#bbdefb',
            200: '#90caf9',
            300: '#64b5f6',
            400: '#42a5f5',
            500: '#2196f3', // main blue
            600: '#1e88e5',
            700: '#1976d2',
            800: '#1565c0',
            900: '#0d47a1'
          },

          // Text colors
          textColor: '#000000',
        }

      },
    }),
  ]
};
