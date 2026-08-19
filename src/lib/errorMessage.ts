export function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object') {
    const anyErr = err as Record<string, unknown>;
    if (typeof anyErr.message === 'string' && anyErr.message) return anyErr.message;
    if (typeof anyErr.details === 'string' && anyErr.details) return anyErr.details;
  }
  return 'No se pudo guardar. Intenta de nuevo.';
}
