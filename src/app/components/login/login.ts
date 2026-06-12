/* eslint-disable @angular-eslint/prefer-inject */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import {  FormGroup, } from '@angular/forms';
import { Auth } from '../../services/auth';
import { ToastModule } from 'primeng/toast';           
import { MessageService } from 'primeng/api';  

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, InputTextModule, CardModule, ToastModule],
   providers: [MessageService],
  template: ` <p-toast position="top-right" /> 
    <div class="login-container d-flex align-items-center justify-content-center">
  <p-card header="MLM Login" [style]="{ width: '400px' }" class="shadow-lg">

    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="p-fluid">

      <div class="field mb-3 d-flex flex-column">
        <label for="username">Username</label>
        <input
          id="username"
          type="text"
          pInputText
          formControlName="username"
          placeholder="Enter username"
        />
      </div>

      <div class="field mb-4 d-flex flex-column">
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          pInputText
          formControlName="password"
          placeholder="Enter password"
        />
      </div>
           <div class=" mb-4 d-flex flex-column text-right float-end ">
            <p-button
        label="Login"
        type="submit"
        [loading]="loading"
        [disabled]="loginForm.invalid"
        icon="pi pi-sign-in">
      </p-button>

           </div>
      

      <!-- eslint-disable-next-line @angular-eslint/template/prefer-control-flow -->
      <small class="text-danger mt-2 d-block" *ngIf="errorMsg">
        {{ errorMsg }}
      </small>

    </form>

  </p-card>
</div>
  `,
  styles: [`
    .login-container {
      height: 100vh;
      background: linear-gradient(135deg, #09a754 0%, #00664e 100%);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class LoginComponent {
  
   loginForm: FormGroup;
  loading = false;
  errorMsg = '';

    constructor(
    // eslint-disable-next-line @angular-eslint/prefer-inject
    private fb: FormBuilder,
    private authService: Auth,
    private router: Router ,
     private messageService: MessageService  
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }
 
onSubmit() {

 if (this.loginForm.invalid) {
      this.messageService.add({           
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please enter username and password',
        life: 3000
      });
      return;
    }

  this.loading = true;
  this.errorMsg = '';

  const { username, password } = this.loginForm.value;

  this.authService.login(username, password).subscribe({

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    next: (res: any) => {

      if (res?.success && res?.data?.token) {

        console.log('Token:', res.data.token);

        // this.router.navigate(['/networktree']);
        this.router.navigate(['/AgentDashboard']);

      } else {

        this.messageService.add({        
            severity: 'error',
            summary: 'Login Failed',
            detail: res?.message || 'Invalid credentials',
            life: 4000
          });
      }

      this.loading = false;
    },

   error: (err) => {
        this.messageService.add({         
          severity: 'error',
          summary: 'Login Failed',
          detail: err?.error?.message || err?.message || 'Invalid username or password',
          life: 4000
        });
        this.loading = false;
      }

  });

}

}
