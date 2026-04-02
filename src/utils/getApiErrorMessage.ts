type AxiosLikeError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err
  ) {
    const message = (err as AxiosLikeError).response?.data?.message;
    if (typeof message === "string") return message;
  }
  return fallback;
}
