import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { UserService } from '../../services/user';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, TableModule, TagModule, ButtonModule],
  template: `
    <div class="users-container">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1">Member List</h2>
          <p class="text-muted">Manage and view all members in your network</p>
        </div>
        <p-button label="Export CSV" icon="pi pi-download" severity="secondary"></p-button>
      </div>

      <div class="card shadow-sm border-0">
        <p-table [value]="userService.users()" [paginator]="true" [rows]="10" responsiveLayout="scroll">
          <ng-template pTemplate="header">
            <tr>
              <th>Name</th>
              <th>Member #</th>
              <th>Agent Code</th>
              <th>Role</th>
              <th>Join Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-user>
            <tr>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div class="rounded-circle bg-light d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                    <i class="pi pi-user text-muted"></i>
                  </div>
                  <span class="fw-bold">{{ user.name }}</span>
                </div>
              </td>
              <td>{{ user.memberNumber }}</td>
              <td>{{ user.agentCode }}</td>
              <td>{{ user.role }}</td>
              <td>{{ user.joinDate }}</td>
              <td>
                <p-tag [value]="user.status" [severity]="user.status === 'Active' ? 'success' : 'danger'"></p-tag>
              </td>
              <td>
                <div class="d-flex gap-2">
                  <p-button icon="pi pi-pencil" [text]="true" severity="info" size="small"></p-button>
                  <p-button icon="pi pi-trash" [text]="true" severity="danger" size="small"></p-button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent {
  userService = inject(UserService);
}
