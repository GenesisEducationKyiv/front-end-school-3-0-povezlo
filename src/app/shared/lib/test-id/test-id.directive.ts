import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[appTestId]',
  standalone: true
})
export class TestIdDirective implements OnInit {
  @Input() public appTestId!: string;

  constructor(private el: ElementRef<HTMLElement>) {}

  public ngOnInit(): void {
    this.el.nativeElement.setAttribute('data-testid', this.appTestId);
  }
}
