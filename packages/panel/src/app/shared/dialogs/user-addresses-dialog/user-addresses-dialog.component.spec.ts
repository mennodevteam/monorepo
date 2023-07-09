import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAddressesDialogComponent } from './user-addresses-dialog.component';

describe('UserAddressesDialogComponent', () => {
  let component: UserAddressesDialogComponent;
  let fixture: ComponentFixture<UserAddressesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserAddressesDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserAddressesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
