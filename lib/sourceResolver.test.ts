import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSourceStatusLabel,
  extractPlayableFromTeraboxHtml,
  isTeraBoxUrl,
  resolvePixeldrainSource,
} from './sourceResolver.ts';

test('extractPlayableFromTeraboxHtml extracts escaped dlink url', () => {
  const html = '<script>window.__DATA__={"dlink":"https:\\/\\/d.teraboxcdn.com\\/video\\/sample.mp4\\?token=abc\\u0026exp=42"}</script>';
  const result = extractPlayableFromTeraboxHtml(html);
  assert.equal(result, 'https://d.teraboxcdn.com/video/sample.mp4?token=abc&exp=42');
});

test('extractPlayableFromTeraboxHtml extracts plain media url', () => {
  const html = '<div>https://media.teraboxcdn.com/stream/master.m3u8?auth=ok</div>';
  const result = extractPlayableFromTeraboxHtml(html);
  assert.equal(result, 'https://media.teraboxcdn.com/stream/master.m3u8?auth=ok');
});

test('isTeraBoxUrl identifies terabox links', () => {
  assert.equal(isTeraBoxUrl('https://www.terabox.com/s/abc123'), true);
  assert.equal(isTeraBoxUrl('https://example.com/video.mp4'), false);
});

test('resolvePixeldrainSource converts /u/:id share links to API download links', () => {
  const result = resolvePixeldrainSource('https://pixeldrain.com/u/AbC123xY');
  assert.equal(result?.url, 'https://pixeldrain.com/api/file/AbC123xY?download');
  assert.equal(result?.sourceResolution.provider, 'pixeldrain');
  assert.equal(result?.sourceResolution.status, 'resolved');
});

test('buildSourceStatusLabel returns dedicated terabox auth required message', () => {
  const label = buildSourceStatusLabel({
    provider: 'terabox',
    status: 'auth_required',
  });

  assert.equal(label, 'TeraBox requires authenticated browser session');
});
