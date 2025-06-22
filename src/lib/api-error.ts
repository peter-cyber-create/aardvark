export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return Response.json(
      { error: error.message, details: error.details },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    return Response.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }

  return Response.json(
    { error: 'Internal Server Error' },
    { status: 500 }
  );
}
