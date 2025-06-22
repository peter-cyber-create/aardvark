export type ApiResponse<T> = {
  data?: T;
  error?: string;
  status: number;
};

export async function fetchApi<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies in the request
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || 'An error occurred',
        status: response.status,
      };
    }

    return {
      data: data as T,
      status: response.status,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'An error occurred',
      status: 500,
    };
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An error occurred';
}

export type ApiError = {
  error: string;
  status: number;
};

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    'status' in error
  );
}

