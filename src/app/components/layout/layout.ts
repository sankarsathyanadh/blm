import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ButtonModule],
  template: `
    <div class="d-flex">
      <!-- Sidebar -->
      <div class="sidebar-menu" [style.width]="isCollapsed() ? '80px' : '250px'">
        <div class="p-md-3 d-flex align-items-center justify-content-between border-bottom border-secondary">
          @if (!isCollapsed()) {
            <span class="fw-bold text-truncate d-none d-md-block">MLM </span>
          }
          <p-button 
            [icon]="isCollapsed() ? 'pi pi-angle-right' : 'pi pi-angle-left'" 
            [text]="true" 
            severity="secondary"
            (onClick)="toggleSidebar()">
          </p-button>
        </div>
        
        <div class="mt-3">
          <!-- <div class="sidebar-item" routerLink="/dashboard" routerLinkActive="active">
            <i class="pi pi-home"></i>
            @if (!isCollapsed()) {
              <span>Dashboard</span>
            }
          </div> -->
              <div class="sidebar-item" routerLink="/AgentDashboard" routerLinkActive="active">
            <i class="pi pi-th-large"></i>
            @if (!isCollapsed()) {
              <span>Agent Dashboard</span>
            }
          </div>
           <div class="sidebar-item" routerLink="/networktree" routerLinkActive="active">
            <i class="pi pi-sitemap"></i>
            @if (!isCollapsed()) {
              <span class="d-none d-md-block" >BLM Agents</span>
            }
          </div>
          <!-- <div class="sidebar-item" routerLink="/network" routerLinkActive="active">
            <i class="pi pi-sitemap"></i>
            @if (!isCollapsed()) {
              <span>Network Hierarchy</span>
            }
          </div> -->
          <!-- <div class="sidebar-item" routerLink="/users" routerLinkActive="active">
            <i class="pi pi-users"></i>
            @if (!isCollapsed()) {
              <span>Members</span>
            }
          </div> -->
          <!-- <div class="sidebar-item" routerLink="/networktest" routerLinkActive="active">
            <i class="pi pi-users"></i>
            @if (!isCollapsed()) {
              <span>NetworkUser</span>
            }
          </div> -->
       
          @if (isAdmin) {
          <div class="sidebar-item" routerLink="/designation" routerLinkActive="active">
            <i class="pi pi-users"></i>
            @if (!isCollapsed()) {
              <span>Designation</span>
            }
          </div>
          }
          
          <div class="sidebar-item mt-auto" routerLink="/login">
            <i class="pi pi-power-off"></i>
            @if (!isCollapsed()) {
              <span class="d-none d-md-block" >Logout</span>
            }
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-grow-1 overflow-auto" style="height: 100vh;">
        <header class="bg-white border-bottom px-4 py-2 d-flex justify-content-between align-items-center sticky-top">
          <h5 class="m-0 text-success fw-bold ">Dashboard</h5>
          <div class="d-flex align-items-center gap-3">
            <span class="text-muted small">Welcome, Admin</span>
            <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style="width: 35px; height: 35px;">
              A
            </div>
          </div>
        </header>
        
        <main class="px-4 py-2">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .sidebar-menu {
      display: flex;
      flex-direction: column;
    }
    .sidebar-menu {
    height: 100vh;
    background: #212529;
    color: white;
    transition: width 0.3s;
}

.sidebar-item {
    padding: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: background 0.2s;
}

.sidebar-item:hover {
    background: #343a40;
}

.sidebar-item.active {
    background: #10ab58;
}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class LayoutComponent {
   private readonly   authService = inject(Auth) ;
  isCollapsed = signal(false);

  toggleSidebar() {
    this.isCollapsed.update(v => !v);
  }

  // permission 
get isAdmin(): boolean {
  return this.authService.isAdmin();
}
}
