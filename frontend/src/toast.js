let toastHandler = null;

export function registerToastHandler(fn) {
  toastHandler = fn;
}

export function showGlobalToast(message, type = "success") {
  if (toastHandler) {
    toastHandler(message, type);
  }
}
