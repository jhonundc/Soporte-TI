export interface ApiSuccessResponse {
  success: true;
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
  success?: false;
}

export type ApiResponse<T> = T | ApiErrorResponse;
