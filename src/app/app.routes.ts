import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./components/login/login').then(m => m.LoginComponent) 
  },
  {
    path: '',
    loadComponent: () => import('./components/layout/layout').then(m => m.LayoutComponent),
    children: [
      { 
        path: 'dashboard', 
        loadComponent: () => import('./components/dashboard/dashboard').then(m => m.DashboardComponent) 
      },
      { 
        path: 'network', 
        loadComponent: () => import('./components/network/network').then(m => m.NetworkComponent) 
      },
       { 
        path: 'networktree', 
        loadComponent: () => import('./components/networktree/networktree.component').then(m => m.NetworktreeComponent) 
      },
        { 
        path: 'networktest', 
        loadComponent: () => import('./components/networktest/networktest.component').then(m => m.NetworktestComponent) 
      },
      {
        path: 'users',
        loadComponent: () => import('./components/users/users').then(m => m.UsersComponent)
      },
      {
        path : 'designation',
        loadComponent:() => import('./components/designation/designation.component').then(m=>m.DesignationComponent)
      }

    ]
  },


  { path: '**', redirectTo: 'login' }
];
