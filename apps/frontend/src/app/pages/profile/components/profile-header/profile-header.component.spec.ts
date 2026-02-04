import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileHeaderComponent } from './profile-header.component';

describe('ProfileHeaderComponent', () => {
  let component: ProfileHeaderComponent;
  let fixture: ComponentFixture<ProfileHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileHeaderComponent);
    component = fixture.componentInstance;
    
    // Set required input
    fixture.componentRef.setInput('profile', {
      username: 'testuser',
      fullName: 'Test User',
      bio: 'Test bio',
      profilePicUrl: 'test.jpg',
      posts: 10,
      followers: 100,
      following: 50,
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
