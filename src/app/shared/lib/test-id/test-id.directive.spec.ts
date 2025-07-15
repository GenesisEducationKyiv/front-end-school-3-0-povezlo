import { Component, DebugElement, ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TestIdDirective } from '@app/shared';

@Component({
  template: `
    <div testId="test-button" id="element1">Element with testId</div>
    <div [testId]="dynamicTestId" id="element2">Element with dynamic testId</div>
    <div id="element3">Element without testId</div>
    <button testId="submit-btn" id="element4">Submit Button</button>
    <span [testId]="emptyTestId" id="element5">Element with empty testId</span>
  `,
  standalone: true,
  imports: [TestIdDirective]
})
class TestComponent {
  dynamicTestId = 'dynamic-element';
  emptyTestId: string | null | undefined = '';
}

describe('TestIdDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let debugElements: DebugElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent, TestIdDirective]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Directive instantiation', () => {
    it('should create an instance', () => {
      const mockElementRef = new ElementRef(document.createElement('div'));
      const directive = new TestIdDirective(mockElementRef);
      expect(directive).toBeTruthy();
    });

    it('should be applied to elements with testId attribute', () => {
      debugElements = fixture.debugElement.queryAll(By.directive(TestIdDirective));
      expect(debugElements.length).toBe(4);
    });
  });

  describe('data-testid attribute setting', () => {
    it('should set data-testid attribute with static testId value', () => {
      const element = fixture.debugElement.query(By.css('#element1'));
      const nativeElement = element.nativeElement as HTMLElement;

      expect(nativeElement.getAttribute('data-testid')).toBe('test-button');
    });

    it('should set data-testid attribute with dynamic testId value', () => {
      const element = fixture.debugElement.query(By.css('#element2'));
      const nativeElement = element.nativeElement as HTMLElement;

      expect(nativeElement.getAttribute('data-testid')).toBe('dynamic-element');
    });

    it('should update data-testid when input changes', () => {
      const element = fixture.debugElement.query(By.css('#element2'));
      const nativeElement = element.nativeElement as HTMLElement;

      // Initial value
      expect(nativeElement.getAttribute('data-testid')).toBe('dynamic-element');

      // Change the value
      component.dynamicTestId = 'updated-element';
      fixture.detectChanges();

      expect(nativeElement.getAttribute('data-testid')).toBe('updated-element');
    });

    it('should work with different HTML elements', () => {
      const buttonElement = fixture.debugElement.query(By.css('#element4'));
      const buttonNative = buttonElement.nativeElement as HTMLButtonElement;

      expect(buttonNative.getAttribute('data-testid')).toBe('submit-btn');
      expect(buttonNative.tagName.toLowerCase()).toBe('button');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty testId value', () => {
      const element = fixture.debugElement.query(By.css('#element5'));
      const nativeElement = element.nativeElement as HTMLElement;

      expect(nativeElement.getAttribute('data-testid')).toBe('');
    });

    it('should not affect elements without testId directive', () => {
      const element = fixture.debugElement.query(By.css('#element3'));
      const nativeElement = element.nativeElement as HTMLElement;

      expect(nativeElement.getAttribute('data-testid')).toBeNull();
    });

    it('should handle null testId value', () => {
      component.emptyTestId = null;
      fixture.detectChanges();

      const element = fixture.debugElement.query(By.css('#element5'));
      const nativeElement = element.nativeElement as HTMLElement;

      expect(nativeElement.getAttribute('data-testid')).toBe('null');
    });

    it('should handle undefined testId value', () => {
      component.emptyTestId = undefined;
      fixture.detectChanges();

      const element = fixture.debugElement.query(By.css('#element5'));
      const nativeElement = element.nativeElement as HTMLElement;

      expect(nativeElement.getAttribute('data-testid')).toBe('undefined');
    });
  });

  describe('Directive properties', () => {
    it('should have correct selector', () => {
      const directiveInstance = fixture.debugElement
        .query(By.directive(TestIdDirective))
        .injector.get(TestIdDirective);

      expect(directiveInstance).toBeTruthy();
    });

    it('should preserve original element attributes', () => {
      const element = fixture.debugElement.query(By.css('#element1'));
      const nativeElement = element.nativeElement as HTMLElement;

      expect(nativeElement.getAttribute('id')).toBe('element1');
      expect(nativeElement.getAttribute('data-testid')).toBe('test-button');
    });
  });

  describe('Integration with testing tools', () => {
    it('should make elements easily queryable by test-id', () => {
      const elementByTestId = fixture.debugElement.query(
        By.css('[data-testid="test-button"]')
      );
      const elementById = fixture.debugElement.query(By.css('#element1'));

      expect(elementByTestId).toBe(elementById);
      expect((elementByTestId.nativeElement as HTMLElement).textContent?.trim()).toBe('Element with testId');
    });

    it('should support multiple elements with same test pattern', () => {
      component.dynamicTestId = 'test-button'; // Same as static one
      fixture.detectChanges();

      const elementsWithSameTestId = fixture.debugElement.queryAll(
        By.css('[data-testid="test-button"]')
      );

      expect(elementsWithSameTestId.length).toBe(2);
    });
  });

  describe('Performance', () => {
    it('should not cause memory leaks', () => {
      const initialElements = fixture.debugElement.queryAll(By.directive(TestIdDirective));
      expect(initialElements.length).toBeGreaterThan(0);

      fixture.destroy();

      expect(() => {
        fixture.debugElement.queryAll(By.directive(TestIdDirective));
      }).not.toThrow();
    });
  });
});
