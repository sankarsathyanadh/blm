/* eslint-disable @angular-eslint/prefer-inject */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core';
import { IbexcelreportService } from '../../services/ibexcelreport.service';
// Ensure "resolveJsonModule": true is set in your tsconfig.json to import JSON directly

@Component({
  selector: 'app-excelcreationib',
  templateUrl: './excelcreationib.component.html',
  styleUrls: ['./excelcreationib.component.css']
})
export class ExcelcreationibComponent implements OnInit {
// 1. Declare the JSON object directly as a class property
  sampleData: any = {
	"state": 1,
	"branch": 77,
	"completion": {
		"cashierNameEmp": "",
		"auditOfficialNameEmp": "",
		"branchManagerNameEmp": "",
		"jointCustodianNameEmp": ""
	},
	"closingDate": "2026-06-30",
	"openingDate": "2026-06-12",
	"reportingTo": "John Travolta",
	"bankAccounts": [
		{
			"status": "",
			"bankName": "",
			"ifscCode": "",
			"reasonsIfAny": "",
			"accountNumber": "",
			"differenceBalance": 0,
			"accountOperatorName": "",
			"bankPassbookBalanceCr": 0,
			"companyLedgerBalanceDr": 0
		}
	],
	"staffDetails": [
		{
			"remarks": "",
			"designation": "",
			"employeeCode": "testuser",
			"employeeName": "test user",
			"contactNumber": "",
			"dateOfJoining": "2001-01-01",
			"idCardOrAssetsAvailable": ""
		},
		{
			"remarks": "",
			"designation": "",
			"employeeCode": "rm",
			"employeeName": "Test Region Manager",
			"contactNumber": "",
			"dateOfJoining": "2001-01-01",
			"idCardOrAssetsAvailable": ""
		},
		{
			"remarks": "",
			"designation": "",
			"employeeCode": "tester",
			"employeeName": "Tester",
			"contactNumber": "",
			"dateOfJoining": "2001-01-01",
			"idCardOrAssetsAvailable": ""
		},
		{
			"remarks": "",
			"designation": "",
			"employeeCode": "testuser001",
			"employeeName": "Test User",
			"contactNumber": "",
			"dateOfJoining": "2001-01-01",
			"idCardOrAssetsAvailable": ""
		},
		{
			"remarks": "",
			"designation": "AM",
			"employeeCode": "am123",
			"employeeName": "Test Area Manager",
			"contactNumber": "",
			"dateOfJoining": "2001-01-01",
			"idCardOrAssetsAvailable": ""
		},
		{
			"remarks": "",
			"designation": "",
			"employeeCode": "johnex",
			"employeeName": "John Ex",
			"contactNumber": "",
			"dateOfJoining": "2001-01-01",
			"idCardOrAssetsAvailable": ""
		},
		{
			"remarks": "",
			"designation": "",
			"employeeCode": "client",
			"employeeName": "Client",
			"contactNumber": "",
			"dateOfJoining": "2001-01-01",
			"idCardOrAssetsAvailable": ""
		},
		{
			"remarks": "",
			"designation": "",
			"employeeCode": "agro1",
			"employeeName": "Agro User1",
			"contactNumber": "",
			"dateOfJoining": "2001-01-01",
			"idCardOrAssetsAvailable": ""
		},
		{
			"remarks": "",
			"designation": "",
			"employeeCode": "bm",
			"employeeName": "Branch Manager",
			"contactNumber": "",
			"dateOfJoining": "2001-01-01",
			"idCardOrAssetsAvailable": ""
		},
		{
			"remarks": "",
			"designation": "",
			"employeeCode": "manu_vpl",
			"employeeName": "Manu VPL",
			"contactNumber": "",
			"dateOfJoining": "2001-01-01",
			"idCardOrAssetsAvailable": ""
		},
		{
			"remarks": "",
			"designation": "",
			"employeeCode": "athiratest",
			"employeeName": "Athira test",
			"contactNumber": "",
			"dateOfJoining": "2001-01-01",
			"idCardOrAssetsAvailable": ""
		},
		{
			"remarks": "",
			"designation": "",
			"employeeCode": "bic123",
			"employeeName": "Test  Branch In Charge",
			"contactNumber": "",
			"dateOfJoining": "2001-01-01",
			"idCardOrAssetsAvailable": ""
		},
		{
			"remarks": "",
			"designation": "",
			"employeeCode": "mony",
			"employeeName": "Mony",
			"contactNumber": "",
			"dateOfJoining": "2001-01-01",
			"idCardOrAssetsAvailable": ""
		},
		{
			"remarks": "",
			"designation": "",
			"employeeCode": "swathiuser",
			"employeeName": "Swathi",
			"contactNumber": "",
			"dateOfJoining": "2001-01-01",
			"idCardOrAssetsAvailable": ""
		},
		{
			"remarks": "",
			"designation": "Collector",
			"employeeCode": "coll01",
			"employeeName": "Coll01",
			"contactNumber": "",
			"dateOfJoining": "2001-01-01",
			"idCardOrAssetsAvailable": ""
		}
	],
	"visitDetails": [
		{
			"remarks": "FINANCE MANAGER VISIT",
			"dateOfVisit": "2026-06-15",
			"designation": "FM",
			"officialName": "Finance Manager 1"
		},
		{
			"remarks": "RM visit",
			"dateOfVisit": "2026-06-18",
			"designation": "RM",
			"officialName": "Regional Manager 12"
		},
		{
			"remarks": "CEO visit",
			"dateOfVisit": "2026-06-22",
			"designation": "CEO",
			"officialName": "CEO 3"
		}
	],
	"generalPoints": {
		"assetsClean": "",
		"staffIdDressCode": "",
		"branchOpensOnTime": "",
		"institutionTaxPaid": ""
	},
	"bankCompliance": {
		"moneyFlownThirdParty": "",
		"customerDirectDeposit": "",
		"statementsPreparedByBranch": ""
	},
	"periodCoveredTo": "2026-06-18",
	"businessPosition": [
		{
			"remarks": "",
			"productCode": "BIZ",
			"productName": "Business Loan",
			"diffAccounts": 10,
			"currentAccounts": 10,
			"diffOutstanding": 2083652,
			"currentOutstanding": 2083652,
			"previousAuditAccounts": 0,
			"previousAuditOutstanding": 0
		},
		{
			"remarks": "",
			"productCode": "DBNT",
			"productName": "Debentures",
			"diffAccounts": 24,
			"currentAccounts": 24,
			"diffOutstanding": 3723500,
			"currentOutstanding": 3723500,
			"previousAuditAccounts": 0,
			"previousAuditOutstanding": 0
		},
		{
			"remarks": "",
			"productCode": "OTBR",
			"productName": "Dir/Other Borrowings",
			"diffAccounts": 2,
			"currentAccounts": 2,
			"diffOutstanding": 75000,
			"currentOutstanding": 75000,
			"previousAuditAccounts": 0,
			"previousAuditOutstanding": 0
		},
		{
			"remarks": "",
			"productCode": "GOLD",
			"productName": "Gold Loan",
			"diffAccounts": 84,
			"currentAccounts": 84,
			"diffOutstanding": 4702887,
			"currentOutstanding": 4702887,
			"previousAuditAccounts": 0,
			"previousAuditOutstanding": 0
		},
		{
			"remarks": "",
			"productCode": "LOD",
			"productName": "Loan On Deposit",
			"diffAccounts": 4,
			"currentAccounts": 4,
			"diffOutstanding": 120000,
			"currentOutstanding": 120000,
			"previousAuditAccounts": 0,
			"previousAuditOutstanding": 0
		},
		{
			"remarks": "",
			"productCode": "PERS",
			"productName": "Personal Loan",
			"diffAccounts": 17,
			"currentAccounts": 17,
			"diffOutstanding": 8447845,
			"currentOutstanding": 8447845,
			"previousAuditAccounts": 0,
			"previousAuditOutstanding": 0
		},
		{
			"remarks": "",
			"productCode": "PLG",
			"productName": "Pledge Loan",
			"diffAccounts": 9,
			"currentAccounts": 9,
			"diffOutstanding": 603466,
			"currentOutstanding": 603466,
			"previousAuditAccounts": 0,
			"previousAuditOutstanding": 0
		},
		{
			"remarks": "",
			"productCode": "PPTY",
			"productName": "Property Loan",
			"diffAccounts": 1,
			"currentAccounts": 1,
			"diffOutstanding": 985583,
			"currentOutstanding": 985583,
			"previousAuditAccounts": 0,
			"previousAuditOutstanding": 0
		},
		{
			"remarks": "",
			"productCode": "RD",
			"productName": "Recurring Deposit",
			"diffAccounts": 7,
			"currentAccounts": 7,
			"diffOutstanding": 106000,
			"currentOutstanding": 106000,
			"previousAuditAccounts": 0,
			"previousAuditOutstanding": 0
		},
		{
			"remarks": "",
			"productCode": "SHR",
			"productName": "Share",
			"diffAccounts": 19,
			"currentAccounts": 19,
			"diffOutstanding": 3400,
			"currentOutstanding": 3400,
			"previousAuditAccounts": 0,
			"previousAuditOutstanding": 0
		},
		{
			"remarks": "",
			"productCode": "STPL",
			"productName": "ST Personal Loan",
			"diffAccounts": 2,
			"currentAccounts": 2,
			"diffOutstanding": 110000,
			"currentOutstanding": 110000,
			"previousAuditAccounts": 0,
			"previousAuditOutstanding": 0
		},
		{
			"remarks": "",
			"productCode": "SBDBT",
			"productName": "Subordinate Debt",
			"diffAccounts": 7,
			"currentAccounts": 7,
			"diffOutstanding": 585000,
			"currentOutstanding": 585000,
			"previousAuditAccounts": 0,
			"previousAuditOutstanding": 0
		},
		{
			"remarks": "",
			"productCode": "TD",
			"productName": "Term Deposit",
			"diffAccounts": 14,
			"currentAccounts": 14,
			"diffOutstanding": 1421000,
			"currentOutstanding": 1421000,
			"previousAuditAccounts": 0,
			"previousAuditOutstanding": 0
		},
		{
			"remarks": "",
			"productCode": "TA",
			"productName": "Transaction Accounts",
			"diffAccounts": 51,
			"currentAccounts": 51,
			"diffOutstanding": 2004829.2,
			"currentOutstanding": 2004829.2,
			"previousAuditAccounts": 0,
			"previousAuditOutstanding": 0
		},
		{
			"remarks": "",
			"productCode": "VRD",
			"productName": "Variable RD",
			"diffAccounts": 2,
			"currentAccounts": 2,
			"diffOutstanding": 13500,
			"currentOutstanding": 13500,
			"previousAuditAccounts": 0,
			"previousAuditOutstanding": 0
		},
		{
			"remarks": "",
			"productCode": "VEH",
			"productName": "Vehicle Loan",
			"diffAccounts": 15,
			"currentAccounts": 15,
			"diffOutstanding": 4829370,
			"currentOutstanding": 4829370,
			"previousAuditAccounts": 0,
			"previousAuditOutstanding": 0
		}
	],
	"cashVerification": {
		"remarks": "",
		"soiledNotes": 0,
		"systemBalance": 0,
		"shortageExcess": 0,
		"excessAccounted": "Yes",
		"physicalBalance": 0,
		"shortageAccounted": "Yes",
		"holdingWithinLimit": "Yes",
		"jointReserveRecorded": ""
	},
	"bankStatementAsOn": "2026-06-12",
	"periodCoveredFrom": "2026-06-12",
	"previousAuditDate": "2026-01-01",
	"stampVerification": {
		"postalStampRemarks": "",
		"postalStampPhysical": 0,
		"postalStampRegister": 0,
		"revenueStampRemarks": "",
		"adhesiveStampRemarks": "",
		"revenueStampPhysical": 0,
		"revenueStampRegister": 0,
		"adhesiveStampPhysical": 0,
		"adhesiveStampRegister": 0,
		"postalStampDifference": "",
		"revenueStampDifference": "",
		"adhesiveStampDifference": ""
	},
	"chequeStockDetails": [
		{
			"remarks": "",
			"bankName": "",
			"availableStock": 0,
			"chequeNumberSeries": ""
		}
	],
	"safeRoomManagement": {
		"keysCustody": "Yes",
		"registersInSafe": "",
		"closedDuringHours": "Yes",
		"unauthorizedItems": "Yes",
		"jointCustodyFollowed": "Yes"
	},
	"prevPeriodCoveredTo": null,
	"voucherVerification": {
		"vouchersFiled": "",
		"travelingRules": "",
		"expensesAuthorized": "",
		"vouchersAcknowledged": ""
	},
	"prevPeriodCoveredFrom": null,
	"chequeVerificationTime": ""
};
  constructor(private excelService: IbexcelreportService) { }
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

onDownloadExcel() {
    // 2. Pass the local component property to the service
    this.excelService.exportToExcel(this.sampleData);
  }



}