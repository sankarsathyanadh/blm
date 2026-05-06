/* eslint-disable @angular-eslint/no-empty-lifecycle-method */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-inferrable-types */
import { Component,  OnInit , inject , ChangeDetectorRef} from '@angular/core';
import { TableModule } from 'primeng/table';
import { BlockUIModule } from 'primeng/blockui';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FormsModule } from '@angular/forms'; 
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TabsModule } from 'primeng/tabs';
import { Agent } from '../../services/agent';
// import { finalize } from 'rxjs/operators';
import { forkJoin, finalize } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Toast } from "primeng/toast";
@Component({
  selector: 'app-designation',
  templateUrl: './designation.component.html',
  styleUrls: ['./designation.component.css'],
    standalone: true,
     imports: [TableModule, BlockUIModule, ButtonModule, CardModule, FormsModule, SelectModule, InputTextModule, TabsModule, Toast]
})
export class DesignationComponent implements OnInit {
  private messageService = inject(MessageService);
    designationTypes = [
    { label: 'Designation', value: 'Designation' },
    { label: 'Agent Designation', value: 'Agent Designation' }
  ];
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   selectedType: any = null;
designationName: string = '';
designationDescription: string = '';
designationGrade: string = '';
designationList: any[] = [];

agentDesignationName: string = '';
// agentDesignationList: any[] = [];
agentDesignationDescription: string = '';
agentDesignationGrade: string = '';
agentDesignationList: any[] = [];
 loading: boolean = false; 
 designationLoading = false;
agentDesignationLoading = false;
  constructor(  ) { }
    // private readonly   authService = inject(Auth) ;

  private readonly designationService = inject(Agent);
  private cdr = inject(ChangeDetectorRef);
  // edit assign
  selectedAgentDesignation: any = null; // for edit
  selectedDesignation: any = null; // for edit

  ngOnInit() {
    this.loadAllDesignations();
    //  this.loadDesignationlist();
    //  this.loadAgentDesignations();
  }
  // LOAD FROM api 
  loadAllDesignations() {
  // Start both loading indicators
  this.designationLoading = true;
  this.agentDesignationLoading = true;

  forkJoin({
    designations: this.designationService.getDesignationslist(),
    agentDesignations: this.designationService.getAgentDesignations()
  })
  .pipe(
    finalize(() => {
      this.designationLoading = false;
      this.agentDesignationLoading = false;
      this.cdr.detectChanges();
    })
  )
  .subscribe({
    next: (res) => {
      this.designationList = this.mapDesignation(res.designations);
      this.agentDesignationList = this.mapDesignation(res.agentDesignations);
    },
    error: (err) => {
      console.error('Error fetching data:', err);
    }
  });
}
loadDesignationlist() {
  this.designationLoading = true;

  this.designationService.getDesignationslist().subscribe({
    next: (res) => {
      this.designationList = this.mapDesignation(res);
      this.designationLoading = false;
    },
    error: (err) => {
      console.error('Error fetching designations', err);
      this.designationLoading = false;
    }
  });
}
loadAgentDesignations() {
  this.agentDesignationLoading = true;

  this.designationService.getAgentDesignations().subscribe({
    next: (res) => {
      this.agentDesignationList = this.mapDesignation(res);
      this.agentDesignationLoading = false;

      this.cdr.markForCheck();  
    },
    error: (err) => {
      console.error(err);
      this.agentDesignationLoading = false;

      this.cdr.markForCheck();
    }
  });
}
 // Normal Designation
saveDesignation() {

  if (!this.designationName || !this.designationDescription) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Validation',
      detail: 'Please fill required fields'
    });
    return;
  }

  const payload = {
    id: this.selectedDesignation?.id || 0,
    name: this.designationDescription,
    code: this.designationName,
    grade: this.designationGrade || null,
    isActive: true
  };

  this.designationLoading = true;

  this.designationService.saveDesignation(payload).subscribe({
    next: (res) => {

      const mappedItem = {
        id: res.id,
        name: res.code,
        description: res.name,
        grade: res.grade || ''
      };

      if (this.selectedDesignation) {
        this.designationList = this.designationList.map(item =>
          item.id === res.id ? mappedItem : item
        );

        //  UPDATE SUCCESS
        this.messageService.add({
          severity: 'success',
          summary: 'Updated',
          detail: 'Designation updated successfully'
        });

      } else {
        this.designationList = [...this.designationList, mappedItem];

        //  SAVE SUCCESS
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Designation saved successfully'
        });
      }

      this.resetDesignationForm();
      this.designationLoading = false;
      this.cdr.markForCheck();
    },

    error: (err) => {
      console.error(err);

      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save designation'
      });

      this.designationLoading = false;
    }
  });
}
// Agent Designation
saveAgentDesignation() {

  if (!this.agentDesignationName || !this.agentDesignationDescription) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Validation',
      detail: 'Please fill required fields'
    });
    return;
  }

const payload = {
    id: this.selectedAgentDesignation?.id || 0,
    name: this.agentDesignationDescription,
    code: this.agentDesignationName,
    grade: this.agentDesignationGrade || null,
    isActive: true
  };

  this.agentDesignationLoading = true;

  this.designationService.saveAgentDesignation(payload).subscribe({
next: (res) => {
      const mappedItem = {
        id: res.id,
        name: res.code,
        description: res.name,
        grade: res.grade || ''
      };

      if (this.selectedAgentDesignation) {
        this.agentDesignationList = this.agentDesignationList.map(item => 
          item.id === res.id ? mappedItem : item
        );
        this.messageService.add({
          severity: 'success',
          summary: 'Updated',
          detail: 'Agent Designation updated successfully'
        });
      }
      else {
        this.agentDesignationList = [...this.agentDesignationList, mappedItem];
         this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Agent Designation saved successfully'
        });
      }
      this.agentDesignationLoading = false;
      this.resetAgentForm();
      this.cdr.markForCheck(); // Better than detectChanges() in many cases
    },

    error: (err) => {
      console.error('Save failed', err);
       this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save Agent designation'
      });
      this.agentDesignationLoading = false;
    }
  });
}

mapDesignation(res: any[]) {
  return res.map(item => ({
    id: item.id,
    name: item.code,
    description: item.name,
    grade: item.grade || ''
  }));
}
// code 23-04
resetAgentForm() {
  this.agentDesignationName = '';
  this.agentDesignationDescription = '';
  this.agentDesignationGrade = '';
  this.selectedAgentDesignation = null;
}
resetDesignationForm() {
  this.designationName = '';
  this.designationDescription = '';
  this.designationGrade = '';
  this.selectedDesignation = null;
}
editAgentDesignation(row: any) {
  this.selectedAgentDesignation = row;

  this.agentDesignationName = row.name;
  this.agentDesignationDescription = row.description;
  this.agentDesignationGrade = row.grade;
}
editDesignation(row: any) {
  this.selectedDesignation = row;

  this.designationName = row.name;
  this.designationDescription = row.description;
  this.designationGrade = row.grade;
}
}
