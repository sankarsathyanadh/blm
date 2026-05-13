/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ExcelReportService } from './excel-report.service';

describe('Service: ExcelReport', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExcelReportService]
    });
  });

  it('should ...', inject([ExcelReportService], (service: ExcelReportService) => {
    expect(service).toBeTruthy();
  }));
});
