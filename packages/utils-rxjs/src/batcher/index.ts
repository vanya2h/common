import { Observable, OperatorFunction } from "rxjs";

export function batcher<T>(waitTime: number): OperatorFunction<T, T[]> {
  return (source$) =>
    new Observable<T[]>((observer) => {
      let buffer: T[] = [];
      let timerId: any = null;

      const emitBuffer = () => {
        if (buffer.length > 0) {
          observer.next([...buffer]);
          buffer = [];
        }
        clearTimeout(timerId);
        timerId = null;
      };

      const sub = source$.subscribe({
        next: (value) => {
          buffer.push(value);
          if (!timerId) {
            timerId = setTimeout(() => {
              emitBuffer();
            }, waitTime);
          }
        },
        error: (err) => observer.error(err),
        complete: () => {
          emitBuffer();
          observer.complete();
        },
      });

      return () => {
        clearTimeout(timerId);
        sub.unsubscribe();
      };
    });
}
