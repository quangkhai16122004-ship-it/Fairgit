type MaybeHttpError = {
  response?: {
    data?: {
      error?: unknown;
      message?: unknown;
    };
  };
  message?: unknown;
};

export function toErrorMessage(error: unknown, fallback = "Request failed") {
  if (error && typeof error === "object") {
    const e = error as MaybeHttpError;
    const fromApi = e.response?.data?.error ?? e.response?.data?.message;
    if (typeof fromApi === "string" && fromApi.trim()) return fromApi;
    if (typeof e.message === "string" && e.message.trim()) return e.message;
  }
  return fallback;
}
