export class ScrapingError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = true,
    public details?: any,
  ) {
    super(message);
    this.name = 'ScrapingError';
  }
}
