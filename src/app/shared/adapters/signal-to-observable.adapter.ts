import { Injectable, Signal, computed } from '@angular/core';
import { Observable, BehaviorSubject, distinctUntilChanged } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

/**
 * Adapter for converting Angular Signals to RxJS Observables
 * Provides backward compatibility for components still using RxJS
 */
@Injectable({
  providedIn: 'root'
})
export class SignalToObservableAdapter {
  /**
   * Converts a Signal to Observable
   * @param signal - Angular Signal to convert
   * @returns Observable emitting signal values
   */
  public static toObservable<T>(signal: Signal<T>): Observable<T> {
    return toObservable(signal);
  }

  /**
   * Converts multiple Signals to a map of Observables
   * @param signals - Object with Signal values
   * @returns Object with Observable values
   */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  public static toObservableMap(
    signals: Record<string, Signal<any>>
  ): Record<string, Observable<any>> {
    const result: Record<string, Observable<any>> = {};

    for (const key in signals) {
      if (Object.prototype.hasOwnProperty.call(signals, key)) {
        const signal = signals[key];
        if (signal != null) {
          result[key] = toObservable(signal);
        }
      }
    }

    return result;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  /**
   * Creates Observable from computed Signal
   * Useful for complex calculations that need to be reactive
   * @param computedSignal - Computed Signal to convert
   * @returns Observable with computed values
   */
  public static fromComputed<T>(computedSignal: Signal<T>): Observable<T> {
    return toObservable(computedSignal);
  }

  /**
   * Конвертирует Signal в Observable
   */
  public signalToObservable<T>(signal: Signal<T>): Observable<T> {
    const subject = new BehaviorSubject<T>(signal());

    // Создаем effect для отслеживания изменений signal
    computed(() => {
      const value = signal();
      subject.next(value);
      return value;
    });

    // В реальном приложении нужно будет управлять жизненным циклом effect

    return subject.asObservable().pipe(
      distinctUntilChanged()
    );
  }

  /**
   * Создает Observable из computed signal
   */
  public computedToObservable<T>(computedSignal: Signal<T>): Observable<T> {
    return this.signalToObservable(computedSignal);
  }
}
