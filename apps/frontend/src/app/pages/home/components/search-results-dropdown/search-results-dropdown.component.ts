import { Component, input, output, signal, effect, HostListener, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import type { SearchUserResult } from '../../../../services/search-api.service';

@Component({
  selector: 'app-search-results-dropdown',
  standalone: true,
  templateUrl: './search-results-dropdown.component.html',
  styleUrl: './search-results-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResultsDropdownComponent {
  isOpen = input.required<boolean>();
  results = input.required<SearchUserResult[]>();
  isLoading = input<boolean>(false);
  error = input<string | null>(null);
  select = output<string>();
  close = output<void>();

  // Active item index for keyboard navigation
  activeIndex = signal<number>(-1);

  constructor(private elementRef: ElementRef) {
    // Reset active index when results change
    effect(() => {
      const currentResults = this.results();
      if (currentResults) {
        this.activeIndex.set(-1);
      }
    });
  }

  @HostListener('document:pointerdown', ['$event'])
  handleClickOutside(event: PointerEvent): void {
    if (!this.isOpen()) return;
    
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.close.emit();
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardNavigation(event: KeyboardEvent): void {
    if (!this.isOpen()) return;

    const resultsCount = this.results()?.length || 0;
    if (resultsCount === 0 && event.key !== 'Escape') return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.update(idx => {
          const newIdx = idx < resultsCount - 1 ? idx + 1 : idx;
          this.scrollActiveItemIntoView(newIdx);
          return newIdx;
        });
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.update(idx => {
          const newIdx = idx > 0 ? idx - 1 : -1;
          this.scrollActiveItemIntoView(newIdx);
          return newIdx;
        });
        break;

      case 'Enter':
        event.preventDefault();
        const activeIdx = this.activeIndex();
        if (activeIdx >= 0 && activeIdx < resultsCount) {
          const selectedUser = this.results()[activeIdx];
          this.onSelect(selectedUser.username);
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.close.emit();
        break;
    }
  }

  private scrollActiveItemIntoView(index: number): void {
    if (index < 0) return;
    
    setTimeout(() => {
      const activeElement = this.elementRef.nativeElement.querySelector(
        `[data-index="${index}"]`
      );
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 0);
  }

  onSelect(username: string): void {
    this.select.emit(username);
  }

  isActive(index: number): boolean {
    return this.activeIndex() === index;
  }

  trackByUsername(index: number, item: SearchUserResult): string {
    return item.username;
  }

  formatFollowers(count?: number): string {
    if (!count) return '';
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return count.toString();
  }
}
