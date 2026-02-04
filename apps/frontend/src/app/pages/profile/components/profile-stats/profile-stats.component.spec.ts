import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileStatsComponent } from './profile-stats.component';

describe('ProfileStatsComponent', () => {
  let component: ProfileStatsComponent;
  let fixture: ComponentFixture<ProfileStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileStatsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileStatsComponent);
    component = fixture.componentInstance;
    
    // Set required inputs
    fixture.componentRef.setInput('posts', 100);
    fixture.componentRef.setInput('followers', 1000);
    fixture.componentRef.setInput('following', 50);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
