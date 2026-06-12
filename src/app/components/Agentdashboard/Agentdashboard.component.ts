/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @angular-eslint/no-empty-lifecycle-method */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @angular-eslint/component-selector */
import { Component, inject, OnInit } from '@angular/core';
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
import { Agent } from '../../services/agent';
import { firstValueFrom } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
@Component({
  selector: 'app-Agentdashboard',
  templateUrl: './Agentdashboard.component.html',
  styleUrls: ['./Agentdashboard.component.css'],
  standalone: true,
     imports: [TableModule, BlockUIModule, ButtonModule, CardModule, FormsModule, SelectModule, InputTextModule, TabsModule, Toast ,RouterLink]
})
export class AgentdashboardComponent implements OnInit {
  private readonly agentService = inject(Agent);
  private readonly cdr = inject(ChangeDetectorRef);
   totalAgents = 0;
  constructor( ) { }

  ngOnInit() {
     this.loadWholeTreeCount();
  }
  


async loadWholeTreeCount(): Promise<void> {

  // First root agents
  const rootAgents: any[] = await firstValueFrom(
    this.agentService.getChildren()
  );

  this.totalAgents = 0;

  await this.countRecursively(rootAgents);
   this.cdr.detectChanges();
  console.log('Total Agents:', this.totalAgents);
}


async countRecursively(nodes: any[]): Promise<void> {

  for (const node of nodes) {

    // Count current node
    this.totalAgents++;

    try {

      // Load children from API
      const children: any[] = await firstValueFrom(
        this.agentService.getChildren(node.agentID)
      );

      if (children && children.length > 0) {

        // Recursive call
        await this.countRecursively(children);
      }

    } catch (error) {
      console.error('Child Load Error:', error);
    }
  }
}

}
