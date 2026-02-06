// Development-only performance instrumentation
// Logs timing data without exposing sensitive message content

const isDev = import.meta.env.DEV;

interface TimingResult {
  duration: number;
  label: string;
}

export function measureAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  if (!isDev) {
    return fn();
  }

  const start = performance.now();
  return fn().then(
    (result) => {
      const duration = performance.now() - start;
      console.log(`[Perf] ${label}: ${duration.toFixed(2)}ms`);
      return result;
    },
    (error) => {
      const duration = performance.now() - start;
      console.log(`[Perf] ${label} (failed): ${duration.toFixed(2)}ms`);
      throw error;
    }
  );
}

export function measureSync<T>(label: string, fn: () => T): T {
  if (!isDev) {
    return fn();
  }

  const start = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - start;
    console.log(`[Perf] ${label}: ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.log(`[Perf] ${label} (failed): ${duration.toFixed(2)}ms`);
    throw error;
  }
}

export class PerfTimer {
  private start: number;
  private label: string;

  constructor(label: string) {
    this.label = label;
    this.start = performance.now();
  }

  end(): number {
    const duration = performance.now() - this.start;
    if (isDev) {
      console.log(`[Perf] ${this.label}: ${duration.toFixed(2)}ms`);
    }
    return duration;
  }

  lap(sublabel: string): void {
    const duration = performance.now() - this.start;
    if (isDev) {
      console.log(`[Perf] ${this.label} - ${sublabel}: ${duration.toFixed(2)}ms`);
    }
  }
}
