/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-inferrable-types */


import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx-js-style';

@Injectable({
  providedIn: 'root'
})
export class IbexcelreportService {




// Inside your AngularJS Controller or Service



// Inside your AngularJS Controller
  exportToExcel(data: any) {
    const wb = XLSX.utils.book_new();
    const wsData = [];

    // --- Styles Configuration ---
    const sHeader = {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
    };

    const sSubHeader = {
        font: { bold: true, sz: 11 },
        fill: { fgColor: { rgb: "D9E1F2" } },
        border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
    };

    const sRow = {
        border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
    };

    // --- 1. Main Title ---
    wsData.push([{ v: "BRANCH AUDIT REPORT", s: sHeader }, "", "", "", "", ""]);
    wsData.push([]);

    // --- 2. General Information ---
    wsData.push([
        { v: "State: " + data.state, s: sRow }, 
        { v: "Branch: " + data.branch, s: sRow }, 
        { v: "Reporting To: " + data.reportingTo, s: sRow }
    ]);
    wsData.push([
        { v: "Opening: " + data.openingDate, s: sRow }, 
        { v: "Closing: " + data.closingDate, s: sRow }, 
        { v: "Prev Audit: " + data.previousAuditDate, s: sRow }
    ]);
    wsData.push([]);

    // --- 3. Staff Details ---
    wsData.push([{ v: "STAFF DETAILS", s: sSubHeader }]);
    wsData.push([
        { v: "Emp Code", s: sHeader }, { v: "Name", s: sHeader }, 
        { v: "Designation", s: sHeader }, { v: "Joining Date", s: sHeader }, 
        { v: "Contact", s: sHeader }
    ]);
    data.staffDetails.forEach((s: { employeeCode: any; employeeName: any; designation: any; dateOfJoining: any; contactNumber: any; }) => {
        wsData.push([
            { v: s.employeeCode, s: sRow }, { v: s.employeeName, s: sRow }, 
            { v: s.designation, s: sRow }, { v: s.dateOfJoining, s: sRow }, 
            { v: s.contactNumber, s: sRow }
        ]);
    });
    wsData.push([]);

    // --- 4. Business Position ---
    wsData.push([{ v: "BUSINESS POSITION", s: sSubHeader }]);
    wsData.push([
        { v: "Product", s: sHeader }, { v: "Current A/Cs", s: sHeader }, 
        { v: "Current O/S", s: sHeader }, { v: "Diff A/Cs", s: sHeader }, 
        { v: "Diff O/S", s: sHeader }
    ]);
    data.businessPosition.forEach((b: { productName: any; currentAccounts: any; currentOutstanding: any; diffAccounts: any; diffOutstanding: any; }) => {
        wsData.push([
            { v: b.productName, s: sRow }, { v: b.currentAccounts, s: sRow }, 
            { v: b.currentOutstanding, s: sRow }, { v: b.diffAccounts, s: sRow }, 
            { v: b.diffOutstanding, s: sRow }
        ]);
    });
    wsData.push([]);

    // --- 5. Visit Details ---
    wsData.push([{ v: "VISIT DETAILS", s: sSubHeader }]);
    wsData.push([
        { v: "Date", s: sHeader }, { v: "Official Name", s: sHeader }, 
        { v: "Designation", s: sHeader }, { v: "Remarks", s: sHeader }
    ]);
    data.visitDetails.forEach((v: { dateOfVisit: any; officialName: any; designation: any; remarks: any; }) => {
        wsData.push([
            { v: v.dateOfVisit, s: sRow }, { v: v.officialName, s: sRow }, 
            { v: v.designation, s: sRow }, { v: v.remarks, s: sRow }
        ]);
    });
    wsData.push([]);

    // --- 6. Cash & Stamp Verification ---
    wsData.push([{ v: "CASH & STAMP VERIFICATION", s: sSubHeader }]);
    wsData.push([{ v: "Cash System Bal", s: sRow }, { v: data.cashVerification.systemBalance, s: sRow }, { v: "Physical Bal", s: sRow }, { v: data.cashVerification.physicalBalance, s: sRow }]);
    wsData.push([{ v: "Postal Register", s: sRow }, { v: data.stampVerification.postalStampRegister, s: sRow }, { v: "Postal Physical", s: sRow }, { v: data.stampVerification.postalStampPhysical, s: sRow }]);
    wsData.push([{ v: "Revenue Register", s: sRow }, { v: data.stampVerification.revenueStampRegister, s: sRow }, { v: "Revenue Physical", s: sRow }, { v: data.stampVerification.revenueStampPhysical, s: sRow }]);

    // Create Worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // --- Merges & Column Widths ---
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Title
        { s: { r: 6, c: 0 }, e: { r: 6, c: 4 } }, // Staff Header
    ];
    
    ws['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(wb, ws, "AuditReport");
    XLSX.writeFile(wb, `Audit_Report_Branch_${data.branch}.xlsx`);
};
}