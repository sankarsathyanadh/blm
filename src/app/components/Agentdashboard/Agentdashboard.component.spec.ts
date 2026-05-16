/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AgentdashboardComponent } from './Agentdashboard.component';

describe('AgentdashboardComponent', () => {
  let component: AgentdashboardComponent;
  let fixture: ComponentFixture<AgentdashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AgentdashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AgentdashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
