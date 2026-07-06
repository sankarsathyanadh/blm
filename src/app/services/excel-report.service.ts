/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
// import * as XLSX from 'xlsx';
import * as XLSX from 'xlsx-js-style';
import { Agent } from './agent';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ExcelReportService {
  private readonly agentService = inject(Agent);

  // ── Public entry point ──────
async downloadAgentExcel(): Promise<void> {
    // 1. fetch all root agents
    const roots = await firstValueFrom(
      this.agentService.getChildren().pipe(catchError(() => of([])))
    );
 
    // 2. collect full subtree with details
    const rows: any[] = [];
    await Promise.all(
      roots.map((agent: any) => this._collectSubtree(agent, 0, rows))
    );
   alert(`Successfully collected ${rows.length} rows. Check console for full object tree!`);
  console.table(rows);
    // 3. generate Excel
    this._generateExcel(rows);
  }
 
  // ── Recursively collect all agents using forkJoin + switchMap ─────────
  private async _collectSubtree(
    agent: any,
    level: number,
    rows: any[]
  ): Promise<void> {
    try {
      const result = await firstValueFrom(
        // Step 1: fetch detail + children in parallel
        forkJoin({
          detail:   this.agentService.getAgentByID(agent.agentID).pipe(catchError(() => of(null))),
          children: this.agentService.getChildren(agent.agentID).pipe(catchError(() => of([]))),
        }).pipe(
          // Step 2: once detail arrives, fire beneficiary call immediately
          switchMap(({ detail, children }) => {
            const account$ = detail?.ibnkCustomerNo
              ? this.agentService
                  .getBeneficiaryAccounts(detail.ibnkCustomerNo)
                  .pipe(catchError(() => of(null)))
              : of(null);
 
            // All 3 resolved together — no extra wait cycle
           
            return forkJoin({
              detail:   of(detail),
              children: of(children),
              accounts: account$,
            }).pipe(
  // The 'tap' operator is perfect for debugging streams without changing the data
  tap((resolvedData: any) => {
    // Stringify the data so you can actually read the object properties
    alert(
      `Data for Agent: ${agent.agentID}\n` + 
      resolvedData.parentAgentName 
    );
    
    // It is highly recommended to log to the console as well so you have a history
    console.log(`Agent ${agent.agentID} Resolved Data:`, resolvedData);
  })
);
          })
        )
      );
 
      // Step 3: resolve primary beneficiary account
      const accounts: any[] | null = result.accounts;
      const primary = accounts?.find((a: any) => a.isActive ?? true) ?? accounts?.[0] ?? null;
 
      rows.push({
        ...agent,
        ...result.detail,
        level,
        // ── Account fields ──────────────────────────────────────────────
        accountNo:  primary?.accountNumber   ?? primary?.account_number  ?? primary?.accNo       ?? '—',
        ifscCode:   primary?.ifscCode        ?? primary?.ifsc            ?? primary?.ifsc_code   ?? '—',
        // ── Intro fields — adjust keys to match your actual API response ─
        introName:  primary?.introName       ?? primary?.intro_name      ?? primary?.introducerName       ?? '—',
        introCode:  primary?.introCode       ?? primary?.intro_code      ?? primary?.introducerCode       ?? '—',
        introDesig: primary?.introDesignation ?? primary?.intro_designation ?? primary?.introducerDesignation ?? '—',
      });
 
      // Step 4: recurse children concurrently
      if (result.children?.length) {
        await Promise.all(
          result.children.map((child: any) =>
            this._collectSubtree(child, level + 1, rows)
          )
        );
      }
    } catch {
      rows.push({
        ...agent,
        level,
        accountNo:  '—',
        ifscCode:   '—',
        introName:  '—',
        introCode:  '—',
        introDesig: '—',
      });
    }
  }
 
  // ── Generate Excel file ───────────────────────────────────────────────
  private _generateExcel(rows: any[]): void {
    const wb = XLSX.utils.book_new();
 
    const data = rows.map((r, i) => ({
      '#':                    i + 1,
      'Level':                r.level === 0 ? 'Root' : `L${r.level}`,
      'Agent Name':           this._indent(r.displayName, r.level),
      'Agent Code':           r.agentCode                ?? '—',
      'Customer Number':      r.ibnkCustomerNo           ?? '—',
      'Role':                 r.roleName                 ?? '—',
      'Designation':          r.designationName          ?? '—',
      'Designation Grade':    r.designationGrade         ?? '—',
      'Staff Designation':    r.employeeDesignationName  ?? '—',
      'Staff Desig. Grade':   r.employeeDesignationGrade ?? '—',
      'Staff Code':           r.employeeCode             ?? '—',
      'Branches':             this._resolveBranches(r.branches),
      'Joining Date':         this._formatDate(r.joiningDate),
      'Status':               r.isActive ? 'Active' : 'Inactive',
      'Account Number':       r.accountNo                ?? '—',
      'IFSC Code':            r.ifscCode                 ?? '—',
      // ── 3 new intro columns ─────────────────────────────────────────
      'Intro Name':           r.introName                ?? '—',
      'Intro Code':           r.introCode                ?? '—',
      'Intro Designation':    r.introDesig               ?? '—',
    }));
 
    const ws = XLSX.utils.json_to_sheet(data);
 
    ws['!cols'] = [
      { wch: 5  },  // #
      { wch: 8  },  // Level
      { wch: 30 },  // Agent Name
      { wch: 18 },  // Agent Code
      { wch: 18 },  // Customer Number
      { wch: 15 },  // Role
      { wch: 25 },  // Designation
      { wch: 18 },  // Designation Grade
      { wch: 25 },  // Staff Designation
      { wch: 18 },  // Staff Desig. Grade
      { wch: 14 },  // Staff Code
      { wch: 30 },  // Branches
      { wch: 14 },  // Joining Date
      { wch: 10 },  // Status
      { wch: 20 },  // Account Number
      { wch: 15 },  // IFSC Code
      { wch: 25 },  // Intro Name        ✅
      { wch: 18 },  // Intro Code        ✅
      { wch: 25 },  // Intro Designation ✅
    ];
 
    this._styleHeader(ws, data.length);
    XLSX.utils.book_append_sheet(wb, ws, 'Agent List');
 
    // Summary sheet
    const summaryWs = this._buildSummarySheet(rows);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
 
    const fileName = `Agent_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }
 
  // ── Format date as DD/MM/YYYY (UTC-safe) ─────────────────────────────
  private _formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      const dd   = String(d.getUTCDate()).padStart(2, '0');
      const mm   = String(d.getUTCMonth() + 1).padStart(2, '0');
      const yyyy = d.getUTCFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return '—';
    }
  }
 
  // ── Style header + alternate row colors ──────────────────────────────
  private _styleHeader(ws: XLSX.WorkSheet, dataLen: number): void {
    const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
 
    // Header row — dark blue background, white bold text
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
      if (!cell) continue;
      cell.s = {
        font:      { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
        fill:      { fgColor: { rgb: '1E3A8A' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top:    { style: 'thin', color: { rgb: 'FFFFFF' } },
          bottom: { style: 'thin', color: { rgb: 'FFFFFF' } },
          left:   { style: 'thin', color: { rgb: 'FFFFFF' } },
          right:  { style: 'thin', color: { rgb: 'FFFFFF' } },
        },
      };
    }
 
    // Data rows — alternating white / light blue
    for (let R = 1; R <= dataLen; R++) {
      const fill = R % 2 === 0
        ? { fgColor: { rgb: 'EFF6FF' } }
        : { fgColor: { rgb: 'FFFFFF' } };
 
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        if (!cell) continue;
        cell.s = {
          fill,
          alignment: { vertical: 'center', wrapText: true },
          border: {
            top:    { style: 'thin', color: { rgb: 'E2E8F0' } },
            bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
            left:   { style: 'thin', color: { rgb: 'E2E8F0' } },
            right:  { style: 'thin', color: { rgb: 'E2E8F0' } },
          },
        };
 
        // Color-code Status column
        if (cell.v === 'Active') {
          cell.s.font = { color: { rgb: '166534' }, bold: true };
        } else if (cell.v === 'Inactive') {
          cell.s.font = { color: { rgb: '991B1B' }, bold: true };
        }
      }
    }
  }
 
  // ── Summary sheet ─────────────────────────────────────────────────────
  private _buildSummarySheet(rows: any[]): XLSX.WorkSheet {
    const total    = rows.length;
    const active   = rows.filter(r => r.isActive).length;
    const inactive = total - active;
 
    // Role breakdown
    const roleMap: Record<string, number> = {};
    rows.forEach(r => {
      const role = r.roleName ?? 'Unknown';
      roleMap[role] = (roleMap[role] ?? 0) + 1;
    });
 
    // Designation breakdown
    const desigMap: Record<string, number> = {};
    rows.forEach(r => {
      const d = r.designationName ?? 'Unknown';
      desigMap[d] = (desigMap[d] ?? 0) + 1;
    });
 
    const summaryData = [
      { 'Report': 'Agent Network Summary'                     },
      { 'Report': `Generated: ${new Date().toLocaleString()}` },
      { 'Report': ''                                          },
      { 'Report': 'OVERVIEW',        'Value': ''              },
      { 'Report': 'Total Agents',    'Value': total           },
      { 'Report': 'Active Agents',   'Value': active          },
      { 'Report': 'Inactive Agents', 'Value': inactive        },
      { 'Report': ''                                          },
      { 'Report': 'BY ROLE',         'Value': ''              },
      ...Object.entries(roleMap).map(([k, v]) => ({ 'Report': k, 'Value': v })),
      { 'Report': ''                                          },
      { 'Report': 'BY DESIGNATION',  'Value': ''              },
      ...Object.entries(desigMap).map(([k, v]) => ({ 'Report': k, 'Value': v })),
    ];
 
    const ws = XLSX.utils.json_to_sheet(summaryData, { skipHeader: false });
    ws['!cols'] = [{ wch: 35 }, { wch: 15 }];
    return ws;
  }
 
  // ── Helpers ───────────────────────────────────────────────────────────
  private _indent(name: string, level: number): string {
    return '  '.repeat(level) + (level > 0 ? '↳ ' : '') + (name ?? '—');
  }
 
  private _resolveBranches(branches: any[]): string {
    if (!branches?.length) return '—';
    return branches
      .map(b => typeof b === 'string' ? b : b.branchName ?? b.name ?? String(b))
      .join(', ');
  }


}