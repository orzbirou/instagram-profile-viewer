import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfilePostsGridComponent } from './profile-posts-grid.component';

describe('ProfilePostsGridComponent', () => {
  let component: ProfilePostsGridComponent;
  let fixture: ComponentFixture<ProfilePostsGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilePostsGridComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePostsGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
