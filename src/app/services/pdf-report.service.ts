/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Agent } from './agent';

// jsPDF + autoTable — install via:
// npm install jspdf jspdf-autotable
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
export interface AgentRow {
  level: number;
  name: string;
  agentCode: string;
  customerNo: string;
  folioNo: string;
  role: string;
  status: string;
  branch?: string;
}
@Injectable({
  providedIn: 'root'
})
export class PdfReportService {
private readonly agentService = inject(Agent);
  // ── Public entry point ────────────────────────────────────────────────
  async downloadAgentReport(agentData: any): Promise<void> {
    // 1. Collect full subtree rows recursively
    const rows: AgentRow[] = [];
    await this._collectSubtree(agentData, 0, rows);

    // 2. Build and save PDF
    this._generatePdf(agentData, rows);
  }

  // ── Recursively fetch all children ───────────────────────────────────
  private async _collectSubtree(
    data: any,
    level: number,
    rows: AgentRow[]
  ): Promise<void> {
    // Push current agent
    rows.push(this._toRow(data, level));

    // Fetch children from API
    try {
      const children = await firstValueFrom(
        this.agentService.getChildren(data.agentID)
      );

      if (children?.length) {
        for (const child of children) {
          await this._collectSubtree(child, level + 1, rows);
        }
      }
    } catch {
      // Node has no children or API error — skip
    }
  }
   // ── Map API data to a flat row ────────────────────────────────────────
  private _toRow(data: any, level: number): AgentRow {
    return {
      level,
      name:       data.displayName       ?? '—',
      agentCode:  data.agentCode         ?? '—',
      customerNo: data.ibnkCustomerNo    ?? '—',
      folioNo:    String(data.ibnkShareFolioNum ?? '—'),
      role:       data.roleName          ?? '—',
      status:     data.isActive ? 'Active' : 'Inactive',
      branch:     data.branchName        ?? '',
    };
  }

 private _generatePdf(rootAgent: any, rows: AgentRow[]): void {

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageW = doc.internal.pageSize.getWidth();
  const now = new Date().toLocaleString();

  // HEADER
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 18, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Agent Network Report', 12, 9);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Root: ${rootAgent.displayName} (${rootAgent.agentCode})`,
    12,
    15
  );

  doc.text(
    `Generated: ${now}`,
    pageW - 12,
    15,
    { align: 'right' }
  );

  // SUMMARY
  const totalAgents = rows.length;
  const activeAgents = rows.filter(r => r.status === 'Active').length;
  const maxDepth = Math.max(...rows.map(r => r.level));

  doc.setFillColor(241, 245, 249);
  doc.rect(0, 18, pageW, 8, 'F');

  doc.setTextColor(60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);

  doc.text(`Total: ${totalAgents}`, 12, 23);
  doc.text(`Active: ${activeAgents}`, 50, 23);
  doc.text(`Inactive: ${totalAgents - activeAgents}`, 90, 23);
  doc.text(`Depth: ${maxDepth}`, 140, 23);

  // TABLE
  const head = [[
    '#',
    'Level',
    'Name',
    'Code',
    'Customer No',
    'Folio',
    'Role',
    'Status'
  ]];

  const body = rows.map((r, i) => [
    i + 1,
    r.level === 0 ? 'Root' : r.level,
    this._indent(r.name, r.level),
    r.agentCode,
    r.customerNo,
    r.folioNo,
    r.role,
    r.status === 'data.isActive' ? 'Inactive' : 'Active'
  ]);

  autoTable(doc, {

    startY: 28,

    head,
    body,
 tableWidth: 'auto',  
    styles: {
      fontSize: 8,
      cellPadding: 1.5,
      overflow: 'linebreak',
      valign: 'middle'
    },

    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'left'
    },

    columnStyles: {

      0: { cellWidth: 10, halign: 'left' },

      1: { cellWidth: 12, halign: 'left' },

      2: { cellWidth: 'auto' },

      3: { cellWidth: 28 },

      4: { cellWidth: 28 },

      5: { cellWidth: 22 },

      6: { cellWidth: 32 },

      7: { cellWidth: 24, halign: 'left' }

    },

    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },

    margin: {
      left: 4,
      right: 4
    },

    didDrawPage: () => {

      const pageCount = (doc as any).internal.getNumberOfPages();

      const pageCurrent =
        (doc as any).internal.getCurrentPageInfo().pageNumber;

      doc.setFontSize(7);

      doc.setTextColor(150);

      doc.text(
        `Page ${pageCurrent}/${pageCount}`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 4,
        { align: 'center' }
      );

    }

  });

  doc.save(`Agent_${rootAgent.agentCode}.pdf`);
}

  // ── Helpers ───────────────────────────────────────────────────────────
 private _indent(name: string, level: number): string {
  return '  '.repeat(level) + (level > 0 ? ' ' : '') + name;
}

  private _levelLabel(level: number): string {
    return level === 0 ? 'Root' : `L${level}`;
  }


  // ── Build PDF ─────────────────────────────────────────────────────────
// constructor() { }

}
