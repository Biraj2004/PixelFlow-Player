import dns from 'node:dns/promises';
import net from 'node:net';

const PRIVATE_V4 = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
];

const isPrivateIp = (ip: string): boolean => {
  if (net.isIPv4(ip)) {
    return PRIVATE_V4.some((pattern) => pattern.test(ip));
  }

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80');
  }

  return true;
};

export const assertSafeUrl = async (rawUrl: string): Promise<string> => {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http/https URLs are allowed');
  }

  const records = await dns.lookup(parsed.hostname, { all: true });

  if (!records.length) {
    throw new Error('Unable to resolve host');
  }

  if (records.some((record) => isPrivateIp(record.address))) {
    throw new Error('Blocked private network target');
  }

  return parsed.toString();
};
