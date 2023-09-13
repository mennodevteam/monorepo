import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExtendPluginsModalComponent } from './extend-plugins-modal.component';

describe('ExtendPluginsModalComponent', () => {
  let component: ExtendPluginsModalComponent;
  let fixture: ComponentFixture<ExtendPluginsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExtendPluginsModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExtendPluginsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
