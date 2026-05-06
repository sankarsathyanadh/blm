/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @angular-eslint/prefer-inject */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  //  private apiUrl = 'https://imkttest.icrats.in/api/imkt/api/auth/token';
   private apiUrl = '/api/imkt/api/auth/token';

  constructor(private http: HttpClient , private router: Router, private messageService: MessageService) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, {
      username: username,
      password: password
    }).pipe(
      tap(response => {
        if (response.success) {
          localStorage.setItem('token', response.data.token);
        }
      })
    );
  }
    getToken() {
    return localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  // Helper to show the error and log out
handleSessionExpired() {
  this.logout();
  this.messageService.add({ 
    severity: 'error', 
    summary: 'Session Expired', 
    detail: 'Please login again to continue.',
    life: 5000 
  });
}
// usernamegetter
getUsername(): string | null {
  const token = this.getToken();
  if (!token) return null;

  try {
    //  decode JWT payload to get username
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub ?? payload.username ?? null;
  } catch {
    return null;
  }
}

isAdmin(): boolean {
  return this.getUsername() === 'admin';
}
}
