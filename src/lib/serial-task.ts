/** Keep anonymous response writes ordered, including after a failed request. */
export function createSerialTask() {
  let tail: Promise<unknown> = Promise.resolve();
  return function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const next = tail.then(task);
    tail = next.catch(() => undefined);
    return next;
  };
}