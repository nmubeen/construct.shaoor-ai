import { toast } from "sonner";

export const notify = {
  success: (message: string) => toast.success(message),

  error: (message: string) => toast.error(message),

  info: (message: string) => toast.info(message),

  warning: (message: string) => toast.warning(message),

  loading: (message: string) => toast.loading(message),

  dismiss: (id?: string | number) => toast.dismiss(id),

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => toast.promise(promise, messages),
};
