function readHeader(
  headers: Headers | Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const value =
    headers instanceof Headers ? headers.get(name) : headers[name.toLowerCase()] ?? headers[name];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value ?? undefined;
}

export function getRequestHost(request?: { headers: Headers | Record<string, string | string[] | undefined> } | null): string | undefined {
  if (!request) {
    return undefined;
  }

  const forwardedHost = readHeader(request.headers, 'x-forwarded-host');
  const rawHost = forwardedHost?.split(',')[0]?.trim() ?? readHeader(request.headers, 'host') ?? '';
  const host = rawHost.split(':')[0].toLowerCase();
  return host || undefined;
}
