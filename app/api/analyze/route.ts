import { NextRequest, NextResponse } from 'next/server';
import { analyzeStream } from '@/lib/pixelflow-server/analyzer';
import { pickStrategy } from '@/lib/pixelflow-server/decisionEngine';
import { checkRateLimit, getClientAddress } from '@/lib/pixelflow-server/security';
import type { AnalyzeFailure, AnalyzeSuccess } from '@/lib/pixelflow-server/types';
import { assertSafeUrl } from '@/lib/pixelflow-server/urlValidation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AnalyzeBody = {
  url?: string;
  forceProxy?: boolean;
};

const createJsonResponse = (payload: AnalyzeSuccess | AnalyzeFailure, status: number): NextResponse<AnalyzeSuccess | AnalyzeFailure> => {
  const response = NextResponse.json(payload, { status });
  response.headers.set('cache-control', 'no-store');
  response.headers.set('x-content-type-options', 'nosniff');
  return response;
};

export const POST = async (request: NextRequest): Promise<NextResponse<AnalyzeSuccess | AnalyzeFailure>> => {
  const client = getClientAddress(request.headers);
  const rate = checkRateLimit({
    key: `analyze:${client}`,
    limit: 30,
    windowMs: 60_000,
  });

  if (!rate.allowed) {
    const response = createJsonResponse({ success: false, error: 'Too many analyze requests. Please retry shortly.' }, 429);
    response.headers.set('retry-after', String(Math.ceil((rate.resetAtMs - Date.now()) / 1000)));
    return response;
  }

  let body: AnalyzeBody;

  try {
    body = (await request.json()) as AnalyzeBody;
  } catch {
    return createJsonResponse({ success: false, error: 'Invalid JSON body' }, 400);
  }

  const url = body?.url;
  const forceProxy = Boolean(body?.forceProxy);

  if (!url || typeof url !== 'string') {
    return createJsonResponse({ success: false, error: 'url is required' }, 400);
  }

  try {
    const safeUrl = await assertSafeUrl(url);
    const metadata = await analyzeStream(safeUrl);
    const selectedStrategy = pickStrategy({ metadata, forceProxy });
    // Transcoding is not available in this deployment tier; proxy is the safe fallback.
    const strategy = selectedStrategy === 'transcode' ? 'proxy' : selectedStrategy;
    const playableUrl = strategy === 'proxy' ? `/api/stream?url=${encodeURIComponent(safeUrl)}` : safeUrl;

    const payload: AnalyzeSuccess = {
      success: true,
      playableUrl,
      strategy,
      metadata,
    };

    return createJsonResponse(payload, 200);
  } catch (error) {
    const message = error instanceof Error && /Invalid URL|Only http\/https URLs are allowed|Blocked private network target/.test(error.message)
      ? error.message
      : 'Unable to analyze this source right now.';

    return createJsonResponse({ success: false, error: message }, 400);
  }
};
