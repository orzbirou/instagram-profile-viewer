import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileHighlightsComponent } from './profile-highlights.component';
import type { Highlight } from '../../../../services/highlights-api.service';

describe('ProfileHighlightsComponent', () => {
  let component: ProfileHighlightsComponent;
  let fixture: ComponentFixture<ProfileHighlightsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileHighlightsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileHighlightsComponent);
    component = fixture.componentInstance;
    
    // Set required input before detectChanges
    const mockHighlights: Highlight[] = [
      {
        id: 'h1',
        title: 'Test Highlight',
        coverUrl: 'https://example.com/h1.jpg',
        itemsCount: 3
      }
    ];
    fixture.componentRef.setInput('highlights', mockHighlights);
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
