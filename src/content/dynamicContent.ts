export interface DebouncedRootQueue<Item> {
  add(item: Item): void;
  cancel(): void;
  has(item: Item): boolean;
  readonly size: number;
  replace(item: Item): void;
}

export interface DynamicContentObserver {
  disconnect(): void;
}

export interface DynamicContentOptions {
  debounceMs?: number;
  maxRootsPerBatch?: number;
}

export function createDebouncedRootQueue<Item>(
  onFlush: (items: Item[]) => void,
  debounceMs = 150,
): DebouncedRootQueue<Item> {
  const pending = new Set<Item>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flush = (): void => {
    timer = undefined;
    if (pending.size === 0) return;

    const items = [...pending];
    pending.clear();
    onFlush(items);
  };

  const schedule = (): void => {
    if (timer !== undefined) return;
    timer = setTimeout(flush, debounceMs);
  };

  return {
    add(item): void {
      pending.add(item);
      schedule();
    },
    cancel(): void {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      pending.clear();
    },
    has(item): boolean {
      return pending.has(item);
    },
    get size(): number {
      return pending.size;
    },
    replace(item): void {
      pending.clear();
      pending.add(item);
      schedule();
    },
  };
}

export function observeDynamicContent(
  root: ParentNode,
  onRootsAdded: (roots: ParentNode[]) => void,
  options: DynamicContentOptions = {},
): DynamicContentObserver {
  const debounceMs = options.debounceMs ?? 150;
  const maxRootsPerBatch = options.maxRootsPerBatch ?? 24;
  let fullPageScanQueued = false;
  const queue = createDebouncedRootQueue<ParentNode>((roots) => {
    fullPageScanQueued = false;
    onRootsAdded(roots);
  }, debounceMs);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        const scanRoot = getScanRoot(node);
        if (!scanRoot || fullPageScanQueued || queue.has(scanRoot)) continue;

        if (queue.size >= maxRootsPerBatch) {
          fullPageScanQueued = true;
          queue.replace(root);
          return;
        }

        queue.add(scanRoot);
      }
    }
  });

  observer.observe(root, { childList: true, subtree: true });

  return {
    disconnect(): void {
      observer.disconnect();
      queue.cancel();
    },
  };
}

function getScanRoot(node: Node): ParentNode | null {
  if (node.nodeType === Node.TEXT_NODE) return node.parentNode as ParentNode | null;
  if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    return node as unknown as ParentNode;
  }

  return null;
}
