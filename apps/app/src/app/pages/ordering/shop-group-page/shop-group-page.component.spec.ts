import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShopGroupPageComponent } from './shop-group-page.component';

describe('ShopGroupPageComponent', () => {
  let component: ShopGroupPageComponent;
  let fixture: ComponentFixture<ShopGroupPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShopGroupPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShopGroupPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
