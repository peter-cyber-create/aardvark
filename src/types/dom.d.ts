interface HTMLInputElement extends HTMLElement {
  type: string;
  value: string;
  checked: boolean;
}

interface HTMLSelectElement extends HTMLElement {
  value: string;
  selectedIndex: number;
  options: HTMLOptionsCollection;
}

interface HTMLElement {
  tagName: string;
  name?: string;
  value?: string;
}

interface HTMLCanvasElement extends HTMLElement {
  width: number;
  height: number;
  getContext(contextId: '2d'): CanvasRenderingContext2D | null;
  toDataURL(type?: string, quality?: any): string;
}

interface CanvasRenderingContext2D {
  canvas: HTMLCanvasElement;
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  save(): void;
  restore(): void;
  scale(x: number, y: number): void;
  rotate(angle: number): void;
  translate(x: number, y: number): void;
  transform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  clearRect(x: number, y: number, width: number, height: number): void;
  fillRect(x: number, y: number, width: number, height: number): void;
  strokeRect(x: number, y: number, width: number, height: number): void;
  beginPath(): void;
  closePath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  stroke(): void;
  fill(): void;
  drawImage(image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap, dx: number, dy: number): void;
}

interface Document {
  write(text: string): void;
  close(): void;
}

interface Window {
  open(url?: string, target?: string, features?: string): Window | null;
  document: Document;
  print(): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

declare var window: Window;

interface EventListenerOptions {
  capture?: boolean;
  passive?: boolean;
  once?: boolean;
}

interface AddEventListenerOptions extends EventListenerOptions {
  signal?: AbortSignal;
}

interface EventListenerOrEventListenerObject {
  (evt: Event): void;
}
