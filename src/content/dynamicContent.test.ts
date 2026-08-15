import { describe, expect, it, vi } from "vitest";

import { createDebouncedRootQueue } from "./dynamicContent";

describe("createDebouncedRootQueue", () => {
  it("batches and de-duplicates pending roots", () => {
    vi.useFakeTimers();
    const flushed: string[][] = [];
    const queue = createDebouncedRootQueue((roots: string[]) => flushed.push(roots), 120);

    queue.add("first");
    queue.add("first");
    queue.add("second");
    vi.advanceTimersByTime(119);
    expect(flushed).toEqual([]);

    vi.advanceTimersByTime(1);
    expect(flushed).toEqual([["first", "second"]]);
    vi.useRealTimers();
  });

  it("can replace queued roots with a single bounded fallback root", () => {
    vi.useFakeTimers();
    const flushed: string[][] = [];
    const queue = createDebouncedRootQueue((roots: string[]) => flushed.push(roots), 120);

    queue.add("one");
    queue.add("two");
    queue.replace("document-body");
    vi.runAllTimers();

    expect(flushed).toEqual([["document-body"]]);
    vi.useRealTimers();
  });
});
