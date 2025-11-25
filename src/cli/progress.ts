/**
 * Progress indicator utilities (#36 - Progress Indicators)
 */

/**
 * Simple progress bar implementation
 */
export class ProgressBar {
  private total: number;
  private current: number;
  private width: number;
  private startTime: number;

  constructor(total: number, width: number = 40) {
    this.total = total;
    this.current = 0;
    this.width = width;
    this.startTime = Date.now();
  }

  update(current: number): void {
    this.current = current;
    this.render();
  }

  private render(): void {
    const percentage = this.total > 0 ? (this.current / this.total) * 100 : 0;
    const filled = Math.round((this.width * this.current) / this.total);
    const empty = this.width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const eta = this.current > 0 
      ? ((this.total - this.current) / this.current * (Date.now() - this.startTime) / 1000).toFixed(1)
      : '0.0';

    process.stdout.write(`\r[${bar}] ${percentage.toFixed(1)}% (${this.current}/${this.total}) | Elapsed: ${elapsed}s | ETA: ${eta}s`);
  }

  complete(): void {
    this.current = this.total;
    this.render();
    process.stdout.write('\n');
  }
}

/**
 * Simple spinner for indeterminate progress
 */
export class Spinner {
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private interval: NodeJS.Timeout | null = null;
  private message: string;

  constructor(message: string = 'Processing...') {
    this.message = message;
  }

  start(): void {
    let frameIndex = 0;
    this.interval = setInterval(() => {
      process.stdout.write(`\r${this.frames[frameIndex]} ${this.message}`);
      frameIndex = (frameIndex + 1) % this.frames.length;
    }, 100);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      process.stdout.write('\r' + ' '.repeat(this.message.length + 10) + '\r');
    }
  }
}

