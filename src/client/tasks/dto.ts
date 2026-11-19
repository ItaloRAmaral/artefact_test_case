export interface ToastMessage {
  id: number;
  kind: 'success' | 'error';
  text: string;
}
