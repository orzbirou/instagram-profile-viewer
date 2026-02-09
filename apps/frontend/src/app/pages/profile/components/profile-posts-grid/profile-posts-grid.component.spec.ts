import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfilePostsGridComponent, Post } from './profile-posts-grid.component';

describe('ProfilePostsGridComponent', () => {
  let component: ProfilePostsGridComponent;
  let fixture: ComponentFixture<ProfilePostsGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilePostsGridComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePostsGridComponent);
    component = fixture.componentInstance;
    
    // Set required input before detectChanges
    const mockPosts: Post[] = [
      {
        id: 'post1',
        imageUrl: 'https://example.com/post1.jpg',
        likesCount: 100,
        commentsCount: 10
      }
    ];
    fixture.componentRef.setInput('posts', mockPosts);
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
