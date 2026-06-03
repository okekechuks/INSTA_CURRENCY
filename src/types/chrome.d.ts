declare namespace chrome {
  namespace runtime {
    const onInstalled: {
      addListener(callback: () => void): void;
    };
  }
}
