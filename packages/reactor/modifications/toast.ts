import { AppliableModification } from "../interfaces";

export class ToastModification extends AppliableModification {
  message: string;
  duration: number;

  constructor(doc: Document, message: string, duration: number) {
    super(doc);
    this.message = message;
    this.duration = duration;
  }

  apply(): void {
    createToast(this.message, this.doc, this.duration);
  }

  unapply(): void {
    // can't undo
  }
}

export function createToast(
  message: string,
  doc: Document,
  duration = 3000,
): void {
  const toast = doc.createElement("div");
  toast.className = "fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded";
  toast.textContent = message;
  doc.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, duration);
}
