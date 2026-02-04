import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileBioComponent } from './profile-bio.component';

describe('ProfileBioComponent', () => {
  let component: ProfileBioComponent;
  let fixture: ComponentFixture<ProfileBioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileBioComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileBioComponent);
    component = fixture.componentInstance;
    
    // Set required inputs
    fixture.componentRef.setInput('fullName', 'Test User');
    fixture.componentRef.setInput('bio', 'Test bio');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
