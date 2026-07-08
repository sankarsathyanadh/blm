/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
// import * as XLSX from 'xlsx';
import * as XLSX from 'xlsx-js-style';
import { Agent } from './agent';

@Injectable({ providedIn: 'root' })
export class ExcelReportService {
  private readonly agentService = inject(Agent);

  // ── Public entry point ──────
async downloadAgentExcel(): Promise<void> {
  const allAgents = await this._collectAllAgentsBFS();
  const detailMap = await this._batchFetchDetails(allAgents);
  const accountMap = await this._batchFetchAccounts(detailMap);

  //  Extract parentID and look up the parent's details
  const rows = allAgents.map(({ agent, level, parentName, parentCode, parentID }) => {
    const detail  = detailMap.get(agent.agentID) ?? {};
    const account = accountMap.get(detail.ibnkCustomerNo) ?? { accountNo: '—', ifscCode: '—' };
    
    // Check if a parent ID exists. If yes, grab their details from the map.
    const parentDetail = parentID ? detailMap.get(parentID) : null;
    
    // Assign designation (Fallback to 'Admin' for the root nodes)
    const parentDesignation = parentID 
      ? (parentDetail?.designationName ?? '—') 
      : 'Admin'; 

    return { 
      ...agent, 
      ...detail, 
      level, 
      parentName, 
      parentCode, 
      parentDesignation, // ✅ Add parentDesignation to the final row object
      ...account 
    };
  });

  this._generateExcel(rows);
}

// ── BFS: collect agents level by level ──────────────────────────────
// private async _collectAllAgentsBFS(): Promise<{ agent: any; level: number }[]> {
//   const result: { agent: any; level: number }[] = [];

//   // Fetch root agents
//   let currentLevel = await firstValueFrom(this.agentService.getChildren());
//   let depth = 0;

//   while (currentLevel.length > 0) {
//     // Add all agents at this level to result
//     currentLevel.forEach(agent => result.push({ agent, level: depth }));

//     // Fetch ALL children for this entire level in parallel
//     const childResults = await Promise.all(
//       currentLevel.map(agent =>
//         firstValueFrom(this.agentService.getChildren(agent.agentID))
//           .catch(() => [] as any[])
//       )
//     );

//     // Flatten children for next iteration
//     currentLevel = childResults.flat();
//     depth++;
//   }

//   return result;
// }
private async _collectAllAgentsBFS(): Promise<{ agent: any; level: number; parentName: string; parentCode: string; parentID: number | null }[]> {
  const result: { agent: any; level: number; parentName: string; parentCode: string; parentID: number | null }[] = [];

  const initialAgents = await firstValueFrom(this.agentService.getChildren());

  // ✅ Initialize root level. BLM Admin has no true DB parent ID, so we use null.
  let currentLevel = initialAgents.map(agent => ({
    agent,
    level: 0,
    parentName: 'BLM Admin',
    parentCode: 'BLM0000000000',
    parentID: null 
  }));

  while (currentLevel.length > 0) {
    currentLevel.forEach(item => result.push(item));

    const childResults = await Promise.all(
      currentLevel.map(async (parentItem) => {
        const children = await firstValueFrom(this.agentService.getChildren(parentItem.agent.agentID))
          .catch(() => [] as any[]);

        return children.map(child => ({
          agent: child,
          level: parentItem.level + 1,
          parentName: parentItem.agent.displayName ?? '—',
          parentCode: parentItem.agent.agentCode ?? '—',
          parentID: parentItem.agent.agentID // ✅ Pass the parent's ID down
        }));
      })
    );

    currentLevel = childResults.flat();
  }

  return result;
}
// ── Batch fetch agent details ────────────────────────────────────────
private async _batchFetchDetails(
 allAgents: { agent: any; level: number; parentName: string; parentCode: string; parentID: number | null }[]
): Promise<Map<number, any>> {
  const CHUNK = 20; // tune based on your API rate limit
  const map   = new Map<number, any>();

  for (let i = 0; i < allAgents.length; i += CHUNK) {
    const chunk = allAgents.slice(i, i + CHUNK);
    const results = await Promise.all(
      chunk.map(({ agent }) =>
        firstValueFrom(this.agentService.getAgentByID(agent.agentID))
          .catch(() => null)
      )
    );
    results.forEach((detail, idx) => {
      if (detail) map.set(chunk[idx].agent.agentID, detail);
    });
  }

  return map;
}

// ── Batch fetch beneficiary accounts ────────────────────────────────
private async _batchFetchAccounts(
  detailMap: Map<number, any>
): Promise<Map<string, { accountNo: string; ifscCode: string }>> {
  const map         = new Map<string, { accountNo: string; ifscCode: string }>();
  const customerNos = [...new Set(
    [...detailMap.values()]
      .map(d => d?.ibnkCustomerNo)
      .filter(Boolean)
  )];

  const CHUNK = 20;
  for (let i = 0; i < customerNos.length; i += CHUNK) {
    const chunk = customerNos.slice(i, i + CHUNK);
    const results = await Promise.all(
      chunk.map(no =>
        firstValueFrom(this.agentService.getBeneficiaryAccounts(no))
          .catch(() => null)
      )
    );

    results.forEach((accounts, idx) => {
      const primary = accounts?.find((a: any) => a.isActive ?? true) ?? accounts?.[0];
      map.set(chunk[idx], {
        accountNo: primary?.accountNumber ?? primary?.account_number ?? primary?.accNo ?? '—',
        ifscCode:  primary?.ifscCode ?? primary?.ifsc ?? primary?.ifsc_code ?? '—',
      });
    });
  }

  return map;
}
  // ── Recursively collect all agents ─────────────
private async _collectSubtree(
  agent: any,
  level: number,
  rows: any[]
): Promise<void> {
  try {
    // 1. Start fetching both details and children simultaneously (Parallel)
    const [detail, children] = await Promise.all([
      firstValueFrom(this.agentService.getAgentByID(agent.agentID)),
      firstValueFrom(this.agentService.getChildren(agent.agentID))
    ]);

    let accountNo = '—';
    let ifscCode  = '—';

    // 2. Fetch beneficiary accounts if customer number exists
    if (detail?.ibnkCustomerNo) {
      try {
        const accounts = await firstValueFrom(
          this.agentService.getBeneficiaryAccounts(detail.ibnkCustomerNo)
        );

        const primary = accounts?.find((a: any) => a.isActive ?? true) ?? accounts?.[0];

        if (primary) {
          accountNo = primary.accountNumber ?? primary.account_number ?? primary.accNo ?? '—';
          ifscCode  = primary.ifscCode ?? primary.ifsc ?? primary.ifsc_code ?? '—';
        }
      } catch {
        // Fallback handled
      }
    }

    // Push current row data
    rows.push({ ...agent, ...detail, level, accountNo, ifscCode });

    // 3. Process children concurrently rather than sequentially
    if (children?.length) {
      await Promise.all(
        children.map((child: any) => this._collectSubtree(child, level + 1, rows))
      );
    }
  } catch {
    rows.push({ ...agent, level, accountNo: '—', ifscCode: '—' });
  }
}

  // ── Generate Excel file ─────
private _generateExcel(rows: any[]): void {
  const wb = XLSX.utils.book_new();

  const data = rows.map((r, i) => ({
    '#':                      i + 1,
    'Level':                  r.level === 0 ? 'Root' : `L${r.level}`,
    'Agent Name':             this._indent(r.displayName, r.level),
    'Intro Name':          r.parentName             ?? '—',  //  NEW COLUMN
    'Intro Code':            r.parentCode             ?? '—',  //  NEW COLUMN
    'Intro Designation':     r.parentDesignation      ?? '—',  //  NEW COLUMN
    'Agent Code':             r.agentCode              ?? '—',
    'Customer Number':        r.ibnkCustomerNo         ?? '—',
    'Role':                   r.roleName               ?? '—',
    'Designation':            r.designationName        ?? '—',
    'Designation Grade':      r.designationGrade       ?? '—',
    'Staff Designation':      r.employeeDesignationName ?? '—',
    'Staff Desig. Grade':     r.employeeDesignationGrade ?? '—',
    'Staff Code':             r.employeeCode           ?? '—',
    'Branches':               this._resolveBranches(r.branches),

    // 'Joining Date':           r.joiningDate
    //                             ? new Date(r.joiningDate)
    //                                 .toLocaleDateString('en-GB')
    //                             : '—',
     'Joining Date':           this._formatDate(r.joiningDate), 
    'Status':                 r.isActive ? 'Active' : 'Inactive',
    'Account Number':         r.accountNo              ?? '—',  // 
    'IFSC Code':              r.ifscCode               ?? '—',  // 
  }));
  const ws = XLSX.utils.json_to_sheet(data);
    // alert(ws);

  //  updated column widths — add 2 new columns
 ws['!cols'] = [
    { wch: 5  },  // #
    { wch: 8  },  // Level
    { wch: 30 },  // Agent Name
    { wch: 25 },  // Introduced By
    { wch: 18 },  // Parent Code
    { wch: 25 },  // Parent Designation 
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
  ];

  this._styleHeader(ws, data.length);
  XLSX.utils.book_append_sheet(wb, ws, 'Agent List');

  // Summary sheet
  const summaryWs = this._buildSummarySheet(rows);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  const fileName = `Agent_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
private _formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';

  try {
    const d = new Date(dateStr);

    // ✅ check valid date
    if (isNaN(d.getTime())) return '—';

    // ✅ manual DD/MM/YYYY — consistent across all browsers/servers
    const dd   = String(d.getUTCDate()).padStart(2, '0');
    const mm   = String(d.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = d.getUTCFullYear();

    return `${dd}/${mm}/${yyyy}`;   // e.g. 22/12/2026

  } catch {
    return '—';
  }
}
  // ── Style header row ─────
  private _styleHeader(ws: XLSX.WorkSheet, dataLen: number): void {
    const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');

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
        }
      };
    }

    // alternate row colors
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
          }
        };

        // color status cell
        if (cell.v === 'Active') {
          cell.s.font = { color: { rgb: '166534' }, bold: true };
        } else if (cell.v === 'Inactive') {
          cell.s.font = { color: { rgb: '991B1B' }, bold: true };
        }
      }
    }
  }

  // ── Summary sheet ────
  private _buildSummarySheet(rows: any[]): XLSX.WorkSheet {
    const total    = rows.length;
    const active   = rows.filter(r => r.isActive).length;
    const inactive = total - active;

    // role breakdown
    const roleMap: Record<string, number> = {};
    rows.forEach(r => {
      const role = r.roleName ?? 'Unknown';
      roleMap[role] = (roleMap[role] ?? 0) + 1;
    });

    // designation breakdown
    const desigMap: Record<string, number> = {};
    rows.forEach(r => {
      const d = r.designationName ?? 'Unknown';
      desigMap[d] = (desigMap[d] ?? 0) + 1;
    });

    const summaryData = [
      { 'Report':        'Agent Network Summary'                              },
      { 'Report':        `Generated: ${new Date().toLocaleString()}`          },
      { 'Report':        ''                                                   },
      { 'Report':        'OVERVIEW',         'Value': ''                      },
      { 'Report':        'Total Agents',     'Value': total                   },
      { 'Report':        'Active Agents',    'Value': active                  },
      { 'Report':        'Inactive Agents',  'Value': inactive                },
      { 'Report':        ''                                                   },
      { 'Report':        'BY ROLE',          'Value': ''                      },
      ...Object.entries(roleMap).map(([k, v]) => ({ 'Report': k, 'Value': v })),
      { 'Report':        ''                                                   },
      { 'Report':        'BY DESIGNATION',   'Value': ''                      },
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