export type ToastType = 'info' | 'success' | 'warning' | 'error';
export type Toast = { id: string; message: string; type: ToastType };
export type ToastContextValue = {
	show: (message: string, opts?: { type?: ToastType; durationMs?: number }) => void;
};
