/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { NetworktestComponent } from './networktest.component';

describe('NetworktestComponent', () => {
  let component: NetworktestComponent;
  let fixture: ComponentFixture<NetworktestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NetworktestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworktestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
