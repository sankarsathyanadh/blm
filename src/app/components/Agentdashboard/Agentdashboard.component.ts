/* eslint-disable @angular-eslint/no-empty-lifecycle-method */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @angular-eslint/component-selector */
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BlockUIModule } from 'primeng/blockui';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { Toast } from 'primeng/toast';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-Agentdashboard',
  templateUrl: './Agentdashboard.component.html',
  styleUrls: ['./Agentdashboard.component.css'],
  standalone: true,
     imports: [TableModule, BlockUIModule, ButtonModule, CardModule, FormsModule, SelectModule, InputTextModule, TabsModule, Toast ,RouterLink]
})
export class AgentdashboardComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
