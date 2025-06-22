interface Window {
  confirm: (message: string) => boolean;
}

declare global {
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
  }
}
