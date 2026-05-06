/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { PdfReportService } from './pdf-report.service';

describe('Service: PdfReport', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PdfReportService]
    });
  });

  it('should ...', inject([PdfReportService], (service: PdfReportService) => {
    expect(service).toBeTruthy();
  }));
});
