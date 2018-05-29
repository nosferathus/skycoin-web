import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { WalletService } from '../../../services/wallet.service';
import { CreateWalletComponent } from '../../pages/wallets/create-wallet/create-wallet.component';

class MockWalletService {
}

describe('ConfirmationComponent', () => {
  let component: CreateWalletComponent;
  let fixture: ComponentFixture<CreateWalletComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateWalletComponent ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [
        FormBuilder,
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: WalletService, useClass: MockWalletService },
        { provide: MatDialogRef, useValue: {} }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateWalletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});