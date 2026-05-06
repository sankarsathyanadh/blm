/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { NetworktreeComponent } from './networktree.component';

describe('NetworktreeComponent', () => {
  let component: NetworktreeComponent;
  let fixture: ComponentFixture<NetworktreeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NetworktreeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworktreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
