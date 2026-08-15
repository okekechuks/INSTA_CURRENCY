declare namespace chrome {
  namespace runtime {
    const onInstalled: {
      addListener(callback: () => void): void;
    };
  }

  namespace storage {
    interface StorageChange {
      newValue?: unknown;
      oldValue?: unknown;
    }

    interface StorageArea {
      get(keys?: string | string[] | Record<string, unknown>): Promise<Record<string, unknown>>;
      set(items: Record<string, unknown>): Promise<void>;
    }

    const onChanged: {
      addListener(callback: (changes: Record<string, StorageChange>, areaName: string) => void): void;
    };
    const sync: StorageArea;
  }
}
