import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule],
  template: `
    <div class="dashboard-container">
      <h2 class="mb-4">Dashboard Overview</h2>
      
      <div class="row g-4 mb-4">
        <div class="col-md-3">
          <p-card class="text-center shadow-sm border-0 h-100">
            <div class="text-primary mb-2"><i class="pi pi-users" style="font-size: 2rem"></i></div>
            <div class="text-muted small uppercase fw-bold">Total Members</div>
            <div class="h3 m-0">1,284</div>
            <div class="text-success small mt-2"><i class="pi pi-arrow-up"></i> 12% this month</div>
          </p-card>
        </div>
        <div class="col-md-3">
          <p-card class="text-center shadow-sm border-0 h-100">
            <div class="text-success mb-2"><i class="pi pi-wallet" style="font-size: 2rem"></i></div>
            <div class="text-muted small uppercase fw-bold">Total Revenue</div>
            <div class="h3 m-0">$45,200</div>
            <div class="text-success small mt-2"><i class="pi pi-arrow-up"></i> 8% this month</div>
          </p-card>
        </div>
        <div class="col-md-3">
          <p-card class="text-center shadow-sm border-0 h-100">
            <div class="text-warning mb-2"><i class="pi pi-star" style="font-size: 2rem"></i></div>
            <div class="text-muted small uppercase fw-bold">Active Agents</div>
            <div class="h3 m-0">856</div>
            <div class="text-danger small mt-2"><i class="pi pi-arrow-down"></i> 3% this month</div>
          </p-card>
        </div>
        <div class="col-md-3">
          <p-card class="text-center shadow-sm border-0 h-100">
            <div class="text-info mb-2"><i class="pi pi-shopping-cart" style="font-size: 2rem"></i></div>
            <div class="text-muted small uppercase fw-bold">New Sales</div>
            <div class="h3 m-0">342</div>
            <div class="text-success small mt-2"><i class="pi pi-arrow-up"></i> 24% this month</div>
          </p-card>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-md-12">
          <p-card header="Revenue Growth" class="shadow-sm border-0">
            <p-chart type="line" [data]="chartData" [options]="chartOptions" height="300px"></p-chart>
          </p-card>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-md-8">
          <p-card header="Recent Activities" class="shadow-sm border-0">
            <div class="list-group list-group-flush">
              <div class="list-group-item px-0 py-3 d-flex align-items-center gap-3">
                <div class="rounded-circle bg-light p-2"><i class="pi pi-user-plus text-primary"></i></div>
                <div class="flex-grow-1">
                  <div class="fw-bold">New Member Joined</div>
                  <div class="text-muted small">Alice Smith joined the network under Manager A</div>
                </div>
                <div class="text-muted small">2 mins ago</div>
              </div>
              <div class="list-group-item px-0 py-3 d-flex align-items-center gap-3">
                <div class="rounded-circle bg-light p-2"><i class="pi pi-dollar text-success"></i></div>
                <div class="flex-grow-1">
                  <div class="fw-bold">Commission Paid</div>
                  <div class="text-muted small">Commission of $150 paid to Bob Wilson</div>
                </div>
                <div class="text-muted small">1 hour ago</div>
              </div>
              <div class="list-group-item px-0 py-3 d-flex align-items-center gap-3">
                <div class="rounded-circle bg-light p-2"><i class="pi pi-refresh text-warning"></i></div>
                <div class="flex-grow-1">
                  <div class="fw-bold">Rank Upgraded</div>
                  <div class="text-muted small">David Miller upgraded to Senior Manager</div>
                </div>
                <div class="text-muted small">5 hours ago</div>
              </div>
            </div>
          </p-card>
        </div>
        <div class="col-md-4">
          <p-card header="Quick Actions" class="shadow-sm border-0">
            <div class="d-grid gap-2">
              <button class="btn btn-outline-primary text-start d-flex align-items-center gap-2">
                <i class="pi pi-plus"></i> Add New Member
              </button>
              <button class="btn btn-outline-success text-start d-flex align-items-center gap-2">
                <i class="pi pi-file-export"></i> Export Report
              </button>
              <button class="btn btn-outline-info text-start d-flex align-items-center gap-2">
                <i class="pi pi-send"></i> Send Announcement
              </button>
              <button class="btn btn-outline-secondary text-start d-flex align-items-center gap-2">
                <i class="pi pi-cog"></i> System Settings
              </button>
            </div>
          </p-card>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  chartData: unknown;
  chartOptions: unknown;

  ngOnInit() {
    this.chartData = {
      labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
      datasets: [
        {
          label: 'Revenue 2024 ($)',
          data: [65, 59, 80, 81, 56, 55, 40],
          fill: false,
          borderColor: '#42A5F5',
          tension: .4
        },
        {
          label: 'Revenue 2023 ($)',
          data: [28, 48, 40, 19, 86, 27, 90],
          fill: false,
          borderColor: '#FFA726',
          tension: .4
        }
      ]
    };

    this.chartOptions = {
      plugins: {
        legend: {
          labels: {
            color: '#495057'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#495057'
          },
          grid: {
            color: '#ebedef'
          }
        },
        y: {
          ticks: {
            color: '#495057'
          },
          grid: {
            color: '#ebedef'
          }
        }
      }
    };
  }
}
