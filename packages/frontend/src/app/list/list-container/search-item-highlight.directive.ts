import { Directive, ElementRef, HostBinding, inject, Input } from '@angular/core';
import { Highlightable } from '@angular/cdk/a11y';

@Directive({
  selector: '[appSearchItemHighlight]',
  standalone: true,
  exportAs: 'appSearchItemHighlight',
})
export class SearchItemHighlightDirective implements Highlightable {
  private readonly elementRef = inject(ElementRef);

  @HostBinding('class.active') isActive = false;
  @Input() disabled = false;

  setActiveStyles(): void {
    this.isActive = true;
    this.elementRef.nativeElement.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }

  setInactiveStyles(): void {
    this.isActive = false;
  }
}
