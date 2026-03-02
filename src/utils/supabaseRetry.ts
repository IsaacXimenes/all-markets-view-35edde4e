// Utilitário de retry para operações Supabase
// Retenta apenas erros de rede/timeout, não erros de lógica (400/403/422)

const RETRYABLE_MESSAGES = [
  'fetch', 'network', 'timeout', 'aborted', 'ECONNREFUSED', 'ENOTFOUND',
  'Failed to fetch', 'NetworkError', 'Load failed', 'ERR_NETWORK',
];

function isRetryableError(error: any): boolean {
  if (!error) return false;
  // HTTP status errors that should NOT be retried
  const status = error?.status || error?.code;
  if (typeof status === 'number' && status >= 400 && status < 500) return false;
  // String-based detection
  const msg = String(error?.message || error || '').toLowerCase();
  return RETRYABLE_MESSAGES.some(keyword => msg.includes(keyword.toLowerCase()));
}

export async function withRetry<T extends { data: any; error: any }>(
  operation: () => PromiseLike<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: any = null;
  let lastResult: T | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();

      if (!result.error) return result;

      if (!isRetryableError(result.error)) return result;

      lastResult = result;
      lastError = result.error;
      console.warn(`[RETRY] Tentativa ${attempt}/${maxRetries} falhou (retentável):`, result.error?.message || result.error);
    } catch (err) {
      // Exceções thrown (ex: fetch failure)
      if (!isRetryableError(err)) throw err;
      lastError = err;
      console.warn(`[RETRY] Tentativa ${attempt}/${maxRetries} - exceção retentável:`, (err as any)?.message || err);
    }

    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
      console.log(`[RETRY] Aguardando ${delay}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error(`[RETRY] Todas as ${maxRetries} tentativas falharam.`);
  return lastResult || ({ data: null, error: lastError } as any);
}
