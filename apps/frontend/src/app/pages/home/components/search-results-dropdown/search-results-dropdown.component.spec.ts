import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchResultsDropdownComponent } from './search-results-dropdown.component';

describe('SearchResultsDropdownComponent', () => {
  let component: SearchResultsDropdownComponent;
  let fixture: ComponentFixture<SearchResultsDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchResultsDropdownComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchResultsDropdownComponent);
    component = fixture.componentInstance;
    
    // Set required inputs
    fixture.componentRef.setInput('isOpen', false);
    fixture.componentRef.setInput('results', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
