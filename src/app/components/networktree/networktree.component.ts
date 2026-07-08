/* eslint-disable no-useless-escape */
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
import { ExcelReportService } from '../../services/excel-report.service';
import { firstValueFrom } from 'rxjs';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';


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
    DatePickerModule ,
    InputGroupModule,
    InputGroupAddonModule,

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
private readonly excelReportService = inject(ExcelReportService);


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
allEmployeeCodes: string[] = [];
allAgentsFlat: any[] = [];
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
// global search assigning 
// ── Search state ─────
searchLoading  = false;
searchActive   = false;  
// endGlobal search 

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

// excel state
excelReportLoading = false;
excelPreviewData: any[] = [];   // raw Excel rows for saving
excelPreviewLoading = false;
loadingSaveExcel = false;

// ── Map Excel rows to preview TreeNode format ─────────────────────────
private _mapExcelRows(rows: any[]): TreeNode[] {
  return rows.map((row, i) => {

    // ✅ get by exact column name
    const cols  = Object.keys(row);
    const getByIndex = (idx: number) =>
      String(row[cols[idx]] ?? '').trim();

    return {
      data: {
        agentID:           i + 1,
        ibnkCustomerNo:    getByIndex(0),   // Customer Number
        parentCustomerNo:  getByIndex(1),   // Parent Customer Number
        roleName:          getByIndex(2),   // Role(...)
        employeeCode:      getByIndex(3),   // Staff Code(...)
        staffDesigName:    getByIndex(4),   // ' Staff Designation(...)'  ← had leading space
        designationName:   getByIndex(5),   // Designation(...)
        branchName:        getByIndex(6),   // Branch
        joiningDate:       getByIndex(7),   // Joining Date
        is_active:         true,
      },
      children: [],
      leaf:     true,
      expanded: false,
    };
  });
}
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
    this._loadAllAgentsWithDetails();  
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
// private _loadRoot(): void {
//   this.loading = true;

//   this.agentService
//     .getChildren()
//     .pipe(takeUntil(this.destroy$))
//     .subscribe({
//       next: (res: any[]) => {

//         if (!res?.length) {
//           this.treeData = [];
//           this.filteredTreeData = [];
//           this.loading = false;
//           return;
//         }

//         // ✅ Step 1: call designation API for each root child
//         const requests = res.map(child =>
//           this.agentService.getAgentByIdinChild(child.agentID)
//         );
         
//         forkJoin(requests).subscribe({
//           next: (detailsArray) => {

//             // ✅ Step 2: merge data properly
//             const mergedData = res.map((child, index) => {
//               const details = detailsArray[index];
//               // alert(child);
//               // alert(JSON.stringify(details ));
//               return {
                
//                 ...child,
//                 //  Adjust path based on your API response
//                 designationCode: details?.designationCode ?? '—',
//                 grade: details?.designationGrade  ?? '—'
//               };
//             });

//             // ✅ Step 3: convert to tree nodes
//             const nodes: TreeNode[] = this._toTreeNodes(mergedData);

//             // ✅ Step 4: root node
//             const root: TreeNode = {
//               data: {
//                 displayName: 'BLM Admin',
//                 agentCode: 'BLM0000000000',
//                 roleName: 'Admin',
//                 isActive: true,
//                 agentID: null,
//                 ibnkCustomerNo: '—',
//                 ibnkShareFolioNum: '—',
//               },
//               children: nodes,
//               leaf: false,
//               expanded: true,
//             };

//             // ✅ Step 5: assign
//             this.treeData = [root];
//             this.filteredTreeData = [root];
//             this.loading = false;
//             this.cd.markForCheck();
//           },
//           error: () => {
//             this.loading = false;
//           }
//         });
//       },
//       error: () => {
//         this.loading = false;
//         this.cd.markForCheck();
//       }
//     });
// }
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

        const requests = res.map(child =>
          this.agentService.getAgentByIdinChild(child.agentID)
        );
         
        forkJoin(requests).subscribe({
          next: (detailsArray) => {
            const mergedData = res.map((child, index) => {
              const details = detailsArray[index];
              
              // Removed the intrusive alert() statements here
              
              return {
                ...child,
                parentName: 'BLM Admin', // ✅ Roots are introduced by the Admin
                designationCode: details?.designationCode ?? '—',
                grade: details?.designationGrade  ?? '—'
              };
            });

            const nodes: TreeNode[] = this._toTreeNodes(mergedData);

            const root: TreeNode = {
              data: {
                displayName: 'BLM Admin',
                agentCode: 'BLM0000000000',
                roleName: 'Admin',
                isActive: true,
                agentID: null,
                ibnkCustomerNo: '—',
                ibnkShareFolioNum: '—',
                parentName: '—' // ✅ Admin has no parent
              },
              children: nodes,
              leaf: false,
              expanded: true,
            };

            this.treeData = [root];
            this.filteredTreeData = [root];
            this.loading = false;
            this.cd.markForCheck();
          },
          error: () => { /* ... existing error handler ... */ }
        });
      },
      error: () => { /* ... existing error handler ... */ }
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
          // Trigger reference change to let PrimeNG recognize completion
          this.filteredTreeData = [...this.filteredTreeData];
          this.cd.markForCheck();
          return;
        }

        // Step 1: Map child elements to designation details
        const requests = res.map(child =>
          this.agentService.getAgentByIdinChild(child.agentID)
        );
         const parentDisplayName = node.data.displayName || '—';
         forkJoin(requests).subscribe({
  next: (detailsArray) => {
    const mergedData = res.map((child, index) => {
      const details = detailsArray[index];
      return {
        ...child,
        // No need to inject parentName here anymore, _toTreeNodes handles it!
        designationCode: details?.designation?.designationCode ?? '—',
        grade: details?.designation?.grade ?? '—'
      };
    });

    // ✅ Pass the parentDisplayName into the converter
    node.children = this._toTreeNodes(mergedData, parentDisplayName);
    node.leaf = false;
    node.loading = false;
    node.expanded = true;

    this.filteredTreeData = [...this.filteredTreeData];
    this.cd.markForCheck();
  },
        // Step 2: Handle forkJoin safely
        // forkJoin(requests).subscribe({
        //   next: (detailsArray) => {
        //     const mergedData = res.map((child, index) => {
        //       const details = detailsArray[index];
        //       return {
        //         ...child,
        //         designationCode: details?.designation?.designationCode ?? '—',
        //         grade: details?.designation?.grade ?? '—'
        //       };
        //     });

        //     // Step 3: Assign children nodes directly onto the reference node
        //     node.children = this._toTreeNodes(mergedData);
        //     node.leaf = false;
        //     node.loading = false;
        //     node.expanded = true;

        //     // CRITICAL FIX: Destructure the whole array cleanly to refresh PrimeNG state tracking
        //     this.filteredTreeData = [...this.filteredTreeData];
        //     this.cd.markForCheck();
        //   },
          error: () => {
            node.loading = false;
            this.filteredTreeData = [...this.filteredTreeData];
            this.cd.markForCheck();
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

// private _toTreeNodes(data: any[]): TreeNode[] {
//   return data.map((x) => ({
//     data: {
//       ...x   //  keep original API values (designationCode, grade, designationID etc.)
//     },
//     children: [],
//     leaf: false,
//     expanded: false,
//     partialSelected: false
//   }));
// }
private _toTreeNodes(data: any[], parentName?: string): TreeNode[] {
  return data.map((x) => {
    // 1. If x already has a parentName (like 'BLM Admin' from our manual map), use it.
    // 2. Otherwise, use the passed parentName from the parameter.
    // 3. Fallback to '—' if neither exists.
    const resolvedParentName = x.parentName || parentName || '—';

    return {
      data: {
        ...x,   // keep original API values
        parentName: resolvedParentName // ✅ Automatically inject parent name
      },
      // If the API ever returns nested children directly, trickle the current display name down
      children: x.children?.length ? this._toTreeNodes(x.children, x.displayName) : [],
      leaf: false,
      expanded: false,
      partialSelected: false
    };
  });
}
  // ── Search ───────────────────────────────────────────────────────────────
 // ── Search button click ───────────────────────────────────────────────
searchAgents(): void {
  const value = this.globalSearchValue?.trim();

  if (!value) {
    this.clearSearch();
    return;
  }

  if (value.length < 2) {
    this.messageService.add({
      severity: 'warn',
      summary:  'Search',
      detail:   'Enter at least 2 characters to search'
    });
    return;
  }

  this.searchLoading = true;
  this.searchActive  = true;
  this.cd.markForCheck();

  // ✅ ensure all agents loaded before searching
  if (!this.allAgentsFlat?.length) {
    this._loadAllAgentsWithDetails().then(() => {
      this._doSearch(value);
    });
  } else {
    this._doSearch(value);
  }
}

// ── Actual search logic ───────────────────────────────────────────────
private _doSearch(value: string): void {
  const lower = value.toLowerCase();
  const upper = value.toUpperCase();

  // ✅ search across ALL agents — exclude static BLM Admin root
  const matched = this.allAgentsFlat.filter(agent => {
    if (!agent) return false;

    // ✅ skip static BLM Admin root
    if (agent.agentID === null || agent.agentCode === 'BLM0000000000') return false;

    return (
      String(agent.agentCode       ?? '').toUpperCase().includes(upper) ||
      String(agent.ibnkCustomerNo  ?? '').toLowerCase().includes(lower) ||
      String(agent.displayName     ?? '').toLowerCase().includes(lower) ||
      String(agent.roleName        ?? '').toLowerCase().includes(lower) ||
      String(agent.designationName ?? '').toLowerCase().includes(lower) ||
      String(agent.employeeCode    ?? '').toLowerCase().includes(lower)
    );
  });

  if (!matched.length) {
    this.filteredTreeData = [];
    this.searchLoading    = false;
    this.messageService.add({
      severity: 'info',
      summary:  'No Results',
      detail:   `No agents found for "${value}"`
    });
    this.cd.markForCheck();
    return;
  }

  // ✅ wrap results under static BLM Admin root
  const blmRoot: TreeNode = {
    data: {
      displayName:       'BLM Admin',
      agentCode:         'BLM0000000000',
      roleName:          'Admin',
      is_active:         true,
      agentID:           null,
      ibnkCustomerNo:    '—',
      ibnkShareFolioNum: '—',
    },
    children: matched.map(agent => ({
      data:     agent,
      children: [],
      leaf:     false,
      expanded: false,
    })),
    leaf:     false,
    expanded: true,    // ✅ auto expand to show results
  };

  this.filteredTreeData = [blmRoot];
  this.searchLoading    = false;
  this.messageService.add({
    severity: 'success',
    summary:  'Search Results',
    detail:   `Found ${matched.length} agent(s)`
  });
  this.cd.markForCheck();
}

// ── Clear search — restore full tree ─────────────────────────────────
clearSearchGlobal(): void {
  this.globalSearchValue = '';
  this.searchActive      = false;
  this.searchLoading     = false;
  this.filteredTreeData  = [...this.treeData];   // restore original tree
  this.cd.markForCheck();
}
  // new global search 

  // 1. Change the trigger to a explicit click handler
onSearchClick(): void {
  const value = this.globalSearchValue?.trim();

  if (!value) {
    this.filteredTreeData = [...this.treeData];
    return;
  }

  this.loading = true;
  this.cd.markForCheck();

  const upperValue = value.toUpperCase();
  
  // Clean leading zeros for numerical comparison consistency
  const cleanSearchValue = upperValue.replace(/^0+/, '');

  // Scan the flat array with loose/flexible normalization rules
  const targetAgent = this.allAgentsFlat.find(agent => {
    const agentCode = String(agent?.agentCode || '').toUpperCase();
    
    // Check all possible database property variations for customer numbers
    const agentCustNo = String(agent?.ibnkCustomerNo || agent?.customerNo || agent?.customerNumber || '');
    const cleanAgentCustNo = agentCustNo.replace(/^0+/, '');

    return agentCode === upperValue || (cleanAgentCustNo && cleanAgentCustNo === cleanSearchValue);
  });

  if (!targetAgent) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Not Found',
      detail: `No agent found matching code or customer number: "${value}"`
    });
    this.filteredTreeData = [];
    this.loading = false;
    this.cd.markForCheck();
    return;
  }

  // Expand the lazy tree down to the matched node ID
  this._expandPathToAgent(targetAgent.agentID);
}
// 3. Clear search filter back to standard root lookups
clearSearch(): void {
  this.globalSearchValue = '';
  this.filteredTreeData = [...this.treeData];
  this.cd.markForCheck();
}

// 4. Secure recursive lazy-expander targeting the matched agent ID
private _expandPathToAgent(targetID: number): void {
  this.agentService
    .getChildren()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: async (rootNodes) => {
        this.treeData = this._toTreeNodes(rootNodes);
        
        // Asynchronously descend down through lazy-loaded nodes to find target
        const found = await this._expandRecursive(this.treeData, targetID);
        
        if (!found) {
          this.messageService.add({
            severity: 'info',
            summary: 'Notice',
            detail: 'Agent exists but path layout could not be verified.'
          });
        }

        this.filteredTreeData = [...this.treeData];
        this.loading = false;
        this.cd.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cd.markForCheck();
      }
    });
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

  //  add null/undefined guard
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
  // staffduplicatechackmethod1105
// ── Check staff code duplicate in loaded tree ─────────────────────────
private _isStaffCodeDuplicate(
  code: string,
  excludeAgentID?: number
): boolean {
  if (!code?.trim()) return false;
  if (!this.allAgentsFlat?.length) return false;

  return this.allAgentsFlat.some(agent => {
    if (!agent?.employeeCode) return false;

    // ✅ exclude self when editing
    if (excludeAgentID && agent.agentID === excludeAgentID) return false;

    return agent.employeeCode.trim().toLowerCase()
        === code.trim().toLowerCase();
  });
}
  // new change 22-04-2026 
get isStaffRole(): boolean {

  const roleID = this.form.get('roleID')?.value;

  if (!roleID || !this.roles?.length) {
    return false;
  }

  const role = this.roles.find(r => r.roleID == roleID);

  const name = (role?.roleName || '').toLowerCase();

  return name.includes('staff');
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
// ✅ validate staff code duplicate
if (this.isStaffRole) {
  // alert("HaiiValidate")
  this.form.get('employeeCode')?.setValidators([Validators.required]);
} else {
  this.form.get('employeeCode')?.clearValidators();
}

this.form.get('employeeCode')?.updateValueAndValidity();
if (this.isStaffRole) {

  const empCode = this.form.value.employeeCode?.trim();

  if (!empCode) {

    this.form.get('employeeCode')?.markAsTouched();

    this.messageService.add({
      severity: 'warn',
      summary: 'Validation',
      detail: 'Employee Code is required for Staff role'
    });

    return;
  }

  if (this._isStaffCodeDuplicate(empCode)) {
    // alert("Duplicatecode");

    this.form.get('employeeCode')?.setErrors({
      ...(this.form.get('employeeCode')?.errors || {}),
      duplicate: true
    });

    this.messageService.add({
      severity: 'warn',
      summary: 'Duplicate Staff Code',
      detail: `Staff code "${empCode}" already exists`
    });

    return;
  }
}

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
      // alert(`Row ${this.excelSavedCount + 1} payload: ` + JSON.stringify(payload));
   
  //  alert(JSON.stringify(payload, null, 2));

  this.agentService
  .addAgent(payload)
  .pipe(takeUntil(this.destroy$))
  .subscribe({
    next: (res: any) => {
      console.log('Create response:', res);  //  check in production

      if (res.success) {
        // ✅ activate only if isActive toggle is true
        if (this.form.value.isActive && res.data?.agentID) {
          this.agentService.activateAgent(res.data.agentID)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next:  (r) => console.log('Activate response:', r),
              error: (e) => console.warn('Activate failed:', e)
            });
        }

        this.closeDialog();
        this.messageService.add({
          severity: 'success',
          summary:  'Success',
          detail:   'Agent created successfully'
        });
        this.selectedParent
          ? this._reloadChildren(this.selectedParent)
          : this._loadRoot();
        this._loadAllAgentsWithDetails();

      } else {
        // ✅ API returned 200 but success = false
        console.warn('res.success is false:', res);
        this.messageService.add({
          severity: 'warn',
          summary:  'Warning',
          detail:   res?.message ?? 'Agent not created'
        });
      }
      this.loading = false;
    },
    error: (err) => {
  console.error('Create agent error:', err.status, err.error);

  // ✅ specific 504 message
  const detail =
    err.status === 504
      ? 'Server is taking too long to respond — please try again'
      : err?.error?.message
        ?? err?.error?.error
        ?? err?.error
        ?? 'Failed to create agent';

  this.messageService.add({
    severity: 'error',
    summary:  `Error ${err.status}`,
    detail:   String(detail)
  });
  this.loading = false;
}
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
  this.selectedNode = node; 
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
        this.selectedAgentDetail = {
          ...rowData,
          ...res,
          agentID: rowData.agentID 
        };
        this.changeParentLoading = false;
        this.cd.markForCheck();
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

  // Extract the actual underlying PrimeNG TreeNode
  const actualTreeNode = node?.node ? node.node : node;

  //  OPTIMIZATION: Linear Flatten & Filter in a SINGLE step
  // Pass the target rowData to exclude both the agent and its descendants automatically
  this.agentListForParent = this._flattenAndFilterTree(this.treeData, rowData.agentID, actualTreeNode);
}

/**
 * High-Performance Iterative Flattening & Filtering
 * Runs in O(N) linear time and uses an iterative stack to prevent stack overflows on deep trees.
 */
private _flattenAndFilterTree(nodes: TreeNode[], currentAgentID: number, currentRowNode: any): any[] {
  
  const result: any[] = [];
  if (!nodes || nodes.length === 0) return result;

  // Use a fast array-based stack for iterative DFS traversal
  const stack: TreeNode[] = [...nodes];

  while (stack.length > 0) {
    const node = stack.pop()!;
    const data = node.data;

    if (data) {
      // 1. Handle Static Root Check: If it's BLM Admin (agentID is null/undefined), assign it a safe value like 0 or handle explicitly
      const isStaticRoot = (data.agentID === null || data.agentID === undefined) && data.agentCode === 'BLM0000000000';
      const normalizedAgentID = isStaticRoot ? 0 : data.agentID;

      // 2. Optimized Filter Rules applied inline during traversal:
      if (
        normalizedAgentID !== currentAgentID &&          // Exclude self
        data.designationID !== 1 &&                     // Exclude Restricted Designation
        !this.isDescendant(currentRowNode, data.agentID) // Exclude descendants to prevent circular loops
      ) {
        // Map data safely for dropdown compatibility
        result.push({
          ...data,
          agentID: normalizedAgentID // Ensures the dropdown passes 0 for BLM Admin instead of breaking on null
        });
      }
    }

    // Push children onto stack for traversal (if any exist)
    if (node.children && node.children.length > 0) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push(node.children[i]);
      }
    }
  }

  return result;
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
  const agentID = this.selectedAgentDetail?.agentID
               ?? this.selectedNode?.node?.data?.agentID;
  const targetParentID = this.selectedNewParentID;

  const numericAgentID        = (agentID !== null && agentID !== undefined)
                                  ? Number(agentID) : null;
  const numericTargetParentID = (targetParentID !== null && targetParentID !== undefined)
                                  ? Number(targetParentID) : null;

  // ✅ Fixed validation — allow 0 (BLM Admin root)
  if (numericAgentID === null || numericAgentID === undefined) {
    this.messageService.add({
      severity: 'warn',
      summary:  'Validation Warning',
      detail:   'Please select a valid agent'
    });
    return;
  }

  // ✅ allow 0 as valid parent (BLM Admin) — only block undefined/null
  if (numericTargetParentID === null || numericTargetParentID === undefined) {
    this.messageService.add({
      severity: 'warn',
      summary:  'Validation Warning',
      detail:   'Please select a new parent'
    });
    return;
  }

  if (numericTargetParentID === numericAgentID) {
    this.messageService.add({
      severity: 'error',
      summary:  'Validation Error',
      detail:   'Cannot assign an agent as its own parent'
    });
    return;
  }

  // circular reference check — skip for BLM Admin (0)
  if (numericTargetParentID !== 0) {
    const actualTreeNode = this.selectedNode?.node
                         ? this.selectedNode.node
                         : this.selectedNode;
    if (this.isDescendant(actualTreeNode, numericTargetParentID)) {
      this.messageService.add({
        severity: 'error',
        summary:  'Circular Reference',
        detail:   'Cannot move an agent under one of its own descendants!'
      });
      return;
    }
  }

  this.updateParentLoading = true;
  this.updateParentFailed  = false;
  this.cd.markForCheck();

  // ✅ Key logic:
  // numericTargetParentID === 0  → BLM Admin → send null to DB (root level)
  // numericTargetParentID > 0    → real agent → send actual ID
  const finalParentIDPayload = numericTargetParentID === 0
    ? null
    : numericTargetParentID;

  console.log('agentID:', numericAgentID);
  console.log('newParentID:', finalParentIDPayload, '(0 means root)');

  this.agentService
    .updateParent(numericAgentID, finalParentIDPayload as any)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res: any) => {
        if (res && res.success && res.data?.success === true) {
          this.messageService.add({
            severity: 'success',
            summary:  'Success',
            detail:   res.message || 'Agent parent updated successfully'
          });
          this.closeChangeParentDialog();
          this.selectedNode        = null;
          this.selectedAgentDetail = null;
          this._loadRoot();

        } else {
          this.updateParentFailed = true;
          this.messageService.add({
            severity: 'error',
            summary:  'Update Failed',
            detail:   res?.message ?? res?.data?.message
                   ?? 'Database rejected the parent modification.'
          });
        }
        this.updateParentLoading = false;
        this.cd.markForCheck();
      },
      error: (err) => {
        this.updateParentFailed  = true;
        this.updateParentLoading = false;
        console.error('UpdateParent error:', err);

        const errorDetail =
          err?.name === 'TimeoutError'
            ? 'Request timed out — server is taking too long.' :
          err?.status === 400
            ? 'Bad Request — server rejected the parent ID.' :
          err?.status === 504
            ? 'Gateway Timeout — check server connection.' :
          err?.error?.message ?? err?.message
            ?? 'An unknown error occurred.';

        this.messageService.add({
          severity: 'error',
          summary:  `Error ${err.status || ''}`,
          detail:   String(errorDetail)
        });
        this.cd.markForCheck();
      }
    });
}
// end parent update 

// get user login 
// ── Permissions ────
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

// ── Excel state ────




// ── Trigger file input ────


openExcelUpload(): void {
  this.excelPreviewLoading = true;
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
  this.excelPreviewLoading = false;

}
// ── Parse Excel file ──────────────────────────────────────────────────
// ✅ Wrap FileReader in a Promise so await works properly
private _handleExcelFile(file: File): void {
  if (!file) return;

  this.excelFileName = file.name;
  const reader = new FileReader();

  reader.onload = (e: any) => {
    try {
      const workbook  = XLSX.read(e.target.result, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet     = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, {
  raw: false,
  defval: ''
});

      if (!rows.length) {
        this.messageService.add({
          severity: 'warn',
          summary:  'Empty File',
          detail:   'No data found in the Excel file'
        });
        return;
      }

      // ✅ validate required columns exist
      const firstRow = rows[0];
      const hasCustomerNo = Object.keys(firstRow).some(k =>
        k.toLowerCase().includes('customer number')
      );

      if (!hasCustomerNo) {
        this.messageService.add({
          severity: 'error',
          summary:  'Invalid Format',
          detail:   'Excel format is incorrect — please use the standard template'
        });
        return;
      }

      this.excelPreviewData  = rows;              // raw rows
      this.excelTreeData     = this._mapExcelRows(rows);
      this.excelTotalCount   = rows.length;
      this.excelPreviewVisible = true;
      this.cd.markForCheck();

    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary:  'Parse Error',
        detail:   'Failed to read Excel file — check format'+err,
       
      });
    }
  };

  reader.readAsBinaryString(file);
}
// ── Convert flat Excel rows → TreeNode[] ─────────────────────────────
// private _convertExcelToTree(rows: any[]): TreeNode[] {

//   const mapped = rows.map((row, i) => ({
//   agentID:              i + 1,
//   displayName:          row['Member Name']       ?? '—',
//   ibnkCustomerNo:       row['Customer No']       ?? '—',
//   ibnkShareClassCode:   row['Share Class Code']  ?? '',
//   ibnkShareFolioNum:    row['Folio Number']       ?? 0,
//   roleName:             row['Role']              ?? '—',
//   employeeCode:         row['Staff Code']        ?? '',
//   staffDesignation:     row['Staff Designation'] ?? '',
//   designationName:      row['Designation']       ?? '—',
//   branchName:           row['Branch']            ?? '—',
//   parentCode:           row['Parent Agent Code'] ?? null,
//   is_active:            row['Is Active'] === 'Yes',
// }));
//   const hasParent = mapped.some(r => r.parentCode);

//   if (hasParent) {
//     return this._buildTreeFromParentCode(mapped);
//   }
//   return mapped.map(r => ({
//     data:     r,
//     children: [],
//     leaf:     true,
//     expanded: false,
//   }));
// }

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
  this.loadingSaveExcel = true;
  if (!this.excelPreviewData.length) {
    this.messageService.add({
      severity: 'warn',
      summary:  'Empty',
      detail:   'No data to save'
    });
    return;
  }

  this.excelSaveLoading  = true;
  this.excelSavedCount   = 0;
  this.excelTotalCount   = this.excelPreviewData.length;
  this.excelSaveProgress = 0;
  this.excelFailedRows   = [];
  this.cd.markForCheck();

  from(this.excelPreviewData).pipe(
    concatMap(row => {

      // ✅ index-based column access — avoids keyword mismatch
      const cols         = Object.keys(row);
      const getByIndex   = (idx: number) => String(row[cols[idx]] ?? '').trim();

      const customerNo = String(getByIndex(0) || '')
  .trim()
  .padStart(11, '0');
      const parentCustNo = String(getByIndex(1) || '')
  .trim()
  .padStart(11, '0');
      const roleName        = getByIndex(2);  // Role
      const staffCode       = getByIndex(3);  // Staff Code
      const staffDesigName  = getByIndex(4);  // Staff Designation
      const designationName = getByIndex(5);  // Designation
      const branchName      = getByIndex(6);  // Branch
      const joiningDateRaw  = getByIndex(7);  // Joining Date

      // ✅ debug — remove after confirmed
      console.log('--- Row ---');
      console.log('customerNo:', customerNo);
      console.log('designationName:', JSON.stringify(designationName));
      console.log('staffDesigName:', JSON.stringify(staffDesigName));
      console.log('designations:', this.designations.map(d => d.name));
      console.log('staffDesignations:', this.staffDesignations.map(d => d.name));

      // ── Validate required ────────────────────────────────────────
      if (!customerNo) {
        this.excelFailedRows.push({
          name:   `Row ${this.excelSavedCount + 1}`,
          reason: 'Customer Number is required'
        });
        this._incrementProgress();
        console.log("customerNo");
        return [];

      }

      // ── Resolve Role ─────────────────────────────────────────────
      const role = this.roles.find(r =>
        r.roleName?.trim().toLowerCase() === roleName?.trim().toLowerCase()
      );
      if (!role) {
        this.excelFailedRows.push({
          name:   customerNo,
          reason: `Invalid Role: "${roleName}"`
        });
        this._incrementProgress();
        console.log("Role");

        return [];
      }

      // ── Resolve Designation — exact + fallback includes ──────────
      const desig =
        this.designations.find(d =>
          d.name?.trim().toLowerCase() === designationName?.trim().toLowerCase()
        ) ??
        this.designations.find(d =>
          d.name?.trim().toLowerCase().includes(designationName?.trim().toLowerCase()) ||
          designationName?.trim().toLowerCase().includes(d.name?.trim().toLowerCase())
        );

      if (!desig) {
        this.excelFailedRows.push({
          name:   customerNo,
          reason: `Designation "${designationName}" not found`
        });
        this._incrementProgress();
        console.log("Desig");

        return [];
      }

      // ── Resolve Staff Designation — exact + fallback ─────────────
      const staffDesig =
        this.staffDesignations.find(d =>
          d.name?.trim().toLowerCase() === staffDesigName?.trim().toLowerCase()
        ) ??
        this.staffDesignations.find(d =>
          d.name?.trim().toLowerCase().includes(staffDesigName?.trim().toLowerCase()) ||
          staffDesigName?.trim().toLowerCase().includes(d.name?.trim().toLowerCase())
        );

      // ── Resolve Branch ───────────────────────────────────────────
      const branch = this.branches.find(b =>
        b.branchName?.trim().toLowerCase() === branchName?.trim().toLowerCase()
      );

      // ── Resolve Parent Agent ─────────────────────────────────────
      const parentAgent = parentCustNo
        ? this.allAgentsFlat.find(a =>
            String(a.ibnkCustomerNo).trim() === String(parentCustNo).trim()
          )
        : null;

      // ── Is Staff role ────────────────────────────────────────────
      const isStaff = role.roleName?.toLowerCase().includes('staff') ||
                      role.roleName?.toLowerCase().includes('salaried');

      // ── Staff code duplicate check ────────────────────────────────
      if (isStaff && staffCode && this._isStaffCodeDuplicate(staffCode)) {
        this.excelFailedRows.push({
          name:   customerNo,
          reason: `Duplicate Staff Code: "${staffCode}"`
        });
        console.log("staffCode");

        this._incrementProgress();
        return [];
      }
   
      // ── Fetch shareholder to get ShareClass + Folio ──────────────
      return this.agentService.findShareHolderByCustomer(customerNo).pipe(
      
        concatMap(shareholder => {
          // alert("Shareholder");

          if (!shareholder) {
            this.excelFailedRows.push({
              name:   customerNo,
              reason: `Customer "${customerNo}" not found in shareholders`
            });
            this._incrementProgress();
            //  alert("not found in shareholders");

            return [];
          }

          // ── Build payload ────────────────────────────────────────
          const payload: any = {
            roleID:             role.roleID,
            designationID:      desig.id,
            isActive:           true,
            ibnkShareClassCode: shareholder.ibnkShareClassCode,  // ✅ from shareholder
            ibnkShareFolioNum:  Number(shareholder.ibnkShareFolioNum), // ✅ from shareholder
            branchIDs:          branch ? [branch.branchID] : [],
          };

          // staff fields
          if (isStaff) {
            payload.employeeCode          = staffCode       || '';
            payload.employeeDesignationID = staffDesig?.id  ?? null;
          }

          // joining date
          const parsedDate = this._parseExcelDate(joiningDateRaw);
          if (parsedDate) {
  const d = new Date(parsedDate);
  payload.joiningDate = !isNaN(d.getTime()) ? d.toISOString() : null;
}

          // parent
          if (parentAgent?.agentID) {
            payload.parentAgentID = parentAgent.agentID;
          }

          console.log('Final payload:', JSON.stringify(payload, null, 2));
          // alert(`Row ${this.excelSavedCount + 1} payload: ` + JSON.stringify(payload));
          // ── Call Create API ──────────────────────────────────────
          return this.agentService.addAgent(payload).pipe(
            concatMap(res => {
              // ✅ add to flat list for next row's parent lookup
              if (res?.data?.agentID) {
                
                this.allAgentsFlat.push({
                  agentID:        res.data.agentID,
                  ibnkCustomerNo: customerNo,
                  employeeCode:   staffCode,
                });
              }
              this._incrementProgress();
              // alert(res+"Result");
              return [res];
            }),
            
            catchError(err => {
              this.excelFailedRows.push({
                name:   customerNo,
                reason: err?.error?.message ?? `Error ${err.status}`
              });
              this._incrementProgress();
              // alert(err.status);

              return [];
            })
          );
        }),
        catchError(err => {
          this.excelFailedRows.push({
            name:   customerNo,
            reason: err?.error?.message ?? 'Failed to find shareholder'
          });
          this._incrementProgress();
              // alert("Failed to find shareholder");

          return [];
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
      //  alert(success);
      if (failed === 0) {
        this.messageService.add({
          severity: 'success',
          summary:  'Success',
          detail:   `All ${success} agents imported successfully`
        });
        this.closeExcelPreview();
        this._loadRoot();
        this._loadAllAgentsWithDetails();

      } else if (success > 0) {
        this.messageService.add({
          severity: 'warn',
          summary:  'Partial Import',
          detail:   `${success} saved, ${failed} failed`
        });
        this._loadRoot();
        this._loadAllAgentsWithDetails();

      } else {
    
  const uniqueErrors = [...new Set(this.excelFailedRows.map(row => row.reason))];
  const errorDetail = uniqueErrors.length > 0 
    ? `Failures: ${uniqueErrors.join(', ')}` 
    : 'All rows failed — check data and try again';

  this.messageService.add({
    severity: 'error',
    summary: 'Import Failed',
    detail: errorDetail,
    life: 5000 
  });

  // Optional: If you want to show a toast for EVERY failed row (careful with many rows!)
  /*
  this.excelFailedRows.forEach(err => {
    this.messageService.add({
      severity: 'error',
      summary: `Row Error: ${err.name}`,
      detail: err.reason
    });
  });
  */

        // this.messageService.add({
        //   severity: 'error',
        //   summary:  'Import Failed',
        //   detail:   'All rows failed — check data and try again'
        // });
      }
    }
  });
  this.loadingSaveExcel = false;
}


// ── Helper — increment progress ───────────────────────────────────────
private _incrementProgress(): void {
  this.excelSavedCount++;
  this.excelSaveProgress = Math.round(
    (this.excelSavedCount / this.excelTotalCount) * 100
  );
  this.cd.markForCheck();
}

// ── Helper — parse Excel date ─────────────────────────────────────────
private _parseExcelDate(raw: string): string | null {
  if (!raw) return null;
  try {
    let d: Date;
    if (!isNaN(Number(raw))) {
      // Excel serial number
      const excelEpoch = new Date(1899, 11, 30);
      d = new Date(excelEpoch.getTime() + Number(raw) * 86400000);
    } else {
      const parts = raw.split(/[\/\-\.]/);
      if (parts.length === 3 && parts[0].length === 2) {
        d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);  // DD/MM/YYYY
      } else {
        d = new Date(raw);
      }
    }
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  } catch {
    return null;
  }


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

  // 1. Fetch target agent details to prefill current branches
  this.agentService.getAgentByID(rowData.agentID)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: async (res) => {
        this.selectedAgentForBranch = { ...rowData, ...res };

        // Safe extraction of the targeted agent's current branches
        const targetBranches = res?.branches || res?.branchIDs || rowData?.branches;
        this.selectedBranchIDs = Array.isArray(targetBranches)
          ? targetBranches.map((b: any) => typeof b === 'number' ? b : (b?.branchID ?? b?.id))
          : [];

        // 2. Identify Parent Scope safely
        const parentNode = node?.parent;
        const parentData = parentNode?.data;
        
        // Define if the parent is our static top-level BLM Admin anchor
        const isParentStaticRoot = !parentNode || (parentData && 
          (parentData.agentID === null || parentData.agentID === undefined) && 
          parentData.agentCode === 'BLM0000000000');

        let parentBranchIDs: number[] = [];

        // If the parent is a real agent node, let's establish its active boundaries
        if (parentData && !isParentStaticRoot) {
          let rawParentBranches = parentData.branches || parentData.branchIDs;

          // ⚡ THE FIX: If the parent data in the UI doesn't have branch records, 
          // fetch its comprehensive profile directly from the API service
          if (!rawParentBranches || (Array.isArray(rawParentBranches) && rawParentBranches.length === 0)) {
            try {
              const fullParentDetails = await firstValueFrom(
                this.agentService.getAgentByID(parentData.agentID)
              );
              rawParentBranches = fullParentDetails?.branches || fullParentDetails?.branchIDs;
            } catch (apiErr) {
              console.warn(`Could not fetch actual data parameters for parent agent ID ${parentData.agentID}:`, apiErr);
            }
          }

          if (Array.isArray(rawParentBranches)) {
            parentBranchIDs = rawParentBranches.map((b: any) => 
              typeof b === 'number' ? b : (b?.branchID ?? b?.id)
            ).filter(id => id !== undefined && id !== null);
          }
        }

        // 3. Apply parental boundary matching to compute available branches
        if (isParentStaticRoot || !parentBranchIDs.length) {
          // Fall back to showing all global system branches if parent is root 
          // or if the parent has no explicit mapping restrictions found
          this.availableBranches = [...this.branches];
        } else {
          // Strict filtering criteria based on the verified parent layout limits
          this.availableBranches = this.branches.filter(b =>
            parentBranchIDs.includes(b.branchID)
          );
        }

        this.updateBranchLoading = false;
        this.cd.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load agent layout context:', err);
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

// create excel report 
// method
async downloadExcelReport(): Promise<void> {
  this.excelReportLoading = true;
  this.cd.markForCheck();

  try {
    await this.excelReportService.downloadAgentExcel();
    this.messageService.add({
      severity: 'success',
      summary:  'Downloaded',
      detail:   'Excel report downloaded successfully'
    });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    this.messageService.add({
      severity: 'error',
      summary:  'Error',
      detail:   'Failed to generate Excel report'
    });
  } finally {
    this.excelReportLoading = false;
    this.cd.markForCheck();
  }
}

// emplloyeeCodevalidationforDuplication
// ── Blur check for Add Agent form ─────────────────────────────────────
onEmpCodeBlur(): void {

  const control = this.form.get('employeeCode');

  const code = control?.value?.trim();

  if (!code || !this.isStaffRole) {
    return;
  }

  if (this._isStaffCodeDuplicate(code)) {

    control?.setErrors({
      ...(control.errors || {}),
      duplicate: true
    });

  } else {

    // remove only duplicate error
    const errors = { ...(control?.errors || {}) };

    delete errors['duplicate'];

    control?.setErrors(
      Object.keys(errors).length ? errors : null
    );
  }

  control?.updateValueAndValidity();
}

// ── Blur check for Update Designation form ────────────────────────────
onUpdateEmpCodeBlur(): void {
  const code = this.updateDesigForm.value.employeeCode?.trim();
  if (!code || !this.isStaffRoleInUpdateForm) return;

  const isDuplicate = this._isStaffCodeDuplicate(
    code,
    this.selectedAgentForUpdate?.agentID  // ✅ exclude self
  );

  if (isDuplicate) {
    this.updateDesigForm.get('employeeCode')?.setErrors({ duplicate: true });
  } else {
    const errs = { ...this.updateDesigForm.get('employeeCode')?.errors };
    delete errs['duplicate'];
    this.updateDesigForm.get('employeeCode')
      ?.setErrors(Object.keys(errs).length ? errs : null);
  }
}

// loadAllDataChildrenForStaffcodeValidation
// ── Step 1: get all agent IDs from tree ───────────────────────────────
// private _loadAllAgentsWithDetails(): void {
//   this.agentService.getChildren()
//     .pipe(takeUntil(this.destroy$))
//     .subscribe(async (roots) => {
//       const allIDs: number[] = [];
//       await this._collectAllIDs(roots, allIDs);

//       // ── Step 2: fetch details for each agent ──────────────────────
//       const details: any[] = [];
//       for (const id of allIDs) {
//         try {
//           const detail = await firstValueFrom(
//             this.agentService.getAgentByID(id)
//           );
//           if (detail) details.push(detail);
//         } catch {
//           // skip failed
//         }
//       }

//       this.allAgentsFlat = details;
//       console.log('All agents with details:', this.allAgentsFlat.length);
//       this.cd.markForCheck();
//     });
// }
private async _loadAllAgentsWithDetails(): Promise<void> {
  try {
    const roots = await firstValueFrom(this.agentService.getChildren());
    const all: any[] = [];
    for (const r of roots) {
      await this['_collectAll'](r, all);
    }
    this.allAgentsFlat = all;
    console.log('All agents loaded:', all.length);
    // alert('All agents loaded:'+ JSON.stringify(all));
    // alert('All agents loaded:'+  this.allAgentsFlat);
    this.cd.markForCheck();
  } catch {
    console.warn('Failed to load all agents');
  }
}
// ── Recursively collect all agent IDs ─────────────────────────────────
private async _collectAll(agent: any, result: any[]): Promise<void> {
  // ✅ skip static BLM Admin root
  if (agent?.agentID === null || agent?.agentCode === 'BLM0000000000') return;

  result.push(agent);
  try {
    const children = await firstValueFrom(
      this.agentService.getChildren(agent.agentID)
    );
    for (const child of children) {
      await this._collectAll(child, result);
    }
  } catch {  console.log("Search Catch") }
}

}