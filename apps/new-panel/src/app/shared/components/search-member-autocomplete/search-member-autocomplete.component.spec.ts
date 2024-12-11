import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchMemberAutocompleteComponent } from './search-member-autocomplete.component';

describe('SearchMemberAutocompleteComponent', () => {
  let component: SearchMemberAutocompleteComponent;
  let fixture: ComponentFixture<SearchMemberAutocompleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchMemberAutocompleteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchMemberAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
