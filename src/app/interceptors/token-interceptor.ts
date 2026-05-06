/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @angular-eslint/prefer-inject */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpInterceptorFn ,HttpErrorResponse} from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';   // adjust path if needed
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {

  const auth = inject(Auth);
  const messageService = inject(MessageService);
  const router = inject(Router);
  const token = auth.getToken();

  if (token) {

    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Clear local storage and redirect
        auth.logout(); 
        router.navigate(['/login']);

        // Show PrimeNG Toast
        messageService.add({
          severity: 'error',
          summary: 'Session Expired',
          detail: 'Your session has timed out. Please login again.',
          life: 3000
        });
      }
      return throwError(() => error);
    })
  );
};
