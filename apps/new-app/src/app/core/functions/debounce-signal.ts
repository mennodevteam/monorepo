import { Signal, effect, signal } from '@angular/core';

export function debounceSignal<T>(signalRef: Signal<T>, delay = 0) {
  const writableSignal = signal<T>(signalRef());
  let timeOut: any;

  effect(() => {
    const val = signalRef();

    if (timeOut) clearTimeout(timeOut);

    timeOut = setTimeout(() => {
      writableSignal.set(val);
    }, delay);
  });

  return writableSignal;
}
