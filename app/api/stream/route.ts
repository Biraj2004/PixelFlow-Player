import { NextRequest } from 'next/server';
import { isManifestContent, rewriteManifest } from '@/lib/manifestRewrite';
import { checkRateLimit, getClientAddress } from '@/lib/security';
import {
	extractPlayableFromTeraboxHtml,
	resolvePlayableSource,
	SourceResolutionError,
} from '@/lib/sourceResolver';
import { assertSafeUrl } from '@/lib/urlValidation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_FORWARD_HEADERS = ['range', 'if-range', 'accept', 'accept-encoding'] as const;
const ALLOWED_RESPONSE_HEADERS = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control', 'etag', 'last-modified'] as const;

const jsonError = (error: string, status: number): Response => {
	return new Response(JSON.stringify({ success: false, error }), {
		status,
		headers: {
			'content-type': 'application/json',
			'cache-control': 'no-store',
			'x-content-type-options': 'nosniff',
		},
	});
};

export const GET = async (request: NextRequest): Promise<Response> => {
	const client = getClientAddress(request.headers);
	const rate = checkRateLimit({
		key: `stream:${client}`,
		limit: 120,
		windowMs: 60_000,
	});

	if (!rate.allowed) {
		const response = jsonError('Too many stream proxy requests. Please retry shortly.', 429);
		response.headers.set('retry-after', String(Math.ceil((rate.resetAtMs - Date.now()) / 1000)));
		return response;
	}

	const rawUrl = request.nextUrl.searchParams.get('url');

	if (!rawUrl) {
		return jsonError('url query is required', 400);
	}

	try {
		let resolvedSource: { url: string; sourceResolution: { provider: 'direct' | 'terabox' | 'pixeldrain'; status: 'none' | 'resolved' | 'auth_required' } };

		try {
			resolvedSource = await resolvePlayableSource(rawUrl);
		} catch (error) {
			if (error instanceof SourceResolutionError && error.sourceResolution.provider === 'terabox') {
				resolvedSource = {
					url: rawUrl,
					sourceResolution: error.sourceResolution,
				};
			} else {
				throw error;
			}
		}

		let safeUrl = await assertSafeUrl(resolvedSource.url);
		const forwardHeaders = new Headers();

		ALLOWED_FORWARD_HEADERS.forEach((name) => {
			const value = request.headers.get(name);
			if (value) {
				forwardHeaders.set(name, value);
			}
		});

		let upstream = await fetch(safeUrl, {
			method: 'GET',
			redirect: 'follow',
			headers: forwardHeaders,
			cache: 'no-store',
		});

		const initialContentType = upstream.headers.get('content-type') ?? '';
		const isTeraboxHtml = resolvedSource.sourceResolution.provider === 'terabox' && initialContentType.toLowerCase().includes('text/html');

		if (isTeraboxHtml) {
			const html = await upstream.text();
			const extracted = extractPlayableFromTeraboxHtml(html);

			if (extracted) {
				safeUrl = await assertSafeUrl(extracted);
				upstream = await fetch(safeUrl, {
					method: 'GET',
					redirect: 'follow',
					headers: forwardHeaders,
					cache: 'no-store',
				});
			} else {
				return jsonError('TeraBox public link could not be resolved to a playable stream right now.', 400);
			}
		}

		const responseHeaders = new Headers();
		responseHeaders.set('cache-control', 'no-store');
		responseHeaders.set('x-content-type-options', 'nosniff');

		upstream.headers.forEach((value, key) => {
			if (ALLOWED_RESPONSE_HEADERS.includes(key.toLowerCase() as (typeof ALLOWED_RESPONSE_HEADERS)[number])) {
				responseHeaders.set(key, value);
			}
		});

		if (!upstream.body) {
			return new Response(null, {
				status: upstream.status,
				headers: responseHeaders,
			});
		}

		const contentType = upstream.headers.get('content-type') ?? '';
		const isManifest = isManifestContent(safeUrl, contentType);

		if (isManifest) {
			const manifest = await upstream.text();
			const rewritten = rewriteManifest(manifest, safeUrl, contentType);
			responseHeaders.delete('content-length');

			return new Response(rewritten, {
				status: upstream.status,
				headers: responseHeaders,
			});
		}

		return new Response(upstream.body, {
			status: upstream.status,
			headers: responseHeaders,
		});
	} catch (error) {
		const message = error instanceof Error && /Invalid URL|Only http\/https URLs are allowed|Blocked private network target/.test(error.message)
			? error.message
			: 'Proxy request failed.';

		return jsonError(message, 400);
	}
};
