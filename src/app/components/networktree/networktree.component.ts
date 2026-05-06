/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TreeNode, MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { BlockUIModule } from 'primeng/blockui';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TreeTableModule } from 'primeng/treetable';
import {  forkJoin, Subject, takeUntil } from 'rxjs';
// import { AgentService } from '../../services/agent.service';
import { Agent } from '../../services/agent';
import { PdfReportService } from '../../services/pdf-report.service';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip'; 
import { PopoverModule } from 'primeng/popover';
import { Auth } from '../../services/auth';
import * as XLSX from 'xlsx';
import { from, concatMap, toArray, catchError } from 'rxjs';
import { DatePickerModule } from 'primeng/datepicker';



@Component({
  selector: 'app-networktree',
  templateUrl: './networktree.component.html',
  styleUrls: ['./networktree.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush, 
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TreeTableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    MultiSelectModule,
    SelectModule,
    RadioButtonModule,
    ToastModule,
    CardModule,
    AvatarModule,
    IconFieldModule,
    InputIconModule,
    BlockUIModule,
    ProgressSpinnerModule,
    ToggleSwitchModule ,
    MenuModule,
    TooltipModule ,
    PopoverModule,
    DatePickerModule 

  ],
  providers: [MessageService], // scoped here so toast works standalone
})

export class NetworktreeComponent implements OnInit, OnDestroy {
[x: string]: any;
  // ── DI (modern inject() style) ──────────
  private readonly agentService = inject(Agent);
  private readonly   authService = inject(Auth) ;
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly cd = inject(ChangeDetectorRef);
private readonly pdfService = inject(PdfReportService);



  // ── State ─────
  treeData: TreeNode[] = [];
  filteredTreeData: TreeNode[] = [];
  roles: any[] = [];
  branches: any[] = [];
  members: any[] = [];
  //  test code form 
designations: any[] = [];
designationsstaff: any[] = [];
staffDesignations: any[] = [];

agents = [
  { name: 'S1', value: 'S1' },
  { name: 'S2', value: 'S2' }
];
// new code 10/04 
selectedNode: any; // This will hold the PrimeNG TreeNode object
// end 
// selected child change parent 
// ── Change Parent Dialog state ───────────
changeParentVisible   = false;
selectedAgentDetail: any = null;
changeParentLoading   = false;   // loading agent details
updateParentLoading   = false;   // saving
selectedNewParentID: number | null = null;
agentListForParent: any[] = [];  
selectedIntroducedByID: number | null = null;
// end 
// ── Update Branch Dialog state ─────────────────────────────────────────
updateBranchVisible   = false;
updateBranchLoading   = false;
updateBranchSaving    = false;
selectedAgentForBranch: any = null;
selectedBranchIDs:    number[] = [];
availableBranches:    any[]    = [];  // filtered by parent branches
// end 

  form!: FormGroup;
  globalSearchValue = '';
  noDataMessage = '';
  loading = false;       // tree loading indicator
  uiloading = false;     // dialog search indicator
  dialogVisible = false;
  isVisibleRoleBranchDiv = false;

  selectedParent: TreeNode | null = null;
  // action Menu 

  statusLoadingMap: Record<number, boolean> = {};
  updateParentFailed = false;


  // ── Cleanup ──────────────────────────────────────────────────────────────
  private readonly destroy$ = new Subject<void>();
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;
  pdfLoadingMap: Record<number, boolean> = {};   // key = agentID, loadingPdf
// ── Excel state ───────────────────────────────────────────────────────
excelPreviewVisible = false;
excelTreeData: TreeNode[] = [];
excelFileName = '';
// ── Excel save state ──────────────────────────────────────────────────
excelSaveLoading = false;
excelSaveProgress = 0;        // track progress 0-100
excelSavedCount   = 0;
excelTotalCount   = 0;
excelFailedRows: any[] = [];  // track failed rows

// update code for Change Desinaton 
// ── Update Designation Dialog state ────────
updateDesigVisible   = false;
updateDesigLoading   = false;
updateDesigForm!: FormGroup;
selectedAgentForUpdate: any = null;

// ── Build form — call in ngOnInit ─────
private _buildUpdateDesigForm(): void {
  this.updateDesigForm = this.fb.group({
    roleID:                [null, Validators.required],
    designationID:         [null, Validators.required],
    employeeDesignationID: [null],
    employeeCode:          [''],
    joiningDate:           [null],
  });
}
get isStaffRoleInUpdateForm(): boolean {
  const roleID = this.updateDesigForm?.value?.roleID;
  const role   = this.roles.find(r => r.roleID === roleID);
  const name   = role?.roleName?.toLowerCase() ?? '';
  return name.includes('staff') || name.includes('salaried');
}


// view details of member 

selectedAgentDetailView: any = null;
agentDialogVisible = false;
agentLoading = false;
// end view 
// code to get designation details of member  
getDesignationName(designationID: number): string {
  // alert(designationID);
  if (!designationID) return '—';
  if (!this.designations?.length) return '—';
  const found = this.designations.find(d => d.id === designationID);
  if (!found) return '—';
  return `${found.code}`;  // e.g. "Field Manager (FM)"
  // ${found.name}
}
  // code to get Member details popup 
  getBranchNamesPopup(): string {
  return this.selectedAgentDetail?.branches
    ?.map((b: any) => b.branchName)
    .join(', ') || '-';
}
// 2nd branch
getBranchNames(branches: any[]): string {
  // Replace 'name' with whatever property holds the branch title
  return branches.map(b => b.name).join(', ');
}
  get selectedAgentDesignationName(): string {
  return this.getDesignationName(this.selectedAgentDetail?.designationID);
}

get selectedAgentStaffDesignationName(): string {
  if (!this.selectedAgentDetail?.employeeDesignationID) return '—';
  const found = this.staffDesignations.find(
    d => d.id === this.selectedAgentDetail.employeeDesignationID
  );
  return found?.name ?? '—';
}

get selectedAgentBranchName(): string {
  if (!this.selectedAgentDetail?.branchIDs?.length) return '—';
  return this.selectedAgentDetail.branchIDs
    .map((id: number) => {
      const found = this.branches.find(b => b.branchID === id);
      return found?.branchName ?? '—';
    })
    .join(', ');
}
  // ── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this._loadDropdowns();
    this._buildForm();
     this._buildUpdateDesigForm(); 
    this._loadRoot();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  private _buildForm(): void {
   this.form = this.fb.group({
  searchType:            ['customer'],
  shareClassCode:        [''],
  folioNo:               [''],
  customerNo:            [''],
  roleID:                ['', Validators.required],
   branches:              [[], Validators.required],
  isActive:              [true],
  // introducedByID:        [null, Validators.required],
  introducedByID:        [null],
  designationID:         [null, Validators.required],
  employeeDesignationID: [null],   //  optional — only for Staff/Salaried
  employeeCode:          [''],     //  optional — only for Staff/Salaried
   joiningDate: [null, Validators.required]
});
  }

  // ── Tree loading ───────────────────────────────────────────
private _loadRoot(): void {
  this.loading = true;

  this.agentService
    .getChildren()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res: any[]) => {

        if (!res?.length) {
          this.treeData = [];
          this.filteredTreeData = [];
          this.loading = false;
          return;
        }

        // ✅ Step 1: call designation API for each root child
        const requests = res.map(child =>
          this.agentService.getAgentByIdinChild(child.agentID)
        );

        forkJoin(requests).subscribe({
          next: (detailsArray) => {

            // ✅ Step 2: merge data properly
            const mergedData = res.map((child, index) => {
              const details = detailsArray[index];
              // alert(child);
              // alert(JSON.stringify(details.designationCode ));
              return {
                
                ...child,
                //  Adjust path based on your API response
                designationCode: details?.designationCode ?? '—',
                grade: details?.designationGrade  ?? '—'
              };
            });

            // ✅ Step 3: convert to tree nodes
            const nodes: TreeNode[] = this._toTreeNodes(mergedData);

            // ✅ Step 4: root node
            const root: TreeNode = {
              data: {
                displayName: 'BLM Admin',
                agentCode: 'BLM0000000000',
                roleName: 'Admin',
                isActive: true,
                agentID: null,
                ibnkCustomerNo: '—',
                ibnkShareFolioNum: '—',
              },
              children: nodes,
              leaf: false,
              expanded: true,
            };

            // ✅ Step 5: assign
            this.treeData = [root];
            this.filteredTreeData = [root];
            this.loading = false;
            this.cd.markForCheck();
          },
          error: () => {
            this.loading = false;
          }
        });
      },
      error: () => {
        this.loading = false;
        this.cd.markForCheck();
      }
    });
}
loadChildren(event: { node: any }): void {
  const node = event.node;

  if (node.data.agentID === null) return;
  if (node.children && node.children.length > 0) return;

  node.loading = true;

  this.agentService
    .getChildren(node.data.agentID)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res) => {

        if (!res?.length) {
          node.children = [];
          node.leaf = true;
          node.loading = false;
          return;
        }

        // ✅ Step 1: call designation API for each child
        const requests = res.map(child =>
          this.agentService.getAgentByIdinChild(child.agentID)
        );

        // ✅ Step 2: wait for all responses
        forkJoin(requests).subscribe({
          next: (detailsArray) => {

            // 🔥 Step 3: merge correctly (IMPORTANT FIX HERE)
            const mergedData = res.map((child, index) => {
              const details = detailsArray[index];

              return {
                ...child,
                // ✅ FIX THIS BASED ON YOUR API STRUCTURE
                designationCode: details?.designation?.designationCode ?? '—',
                grade: details?.designation?.grade ?? '—'
              };
            });

            // ✅ Step 4: convert to tree nodes
            node.children = this._toTreeNodes(mergedData);
            node.leaf = false;
            node.loading = false;
            node.expanded = true;

            this.filteredTreeData = [...this.filteredTreeData];
            this.cd.markForCheck();
          },
          error: () => {
            node.loading = false;
          }
        });
      },
      error: () => {
        node.children = [];
        node.leaf = true;
        node.loading = false;
        this.filteredTreeData = [...this.filteredTreeData];
        this.cd.markForCheck();
      },
    });
}

private _toTreeNodes(data: any[]): TreeNode[] {
  return data.map((x) => ({
    data: {
      ...x   // ✅ keep original API values (designationCode, grade, designationID etc.)
    },
    children: [],
    leaf: false,
    expanded: false,
    partialSelected: false
  }));
}

  // ── Search ───────────────────────────────────────────────────────────────
  onSearchInput(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this._runSearch(), 400);
  }

private _runSearch(): void {
  const value = this.globalSearchValue?.trim();

  if (!value) {
    this.filteredTreeData = [...this.treeData];
    return;
  }

  if (value.length < 3) return;

  const upper = value.toUpperCase();

  // ✅ Agent code format: starts with a letter followed by digits
  // Matches: B00001, A00001, AG001, etc.
  const isAgentCode = /^[A-Z]+\d+/.test(upper);

  if (isAgentCode) {
    this._searchByAgentCode(upper);

  } else if (/^\d+$/.test(value)) {
    // Pure digits → customer number
    this._searchByCustomerNo(value);

  } else {
    // Free text → name / role local filter
    this._localFilter(value.toLowerCase());
  }
}

  private _searchByAgentCode(code: string): void {
    this.loading = true;
    this.agentService
      .findByAgentCode(code)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const agent = Array.isArray(res) ? res[0] : res;
          if (!agent) {
            this.filteredTreeData = [];
            this.loading = false;
            this.cd.markForCheck();
            return;
          }
          this._expandPath(agent.agentID);
        },
        error: () => {
          this.filteredTreeData = [];
          this.loading = false;
          this.cd.markForCheck();
        },
      });
  }

  private _searchByCustomerNo(customerNo: string): void {
    this.loading = true;
    this.agentService
      .findByCustomerNo(customerNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const agent = Array.isArray(res) ? res[0] : res;
          if (!agent) {
            this.filteredTreeData = [];
            this.loading = false;
            this.cd.markForCheck();
            return;
          }
          this._expandPath(agent.agentID);
        },
        error: () => {
          this.filteredTreeData = [];
          this.loading = false;
          this.cd.markForCheck();
        },
      });
  }

  private _expandPath(targetID: number): void {
    this.agentService
      .getChildren()
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (root) => {
        this.treeData = this._toTreeNodes(root);
        await this._expandRecursive(this.treeData, targetID);
        this.filteredTreeData = [...this.treeData];
        this.loading = false;
        this.cd.markForCheck();
      });
  }

  private async _expandRecursive(nodes: TreeNode[], targetID: number): Promise<boolean> {
    for (const node of nodes) {
      if (node.data.agentID === targetID) {
        node.expanded = true;
        return true;
      }
      const children = await this.agentService.getChildren(node.data.agentID).toPromise();
      if (children?.length) {
        node.children = this._toTreeNodes(children);
        const found = await this._expandRecursive(node.children, targetID);
        if (found) {
          node.expanded = true;
          return true;
        }
      }
    }
    return false;
  }

  private _localFilter(keyword: string): void {
    this.filteredTreeData = this._filterNodes(this.treeData, keyword);
    this.cd.markForCheck();
  }

  private _filterNodes(nodes: TreeNode[], keyword: string): TreeNode[] {
    return nodes.reduce<TreeNode[]>((acc, node) => {
      const d = node.data;
      const isMatch = [d.displayName, d.agentCode, d.ibnkCustomerNo, d.ibnkShareFolioNum, d.roleName]
        .some((v) => String(v ?? '').toLowerCase().includes(keyword));

      const children = node.children?.length
        ? this._filterNodes(node.children, keyword)
        : [];

      if (isMatch || children.length) {
        acc.push({ ...node, children });
      }
      return acc;
    }, []);
  }

  // ── Dialog helpers ───────────────────────────────────────────────────────
  openAddDialog(node: TreeNode): void {
    this.selectedParent = node;
    this._resetDialog();
    this.dialogVisible = true;
  }

  openAddDialogWithoutParent(): void {
  this.selectedParent = null;
  this._resetDialog();

  // ✅ add null/undefined guard
  this.agentListForParent = this._flattenTree(this.treeData)
    .filter(n =>
      n != null &&                    
      n.designationID !== 1         
    )
    .map(n => n)
    .filter(d => d != null);            
  this.dialogVisible = true;
  this.cd.markForCheck();
}

  closeDialog(): void {
    this.dialogVisible = false;
    this._resetDialog();
  }

  private _resetDialog(): void {
    this.members = [];
    this.noDataMessage = '';
    this.isVisibleRoleBranchDiv = false;
    this.uiloading = false;
   this.form.reset({ searchType: 'customer', isActive: true, introducedByID: null });
  }

  // ── Member search ─────────────────────────────────────────────────────────
  searchMember(): void {
    this.uiloading = true;
    this.noDataMessage = '';
    this.members = [];

    const { searchType, shareClassCode, folioNo, customerNo } = this.form.value;

    if (searchType === 'folio') {
      const scCode = shareClassCode?.trim();
      const folio = Number(folioNo);
      if (!scCode || !folio || isNaN(folio)) {
        this.form.get('shareClassCode')?.markAsTouched();
        this.form.get('folioNo')?.markAsTouched();
        this.uiloading = false;
        return;
      }
      this.agentService
        .findShareHolderByFolio(scCode, folio)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => this._handleMemberResult(res, 'No Shareholder found for given Share Class and Folio Number'),
          error: (err) => this._handleMemberError(err, 'Invalid Share Class or Folio Number'),
        });
    } else {
      const custNo = customerNo?.trim();
      if (!custNo) {
        this.form.get('customerNo')?.markAsTouched();
        this.uiloading = false;
        return;
      }
      this.agentService
        .findShareHolderByCustomer(custNo)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => this._handleMemberResult(res, 'No Shareholder found for given Customer Number'),
          error: (err) => this._handleMemberError(err, 'Invalid Customer Number'),
        });
    }
  }

  private _handleMemberResult(res: any, emptyMsg: string): void {
    if (res) {
      this.members = [res];
      this.isVisibleRoleBranchDiv = true;
    } else {
      this.noDataMessage = emptyMsg;
      this.isVisibleRoleBranchDiv = false;
    }
    this.uiloading = false;
    this.cd.markForCheck();
  }

  private _handleMemberError(err: any, clientMsg: string): void {
    this.noDataMessage = [400, 404].includes(err.status) ? clientMsg : 'Error while fetching data';
    this.isVisibleRoleBranchDiv = false;
    this.uiloading = false;
    this.cd.markForCheck();
  }
  // new change 22-04-2026 
get isStaffRole(): boolean {
  const roleID = this.form.value.roleID;
  const role   = this.roles.find(r => r.roleID === roleID);
  const name   = role?.roleName?.toLowerCase() ?? '';
  return name.includes('staff') || name.includes('salaried');
}
  // ── Save agent ────────────────────────────────────────────────────────────
saveAgent(): void {

  //  console.log('designationID from form:',         this.form.value.designationID);
  // console.log('employeeDesignationID from form:',  this.form.value.employeeDesignationID);
  // console.log('designations list:',               this.designations);
  // console.log('staffDesignations list:',          this.staffDesignations);
  // console.log('Final payload:',                   JSON.stringify(payload, null, 2));
  

  if (!this.members.length) {
    this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Search member first' });
    return;
  }


  //  validation for save agent 

  // ✅ validate Introduced By — only when no parent selected
   // ✅ parent scenarios
  const hasRealParent   = this.selectedParent?.data?.agentID != null;
  const hasStaticParent = this.isStaticRoot;
  const hasIntroducedBy = !!this.form.value.introducedByID;
  console.log(hasStaticParent);
  // ✅ only validate introducedByID when no parent at all
  // if (!hasRealParent && !hasStaticParent && !hasIntroducedBy) {
  //   this.form.get('introducedByID')?.markAsTouched();
  //   this.messageService.add({
  //     severity: 'warn',
  //     summary:  'Validation',
  //     detail:   'Please select Introduced By'
  //   });
  //   return;
  // }
  // if (!this.selectedParent?.data && !this.form.value.introducedByID) {
  //   this.form.get('introducedByID')?.markAsTouched();
  //   this.messageService.add({
  //     severity: 'warn',
  //     summary:  'Validation',
  //     detail:   'Please select Introduced By'
  //   });
  //   return;
  // }

  // ✅ validate Role
  if (!this.form.value.roleID) {
    this.form.get('roleID')?.markAsTouched();
    this.messageService.add({
      severity: 'warn',
      summary:  'Validation',
      detail:   'Please select a Role'
    });
    return;
  }

  //  validate Designation
  if (!this.form.value.designationID) {
    this.form.get('designationID')?.markAsTouched();
    this.messageService.add({
      severity: 'warn',
      summary:  'Validation',
      detail:   'Please select a Designation'
    });
    return;
  }
if (!this.form.value.joiningDate) {
  this.form.get('joiningDate')?.markAsTouched();
  this.messageService.add({
    severity: 'warn',
    summary: 'Validation',
    detail: 'Please select Joining Date'
  });
  return;
}
  //  validate Branch
  if (!this.form.value.branches?.length) {
    this.form.get('branches')?.markAsTouched();
    this.messageService.add({
      severity: 'warn',
      summary:  'Validation',
      detail:   'Please select at least one Branch'
    });
    return;
  }




   this.loading = true;   
  // const { roleID, branches,  introducedByID , designationID ,employeeDesignationID } = this.form.value;
  const { roleID, branches, isActive, introducedByID,
        designationID, employeeDesignationID, employeeCode,joiningDate  } = this.form.value;
  const member = this.members[0];

const payload: any = {
  roleID,
  isActive,
  designationID:         designationID,      
  ibnkShareClassCode:    member.ibnkShareClassCode,
  ibnkShareFolioNum:     Number(member.ibnkShareFolioNum),
  branchIDs:             (branches ?? []).map((x: any) => x.branchID),
   joiningDate: joiningDate 
};
if (hasRealParent) {
  payload.parentAgentID = this.selectedParent!.data.agentID;
} else if (hasIntroducedBy) {
  payload.parentAgentID = Number(this.form.value.introducedByID);
}
// if (!payload.parentAgentID) {
//   this.messageService.add({
//     severity: 'warn',
//     summary: 'Warning',
//     detail: 'Parent Agent is required'
//   });
//   this.loading = false;
//   return;
// }
if (this.isStaffRole) {
  payload.employeeDesignationID = employeeDesignationID; 
  payload.employeeCode          = employeeCode;
}

if (this.selectedParent?.data) {
  payload.parentAgentID = this.selectedParent.data.agentID;
} else if (introducedByID) {
  payload.parentAgentID = introducedByID;
}


  if (this.selectedParent?.data) {
    payload.parentAgentID = this.selectedParent.data.agentID;
  }
  else if (introducedByID) {
  payload.parentAgentID = introducedByID;  // ✅ from form control
}
  //  console.log('Payload:', JSON.stringify(payload, null, 2)); 
  //  alert(JSON.stringify(payload, null, 2));

  this.agentService
    .addAgent(payload)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res: any) => {
         if (this.form.value.isActive && res.data?.agentID) {
      this.agentService.activateAgent(res.data.agentID)
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    }
        if (res.success) {
          this.closeDialog();
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Agent created successfully' });
          this.selectedParent ? this._reloadChildren(this.selectedParent) : this._loadRoot();
        }
        this.loading = false;
      },
      error: (err) => {
        this.closeDialog();

        // ✅ Show actual backend message in toast
        const detail =
          err?.error?.message
          ?? err?.error?.error
          ?? err?.error
          ?? 'Failed to create agent';

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: String(detail)
        });
        this.loading = false;
      },
    });
}

  private _reloadChildren(node: TreeNode): void {
    this.agentService
      .getChildren(node.data.agentID)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        node.children = this._toTreeNodes(res);
        this.cd.markForCheck();
      });
  }

  private _loadDropdowns(): void {
  this.agentService.roles$
    .pipe(takeUntil(this.destroy$))
    .subscribe(res => { this.roles = res; this.cd.markForCheck(); });

  this.agentService.branches$
    .pipe(takeUntil(this.destroy$))
    .subscribe(res => { this.branches = res; this.cd.markForCheck(); });

  // ✅ load designations
this.agentService.getDesignations()
  .pipe(takeUntil(this.destroy$))
  .subscribe(res => {
    // alert(JSON.stringify(res));

    // console.log('Designations raw response:', res);       
    // console.log('First item keys:', Object.keys(res[0] ?? {}));
  //  alert('Designation sample:'+ JSON.stringify(res));
    this.designations = res;
    this.cd.markForCheck();
  });

  //  load staff designations
 this.agentService.getAgentDesignations()
  .pipe(takeUntil(this.destroy$))
  .subscribe(res => {
    // alert(JSON.stringify(res));
    // console.log('Staff Designations raw response:', res);  
    // console.log('First item keys:', Object.keys(res[0] ?? {}));
    this.staffDesignations = [...res];
    this.cd.markForCheck();
  });
}

  // making Pdf 

async downloadPdf(rowData: any): Promise<void> {
  const id = rowData.agentID;

  // Show spinner on that row
  this.pdfLoadingMap[id] = true;
  this.cd.markForCheck();

  try {
    await this.pdfService.downloadAgentReport(rowData);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    this.messageService.add({
      severity: 'error',
      summary: 'PDF Error',
      detail: 'Failed to generate PDF report',
    });
  } finally {
    this.pdfLoadingMap[id] = false;
    this.cd.markForCheck();
  }
}


  // Track loading state per row

toggleStatus(rowData: any): void {
  const id = rowData.agentID;
  this.statusLoadingMap[id] = true;
  this.cd.markForCheck();

  const api$ = rowData.isActive 
    ? this.agentService.deactivateAgent(id)
    : this.agentService.activateAgent(id);

  api$.pipe(takeUntil(this.destroy$)).subscribe({
    next: (res: any) => {
      if (res.success) {
        // ✅ use actual API response value — not a guess
        rowData.isActive  = res.data.isActive;
        this.filteredTreeData = [...this.filteredTreeData];

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: res.message  // "Agent deactivated successfully"
        });
      }
      this.statusLoadingMap[id] = false;
      this.cd.markForCheck();
    },
    error: (err) => {
      const detail =
        err?.error?.message
        ?? err?.error?.title
        ?? 'Failed to update agent status';

      this.messageService.add({
        severity: 'error',
        summary: `Error ${err.status}`,
        detail
      });
      this.statusLoadingMap[id] = false;
      this.cd.markForCheck();
    }
  });
}
// newcode 10/04 
onNodeSelect(event: any) {
  this.selectedNode = event.node;
  this.selectedAgentDetail = event.node.data; // Syncs your existing detail object
}
// end 
// change parent popup 
openChangeParentDialog(rowData: any, node: any): void {
  this.selectedNode = node; // Pass the whole node from the UI action
  // alert('rowData:'+ JSON.stringify(rowData)); alert('agentID:'+ rowData?.agentID);
  this.changeParentVisible  = true;
  this.selectedAgentDetail  = null;
  this.selectedNewParentID  = null;
  this.changeParentLoading  = true;
  this.cd.markForCheck();

  // Fetch full agent details
  this.agentService.getAgentByID(rowData.agentID)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res) => {
        this.selectedAgentDetail ={
  ...rowData,
  ...res
};
        this.changeParentLoading = false;
        this.cd.markForCheck();
        // alert(JSON.stringify(this.selectedAgentDetail));
      },
      error: () => {
        this.changeParentLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load agent details'
        });
        this.cd.markForCheck();
      }
    });

  // Build flat agent list for parent dropdown (exclude self)
  this.agentListForParent = this._flattenTree(this.treeData)
    .filter(a => a.agentID !== rowData.agentID  &&  a.designationID !== 1    );
}

// Flatten tree to a flat array for the dropdown
private _flattenTree(nodes: TreeNode[]): any[] {
  return nodes.reduce<any[]>((acc, node) => {
    acc.push(node.data);
    if (node.children?.length) {
      acc.push(...this._flattenTree(node.children));
    }
    return acc;
  }, []);
}
closeChangeParentDialog(): void {
  this.changeParentVisible  = false;
  this.selectedAgentDetail  = null;
  this.selectedNewParentID  = null;
  this.updateParentLoading  = false;
    this.updateParentFailed   = false;   
}
// helper method 
isDescendant(node: any, targetID: number): boolean {
  if (!node.children || node.children.length === 0) {
    return false;
  }

  for (const child of node.children) {
    // Check if this child is the target
    if (child.data.agentID === targetID) {
      return true;
    }
    // Recursively check this child's children
    if (this.isDescendant(child, targetID)) {
      return true;
    }
  }

  return false;
}
// end helper method 
updateParent(): void {
  const agentToMove = this.selectedAgentDetail;
  const targetParentID = this.selectedNewParentID;

  // 1. Validations
  if (!agentToMove || !targetParentID) {
    this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please select an agent and a new parent' });
    return;
  }

  if (targetParentID === agentToMove.agentID) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Cannot assign agent as its own parent' });
    return;
  }

  // Prevent moving a parent into its own child (Circular Reference)
  if (this.isDescendant(this.selectedNode, targetParentID)) {
    this.messageService.add({
      severity: 'error',
      summary: 'Circular Reference',
      detail: 'Cannot move an agent under one of its own descendants!'
    });
    return;
  }

  // 2. Start Loading State
  this.updateParentLoading = true;
  this.cd.markForCheck();
  // alert(agentToMove.agentID);
  // alert(targetParentID);
  // 3. API Call
  this.agentService
    .updateParent(agentToMove.agentID, targetParentID)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res: any) => {
        // Based on your JSON: res.success is the top-level boolean
        if (res.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: res.message || 'Agent parent updated successfully'
          });
          this.closeChangeParentDialog();
          this._loadRoot(); // Refresh the tree
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Warning',
            detail: res.message ?? 'Update was not successful'
          });
        }

        // Set to false, not true!
        this.updateParentLoading = false;
        this.cd.markForCheck();
      },
      error: (err) => {
        this.updateParentFailed = true;
        this.updateParentLoading = false;
        
        console.error('UpdateParent error:', err);

        const detail =
          err?.name === 'TimeoutError' ? 'Request timed out — server is taking too long.' :
          err?.status === 504 ? 'Server gateway timeout — please try again.' :
          err?.status === 0 ? 'No connection — check your network.' :
          err?.error?.message ?? 'Failed to update parent';

        this.messageService.add({
          severity: 'error',
          summary: `Error ${err.status || ''}`,
          detail
        });

        this.cd.markForCheck();
      }
    });
}
// end parent update 

// get user login 
// ── Permissions ───────────────────────────────────────────────────────
get isAdmin(): boolean {
  return this.authService.isAdmin();
}

get currentUser(): string | null {
  return this.authService.getUsername();
}

// Permission map — add more roles/restrictions here easily
canDo(action: 'changeParent' | 'addAgent' | 'deactivate' | 'pdf'): boolean {
  const user = this.currentUser;

  if (user === 'admin') return true;   //  admin can do everything

  // staffuser restrictions
  if (user === 'staffuser') {
    const restricted = ['changeParent', 'deactivate'];
    return !restricted.includes(action);
  }

  // default — allow basic actions only
  return action === 'pdf';
}
// permission end 

// UploAD FROM eXCEL 

// add to imports at top

// ── Excel state ───────────────────────────────────────────────────────




// ── Trigger file input ────────────────────────────────────────────────


openExcelUpload(): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xlsx,.xls';

  input.onchange = async (e: any) => {
    const file = e.target.files[0];
    if (file) {
      this.loading = true; // START LOADER

      try {
        await this._handleExcelFile(file);
      } catch (err) {
        console.error(err);
      } finally {
        this.loading = false; // STOP LOADER
      }
    }
  };

  input.click();
}
// ── Parse Excel file ──────────────────────────────────────────────────
// ✅ Wrap FileReader in a Promise so await works properly
private _handleExcelFile(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!file) return resolve();
    this.excelFileName = file.name;
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        if (!rows.length) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Empty File',
            detail: 'No data found in the Excel file'
          });
          return resolve();
        }

        this.excelTreeData = this._convertExcelToTree(rows);
        this.excelPreviewVisible = true;
        this.cd.markForCheck();
        resolve();
      } catch (err) {
        this.messageService.add({
          severity: 'error',
          summary: 'Parse Error',
          detail: 'Failed to read Excel file — check format'
        });
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsBinaryString(file);
  });
}
// ── Convert flat Excel rows → TreeNode[] ─────────────────────────────
private _convertExcelToTree(rows: any[]): TreeNode[] {
  // Map rows to a common format
  // Supports both exact column names and flexible variants
  const mapped = rows.map((row, i) => ({
  agentID:              i + 1,
  displayName:          row['Member Name']       ?? '—',
  ibnkCustomerNo:       row['Customer No']       ?? '—',
  ibnkShareClassCode:   row['Share Class Code']  ?? '',
  ibnkShareFolioNum:    row['Folio Number']       ?? 0,
  roleName:             row['Role']              ?? '—',
  employeeCode:         row['Staff Code']        ?? '',
  staffDesignation:     row['Staff Designation'] ?? '',
  designationName:      row['Designation']       ?? '—',
  branchName:           row['Branch']            ?? '—',
  parentCode:           row['Parent Agent Code'] ?? null,
  is_active:            row['Is Active'] === 'Yes',
}));
  // Build tree by parentCode if exists, else flat list
  const hasParent = mapped.some(r => r.parentCode);

  if (hasParent) {
    return this._buildTreeFromParentCode(mapped);
  }

  // Flat list — show as siblings under root
  return mapped.map(r => ({
    data:     r,
    children: [],
    leaf:     true,
    expanded: false,
  }));
}

// ── Build hierarchy from Parent Code column ───────────────────────────
private _buildTreeFromParentCode(rows: any[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();

  // Create all nodes first — spread `r` so each node owns its data
  rows.forEach(r => {
    nodeMap.set(r.agentCode, {
      data:     { ...r },   // ✅ break the shared reference
      children: [],
      leaf:     true,
      expanded: true,
    });
  });

  const roots: TreeNode[] = [];

  // Link parent → child
  rows.forEach(r => {
    const node = nodeMap.get(r.agentCode)!;
    if (r.parentCode && nodeMap.has(r.parentCode)) {
      const parent = nodeMap.get(r.parentCode)!;
      parent.children!.push(node);
      parent.leaf = false;
    } else {
      roots.push(node);
    }
  });

  return roots;
}

closeExcelPreview(): void {
  this.excelPreviewVisible = false;
  this.excelTreeData       = [];
  this.excelFileName       = '';
}
// resolve Excel data 
// ── Resolve Role name → roleID ────────────────────────────────────────
private _resolveRoleID(roleName: string): number | null {
  if (!roleName) return null;
  const found = this.roles.find(r =>
    r.roleName?.toLowerCase() === roleName?.toLowerCase()
  );
  if (!found) console.warn(`Role not found: ${roleName}`);
  return found?.roleID ?? null;
}

// ── Resolve Designation name → designationID ─────────────────────────
private _resolveDesignationID(name: string): number | null {
  if (!name) return null;
  const found = this.designations.find(d =>
    d.name?.toLowerCase() === name?.toLowerCase()  // ✅ use 'name' not 'designationName'
  );
  return found?.id ?? null;   // ✅ use 'id' not 'designation_id'
}

// ── Resolve Staff Designation name → employeeDesignationID ───────────
private _resolveStaffDesignationID(name: string): number | null {
  if (!name) return null;
  const found = this.staffDesignations.find(d =>
    d.name?.toLowerCase() === name?.toLowerCase()  // ✅ use 'name'
  );
  return found?.id ?? null;   // ✅ use 'id'
}

// ── Resolve Branch name → branchID array ─────────────────────────────
private _resolveBranchIDs(branchName: string): number[] {
  if (!branchName) return [];
  const found = this.branches.find(b =>
    b.branchName?.toLowerCase() === branchName?.toLowerCase()
  );
  if (!found) console.warn(`Branch not found: ${branchName}`);
  return found ? [found.branchID] : [];
}

// ── Find agent in loaded tree by Customer No (for parent lookup) ──────
private _findAgentByCustomerNo(customerNo: string): any | null {
  if (!customerNo) return null;
  const flat = this._flattenTree(this.treeData);
  return flat.find(n =>
    String(n.data?.ibnkCustomerNo) === String(customerNo)
  )?.data ?? null;
}
// saveExcelData 
saveExcelData(): void {
  const rows = this._flattenTree(this.excelTreeData);

  if (!rows.length) {
    this.messageService.add({
      severity: 'warn',
      summary:  'Empty',
      detail:   'No data to save'
    });
    return;
  }

  this.excelSaveLoading  = true;
  this.excelSavedCount   = 0;
  this.excelTotalCount   = rows.length;
  this.excelSaveProgress = 0;
  this.excelFailedRows   = [];
  this.cd.markForCheck();

  from(rows).pipe(
    concatMap(node => {
      const d = node.data;

      // ✅ Map Excel columns → API payload
      const payload: any = {
        ibnkShareClassCode:   d.ibnkShareClassCode  ?? '',
        ibnkShareFolioNum:    Number(d.ibnkShareFolioNum) || 0,
        roleID:               this._resolveRoleID(d.roleName),
        designationID:        this._resolveDesignationID(d.designationName),
        employeeDesignationID: this._resolveStaffDesignationID(d.staffDesignation),
        employeeCode:         d.employeeCode        ?? '',
        branchIDs:            this._resolveBranchIDs(d.branchName),
        isActive:             d.is_active           ?? true,
      };

      // ✅ resolve parent from Customer No
      if (d.parentCode) {
        const parentAgent = this._findAgentByCustomerNo(d.parentCode);
        if (parentAgent) {
          payload.parentAgentID = parentAgent.agentID;
        }
      }

      // console.log(`Saving row ${this.excelSavedCount + 1}:`, payload);

      return this.agentService.addAgent(payload).pipe(
        concatMap(res => {
          this.excelSavedCount++;
          this.excelSaveProgress = Math.round(
            (this.excelSavedCount / this.excelTotalCount) * 100
          );
          this.cd.markForCheck();
          return [res];
        }),
        catchError(err => {
          // ✅ log failed row with reason
          this.excelFailedRows.push({
            name:   d.displayName,
            code:   d.ibnkCustomerNo,
            reason: err?.error?.message ?? `Error ${err.status}`
          });
          this.excelSavedCount++;
          this.excelSaveProgress = Math.round(
            (this.excelSavedCount / this.excelTotalCount) * 100
          );
          this.cd.markForCheck();
          return [];  // continue to next row
        })
      );
    }),
    toArray(),
    takeUntil(this.destroy$)
  ).subscribe({
    complete: () => {
      this.excelSaveLoading = false;
      this.cd.markForCheck();

      const failed  = this.excelFailedRows.length;
      const success = this.excelTotalCount - failed;

      if (failed === 0) {
        this.messageService.add({
          severity: 'success',
          summary:  'Success',
          detail:   `All ${success} agents imported successfully`
        });
        this.closeExcelPreview();
        this._loadRoot();

      } else if (success > 0) {
        this.messageService.add({
          severity: 'warn',
          summary:  'Partial Import',
          detail:   `${success} saved, ${failed} failed — check preview for details`
        });
        this._loadRoot();

      } else {
        this.messageService.add({
          severity: 'error',
          summary:  'Import Failed',
          detail:   'All rows failed — check data format'
        });
      }
    }
  });
}

// get static root 
get isStaticRoot(): boolean {
  return this.selectedParent?.data?.agentID === null &&
         this.selectedParent?.data?.agentCode === 'BLM0000000000';
}


// updateAgentDesignation 
// ── Open dialog — prefill with current agent data ───────
openUpdateDesigDialog(rowData: any): void {
  this.selectedAgentForUpdate = rowData;
  this.updateDesigLoading     = true;
  this.updateDesigVisible     = true;
  this.cd.markForCheck();

  

  //  fetch latest agent details to prefill form
  this.agentService.getAgentByID(rowData.agentID)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res) => {
        this.selectedAgentForUpdate = { ...rowData, ...res };

        // ✅ prefill form with current values
        this.updateDesigForm.patchValue({
          roleID:                res.roleID               ?? null,
          designationID:         res.designationID        ?? null,
          employeeDesignationID: res.employeeDesignationID ?? null,
          employeeCode:          res.employeeCode         ?? '',
          joiningDate:           res.joiningDate
                                   ? new Date(res.joiningDate)
                                   : null,
        });

        this.updateDesigLoading = false;
        this.cd.markForCheck();
      },
      error: () => {
        this.updateDesigLoading = false;
        this.messageService.add({
          severity: 'error',
          summary:  'Error',
          detail:   'Failed to load agent details'
        });
        this.cd.markForCheck();
      }
    });
}
// ── Save update ───────────────────────────────────────────────────────
saveUpdateDesig(): void {
  if (this.updateDesigForm.invalid) {
    this.updateDesigForm.markAllAsTouched();
    this.messageService.add({
      severity: 'warn',
      summary:  'Validation',
      detail:   'Please fill all required fields'
    });
    return;
  }

  const { roleID, designationID,
          employeeDesignationID, employeeCode, joiningDate } = this.updateDesigForm.value;

  const payload: any = {
    agentID:               this.selectedAgentForUpdate.agentID,
    roleID:                Number(roleID),
    designationID:         Number(designationID),
    employeeDesignationID: employeeDesignationID ? Number(employeeDesignationID) : null,
    employeeCode:          employeeCode ?? '',
   joiningDate: joiningDate
  ? this.formatLocalDate(joiningDate)
  : null,
  };

  // console.log('Update payload:', JSON.stringify(payload, null, 2));

  this.updateDesigLoading = true;
  this.cd.markForCheck();

  this.agentService.updateAgent(payload)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res: any) => {
        this.messageService.add({
          severity: 'success',
          summary:  'Success',
          detail:   'Agent updated successfully'
        });
        this.closeUpdateDesigDialog();

        // ✅ reload tree to reflect changes
        console.log(res);
        this._loadRoot();
      },
      error: (err) => {
        const detail =
          err?.error?.message
          ?? err?.error?.title
          ?? 'Failed to update agent';
        this.messageService.add({
          severity: 'error',
          summary:  `Error ${err.status}`,
          detail
        });
        this.updateDesigLoading = false;
        this.cd.markForCheck();
      }
    });
}

closeUpdateDesigDialog(): void {
  this.updateDesigVisible     = false;
  this.updateDesigLoading     = false;
  this.selectedAgentForUpdate = null;
  this.updateDesigForm.reset();
}

// agent view dilog 

openAgentDialog(rowData: any): void {
  this.agentDialogVisible = true;
  this.agentLoading = true;
  this.selectedAgentDetailView = null;

  this.agentService.getAgentByID(rowData.agentID).subscribe({
    next: (res) => {
      this.selectedAgentDetail = res;
      this.agentLoading = false;
    },
    error: (err) => {
      console.error('Error fetching agent details', err);
      this.agentLoading = false;
    }
  });
}
// helper function 
formatLocalDate(date: Date): string {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();

  const localDate = new Date(d.getTime() - offset * 60000);

  return localDate.toISOString().split('T')[0];
}

// code for Update mapped branches of member 

// ── Open dialog ───────────────────────────────────────────────────────
openUpdateBranchDialog(rowData: any, node: any): void {
  this.updateBranchVisible    = true;
  this.updateBranchLoading    = true;
  this.selectedAgentForBranch = null;
  this.selectedBranchIDs      = [];
  this.availableBranches      = [];
  this.cd.markForCheck();

  // ✅ fetch agent details to get current branches
  this.agentService.getAgentByID(rowData.agentID)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res) => {
        this.selectedAgentForBranch = { ...rowData, ...res };

        // ✅ prefill current branch selections
        this.selectedBranchIDs = res.branches?.map((b: any) =>
          typeof b === 'number' ? b : b.branchID ?? b.id
        ) ?? [];

        // ✅ get parent node to filter branches
        const parentNode = node?.parent;
        const parentBranchIDs: number[] = parentNode?.data?.branches?.map(
          (b: any) => typeof b === 'number' ? b : b.branchID ?? b.id
        ) ?? [];

        // ✅ filter branches based on parent
        // if parent has no branches — allow all
        if (!parentBranchIDs.length) {
          this.availableBranches = this.branches;
        } else {
          this.availableBranches = this.branches.filter(b =>
            parentBranchIDs.includes(b.branchID)
          );
        }

        this.updateBranchLoading = false;
        this.cd.markForCheck();
      },
      error: () => {
        this.updateBranchLoading = false;
        this.messageService.add({
          severity: 'error',
          summary:  'Error',
          detail:   'Failed to load agent details'
        });
        this.cd.markForCheck();
      }
    });
}

// ── Save updated branches ─────────────────────────────────────────────
saveUpdateBranch(): void {
  if (!this.selectedBranchIDs.length) {
    this.messageService.add({
      severity: 'warn',
      summary:  'Validation',
      detail:   'Please select at least one branch'
    });
    return;
  }

  this.updateBranchSaving = true;
  this.cd.markForCheck();

  const payload = {
    agentID:   this.selectedAgentForBranch.agentID,
    branchIDs: this.selectedBranchIDs
  };

  // console.log('Update branch payload:', JSON.stringify(payload, null, 2));

  this.agentService.updateMappedBranches(payload.agentID, payload.branchIDs)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res: any) => {
        if (res.success) {
          this.messageService.add({
            severity: 'success',
            summary:  'Success',
            detail:   res.message  // "Mapped branches updated successfully"
          });
          this.closeUpdateBranchDialog();
          this._loadRoot();   // ✅ reload tree
        }
        this.updateBranchSaving = false;
        this.cd.markForCheck();
      },
      error: (err) => {
        const detail =
          err?.error?.message
          ?? err?.error?.title
          ?? 'Failed to update branches';
        this.messageService.add({
          severity: 'error',
          summary:  `Error ${err.status}`,
          detail
        });
        this.updateBranchSaving = false;
        this.cd.markForCheck();
      }
    });
}

closeUpdateBranchDialog(): void {
  this.updateBranchVisible    = false;
  this.updateBranchLoading    = false;
  this.updateBranchSaving     = false;
  this.selectedAgentForBranch = null;
  this.selectedBranchIDs      = [];
  this.availableBranches      = [];
}
}