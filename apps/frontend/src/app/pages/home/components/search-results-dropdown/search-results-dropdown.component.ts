import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-search-results-dropdown',
  standalone: true,
  templateUrl: './search-results-dropdown.component.html',
  styleUrl: './search-results-dropdown.component.scss',
})
export class SearchResultsDropdownComponent {
  isOpen = input.required<boolean>();
  results = input.required<string[]>();
  select = output<string>();

  onSelect(result: string): void {
    this.select.emit(result);
  }
}
