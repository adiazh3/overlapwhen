import { describe, expect, it } from "vitest";
import { createSerialTask } from "@/lib/serial-task";

describe("availability write ordering", () => {
  it("finishes the first response before saving the next selection", async () => {
    const enqueue = createSerialTask();
    const writes: number[][] = [];
    let finish: (() => void) | undefined;
    const first = enqueue(async () => {
      await new Promise<void>((resolve) => { finish = resolve; });
      writes.push([10]);
    });
    const second = enqueue(async () => { writes.push([10, 20]); });
    await Promise.resolve();
    expect(writes).toEqual([]);
    finish?.();
    await Promise.all([first, second]);
    expect(writes).toEqual([[10], [10, 20]]);
  });

  it("allows a retry after a failed response", async () => {
    const enqueue = createSerialTask();
    await expect(enqueue(async () => { throw new Error("offline"); })).rejects.toThrow("offline");
    await expect(enqueue(async () => [10, 20])).resolves.toEqual([10, 20]);
  });
});