/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
// import * as XLSX from 'xlsx';
import * as XLSX from 'xlsx-js-style';
import { Agent } from './agent';

@Injectable({ providedIn: 'root' })
export class ExcelReportService {
  private readonly agentService = inject(Agent);

  // ── Public entry point ────────────────────────────────────────────────
  async downloadAgentExcel(): Promise<void> {
    // 1. fetch all root agents
    const roots = await firstValueFrom(this.agentService.getChildren());

    // 2. collect full subtree with details
    const rows: any[] = [];
    for (const agent of roots) {
      await this._collectSubtree(agent, 0, rows);
    }

    // 3. generate Excel
    this._generateExcel(rows);
  }

  // ── Recursively collect all agents ───────────────────────────────────
  private async _collectSubtree(
    agent: any,
    level: number,
    rows: any[]
  ): Promise<void> {
    try {
      // fetch full details for each agent
      const detail = await firstValueFrom(
        this.agentService.getAgentByID(agent.agentID)
      );
      rows.push({ ...agent, ...detail, level });

      // fetch children
      const children = await firstValueFrom(
        this.agentService.getChildren(agent.agentID)
      );
      if (children?.length) {
        for (const child of children) {
          await this._collectSubtree(child, level + 1, rows);
        }
      }
    } catch {
      // skip failed agent
      rows.push({ ...agent, level });
    }
  }

  // ── Generate Excel file ───────────────────────────────────────────────
  private _generateExcel(rows: any[]): void {
    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Agent List ───────────────────────────────────────────
    const data = rows.map((r, i) => ({
      '#':                      i + 1,
      'Level':                  r.level === 0 ? 'Root' : `L${r.level}`,
      'Agent Name':             this._indent(r.displayName, r.level),
      'Agent Code':             r.agentCode             ?? '—',
      'Customer Number':        r.ibnkCustomerNo        ?? '—',
      'Role':                   r.roleName              ?? '—',
      'Designation':            r.designationName       ?? '—',
      'Designation Grade':      r.designationGrade      ?? '—',
      'Staff Designation':      r.employeeDesignationName ?? '—',
      'Staff Desig. Grade':     r.employeeDesignationGrade ?? '—',
      'Staff Code':             r.employeeCode          ?? '—',
      'Branches':               this._resolveBranches(r.branches),
      'Joining Date':           r.joiningDate
                                  ? new Date(r.joiningDate).toLocaleDateString('en-GB')
                                  : '—',
      'Status':                 r.isActive ? 'Active' : 'Inactive',
    }));

    const ws = XLSX.utils.json_to_sheet(data);

    // ── Column widths ─────────────────────────────────────────────────
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
    ];

    // ── Style header row ──────────────────────────────────────────────
    this._styleHeader(ws, data.length);

    XLSX.utils.book_append_sheet(wb, ws, 'Agent List');

    // ── Sheet 2: Summary ──────────────────────────────────────────────
    const summaryWs = this._buildSummarySheet(rows);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // ── Save ──────────────────────────────────────────────────────────
    const fileName = `Agent_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  // ── Style header row ──────────────────────────────────────────────────
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

  // ── Summary sheet ─────────────────────────────────────────────────────
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