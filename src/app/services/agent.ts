/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @angular-eslint/prefer-inject */
// import { HttpClient  } from '@angular/common/http';
// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, shareReplay, timeout, retry } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Agent {
  //  private apiUrl = 'https://imkttest.icrats.in/api/imkt/api';
  // private baseUrl = '/api/imkt/api';


  // constructor(private http: HttpClient) {}

//   getAgentDetails(agentId: number): Observable<any> {

 
//      return this.http.get(
//       `${this.baseUrl}/Agent/${agentId}`
//     );

//   }
//      getChildren(agentId?: number){
//     const url = agentId ?
//       `${this.baseUrl}/Agent/GetChildren/${agentId}` :
//       `${this.baseUrl}/Agent/GetChildren`;

//     return this.http.get<any[]>(url);
//   }
//   findShareHolderByFolio(scCode:string, folio:number){
//     return this.http.get<any>(
//       `${this.baseUrl}/ShareHolder/${scCode}/Folios/${folio}`
//     );
//   }
//     findShareHolderByCustomer(customerNo:string){
//     return this.http.get<any>(
//       `${this.baseUrl}/ShareHolder/Customer/${customerNo}`
//     );
//   }
//    getRoles(){
//     return this.http.get<any[]>(
//       `${this.baseUrl}/Role/GetAll`
//     );
//   }
// getBranches(){
//     return this.http.get<any[]>(
//       `${this.baseUrl}/Branch/GetAll`
//     );
//   }

//    addAgent(data:any){
//     return this.http.post(
//       `${this.baseUrl}/Agent/Create`,
//       data
//     );
//   }
//     createAgent(payload: any) {

//     return this.http.post(
//       `${this.baseUrl}/Agent/Create`,
//       payload
//     );

//   }

//   findByAgentCode(code:string){
//     return this.http.get<any[]>(
//       `${this.baseUrl}/Agent/Code/${code}`
//     );
//   }
//  findByCustomerNo(customerNo:string){
//     return this.http.get<any[]>(
//       `${this.baseUrl}/Agent/CustomerNo/${customerNo}`
//     );
//   }
   
  
// new code 
// import { HttpClient } from '@angular/common/http';
// import { inject, Injectable } from '@angular/core';
// import { Observable, shareReplay } from 'rxjs';

// @Injectable({ providedIn: 'root' })
// export class AgentService {
  private readonly baseUrl = '/api/imkt/api';
  private readonly http = inject(HttpClient);

  // Cache roles & branches — they rarely change
  readonly roles$ = this.http
    .get<any[]>(`${this.baseUrl}/Role/GetAll`)
    .pipe(shareReplay(1));

  readonly branches$ = this.http
    .get<any[]>(`${this.baseUrl}/Branch/GetAll`)
    .pipe(shareReplay(1));

  getChildren(agentId?: number): Observable<any[]> {
    const url = agentId
      ? `${this.baseUrl}/Agent/GetChildren/${agentId}`
      : `${this.baseUrl}/Agent/GetChildren`;
    return this.http.get<any[]>(url);
  }

  getAgentDetails(agentId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/Agent/${agentId}`);
  }

  findShareHolderByFolio(scCode: string, folio: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/ShareHolder/${scCode}/Folios/${folio}`);
  }

  findShareHolderByCustomer(customerNo: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/ShareHolder/Customer/${customerNo}`);
  }

  addAgent(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/Agent/Create`, data);
  }
  activateAgent(agentID: number): Observable<any> {
  return this.http.post(`${this.baseUrl}/Agent/Activate/${agentID}`, {});
}

deactivateAgent(agentID: number): Observable<any> {
  return this.http.post(`${this.baseUrl}/Agent/Deactivate/${agentID}`, {});
}
  findByAgentCode(code: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/Agent/Code/${code}`);
  }

  findByCustomerNo(customerNo: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/Agent/CustomerNo/${customerNo}`);
  }

  getAgentByID(agentID: number): Observable<any> {
  return this.http.get(`${this.baseUrl}/agent/${agentID}`);
}

updateParent(agentID: number, newParentID: number): Observable<any> {
  // alert(agentID )
  // alert( newParentID)
return this.http
    .post(`${this.baseUrl}/Agent/UpdateParent/${agentID}/${newParentID}`, {})
    .pipe(
      timeout(30000),   //  fail after 30s instead of hanging forever
      retry({
        count: 1,       //  retry 2 times before giving error
        delay: 2000     //  wait 2s between retries
      })
    );
}



// readonly staffDesignations$ = this.http
//   .get<any[]>(`${this.baseUrl}/agent/staff-designations`)
//   .pipe(shareReplay(1));

// readonly designations$ = this.http
//   .get<any[]>(`${this.baseUrl}/agent/designations`)
//   .pipe(shareReplay(1));

//   getStaffDesignations(): Observable<any[]> {
//   return this.staffDesignations$;
// }

getDesignations(): Observable<any[]> {
   return this.http.get<any[]>(`${this.baseUrl}/agent/designations`);
}

 getAgentDesignations() {
    return this.http.get<any[]>(`${this.baseUrl}/agent/staff-designations`);
  }
  getDesignationslist(){
    return this.http.get<any[]>(`${this.baseUrl}/agent/designations`);
    
  }
saveAgentDesignation(payload: any) {
  return this.http.post<any>(`${this.baseUrl}/agent/staff-designation/save`,payload);
}

saveDesignation(payload: any) {
  return this.http.post<any>(
     `${this.baseUrl}/agent/designation/save`,payload);
}
getAgentByIdinChild(agentId: number): Observable<any> {
  return this.http.get(`${this.baseUrl}/agent/${agentId}`);
}


updateAgent(data: any): Observable<any> {
  return this.http.post(`${this.baseUrl}/Agent/update`, data);
}
updateMappedBranches(agentID: number, branchIDs: number[]): Observable<any> {
  return this.http.post(`${this.baseUrl}/Agent/UpdateMappedBranches`, {
    agentID,
    branchIDs
  });
}
}
