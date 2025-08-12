import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { DeliveryAreaComponent } from './delivery-area.component';

describe('DeliveryAreaComponent', () => {
  let component: DeliveryAreaComponent;
  let fixture: ComponentFixture<DeliveryAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DeliveryAreaComponent,
        HttpClientTestingModule,
        MatDialogModule,
        TranslateModule.forRoot(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeliveryAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
}); 