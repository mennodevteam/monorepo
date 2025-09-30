import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebScriptsComponent } from './web-scripts.component';

describe('WebScriptsComponent', () => {
  let component: WebScriptsComponent;
  let fixture: ComponentFixture<WebScriptsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebScriptsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WebScriptsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
