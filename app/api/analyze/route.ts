import { NextRequest, NextResponse } from 'next/server';
import { analyzeStream } from '@/lib/analyzer';
import { pickStrategy } from '@/lib/decisionEngine';
import { checkRateLimit, getClientAddress } from '@/lib/security';
import { resolvePlayableSource, SourceResolutionError } from '@/lib/sourceResolver';
import type { AnalyzeFailure, AnalyzeSuccess } from '@/lib/types';
import { assertSafeUrl } from '@/lib/urlValidation';

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
		const resolvedSource = await resolvePlayableSource(url);
		const safeUrl = await assertSafeUrl(resolvedSource.url);
		const metadata = await analyzeStream(safeUrl);
		const selectedStrategy = pickStrategy({ metadata, forceProxy });
		// Transcoding is not available in this deployment tier; proxy is the safe fallback.
		const strategy = forceProxy || resolvedSource.sourceResolution.provider === 'pixeldrain' || selectedStrategy === 'transcode'
			? 'proxy'
			: selectedStrategy;
		const playableUrl = strategy === 'proxy' ? `/api/stream?url=${encodeURIComponent(safeUrl)}` : safeUrl;

		const payload: AnalyzeSuccess = {
			success: true,
			playableUrl,
			strategy,
			metadata,
			sourceResolution: resolvedSource.sourceResolution,
		};

		return createJsonResponse(payload, 200);
	} catch (error) {
		if (error instanceof SourceResolutionError) {
			return createJsonResponse({
				success: false,
				error: error.message,
				sourceResolution: error.sourceResolution,
			}, 400);
		}

		const message = error instanceof Error && /Invalid URL|Only http\/https URLs are allowed|Blocked private network target/.test(error.message)
			? error.message
			: 'Unable to analyze this source right now.';

		return createJsonResponse({ success: false, error: message }, 400);
	}
};
