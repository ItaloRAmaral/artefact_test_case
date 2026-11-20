export interface ToastMessage {
  id: number;
  kind: 'success' | 'error';
  text: string;
}

export type ShowToast = (kind: ToastMessage['kind'], text: string) => void;
