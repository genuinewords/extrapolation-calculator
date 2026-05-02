export interface Point {
  x: number;
  y: number;
}

export function validatePoint(x: string, y: string): { valid: boolean; error?: string } {
  const xNum = Number(x);
  const yNum = Number(y);

  if (x === '' || y === '') return { valid: false, error: 'Both fields are required' };
  if (isNaN(xNum) || isNaN(yNum)) return { valid: false, error: 'Must be valid numbers' };
  if (!isFinite(xNum) || !isFinite(yNum)) return { valid: false, error: 'Must be finite numbers' };

  return { valid: true };
}

export function sanitizeInput(input: string): string {
  return input.replace(/[<>'"&]/g, '');
}

export function exportToCSV(points: Point[], result?: { method: string; equation: string; value: number; rSquared: number; confidence: number }): string {
  const header = 'x,y\n';
  const rows = points.map((p) => `${p.x},${p.y}`).join('\n');
  let extra = '';
  if (result) {
    extra += `\n\nMethod,${result.method}\nEquation,${result.equation}\nExtrapolated Value,${result.value}\nR²,${result.rSquared}\nConfidence %,${result.confidence}`;
  }
  return header + rows + extra;
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadPNG(canvas: HTMLCanvasElement | null, filename: string): void {
  if (!canvas) return;
  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}
