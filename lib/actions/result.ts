export function success(message: string) {
  return {
    success: true,
    message,
  };
}

export function failure(message: string) {
  return {
    success: false,
    message,
  };
}