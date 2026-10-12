import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PostBody from '../src/PostBody.js';
import { fetchPublishedPosts, issueToPost, syncPosts } from '../scripts/sync-posts.mjs';

const config = { repository: 'iDavi/desvaneio', label: 'post', timeZone: 'America/Sao_Paulo' };
const issue = (overrides = {}) => ({
  number: 1, title: 'Um lugar para escrever', body: '**Um texto.**',
  labels: [{ name: 'post' }], state: 'open', created_at: '2026-10-12T01:30:00Z',
  ...overrides,
});
const response = (body) => ({ ok: true, json: async () => body });

test('only open, labeled issues are published; pull requests and drafts stay out', async () => {
  const posts = await fetchPublishedPosts({ config, token: '', fetchImpl: async () => response([
    issue(), issue({ number: 2, state: 'closed' }), issue({ number: 3, labels: [] }),
    issue({ number: 4, pull_request: {} }), issue({ number: 5, labels: ['POST'], body: null }),
  ]) });
  assert.deepEqual(posts.map((post) => post.number), [5, 1]);
  assert.equal(posts[0].body, '');
  assert.equal(posts[1].date, '2026-10-11');
  assert.equal(posts[1].issueUrl, 'https://github.com/iDavi/desvaneio/issues/1');
});

test('title edits preserve the URL and Markdown content', () => {
  const original = issueToPost({ ...issue(), repository: config.repository }, config.timeZone);
  const edited = issueToPost({ ...issue({ title: 'Outro título', body: '# Outra ideia\n\n![Foto](https://example.com/image.jpg)' }), repository: config.repository }, config.timeZone);
  assert.equal(original.slug, edited.slug);
  assert.equal(edited.title, 'Outro título');
  assert.match(edited.body, /!\[Foto\]/);
});

test('all GitHub API pages are fetched and posts are sorted by creation date', async () => {
  const calls = [];
  const first = Array.from({ length: 100 }, (_, i) => issue({ number: i + 1 }));
  const posts = await fetchPublishedPosts({ config, token: 'test-token', fetchImpl: async (url, options) => {
    calls.push({ url: String(url), options });
    return response(calls.length === 1 ? first : [issue({ number: 101, created_at: '2026-10-13T12:00:00Z' })]);
  } });
  assert.equal(posts.length, 101);
  assert.equal(posts[0].number, 101);
  assert.equal(calls.length, 2);
  assert.equal(new URL(calls[1].url).searchParams.get('page'), '2');
  assert.equal(new URL(calls[0].url).searchParams.get('labels'), 'post');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test-token');
});

test('an API error keeps the last saved posts intact', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'desvaneio-posts-'));
  const outputPath = join(directory, 'posts.json');
  try {
    await writeFile(outputPath, 'previous posts');
    await assert.rejects(syncPosts({ config, outputPath, token: '', fetchImpl: async () => ({ ok: false, status: 403 }) }), /HTTP 403/);
    assert.equal(await readFile(outputPath, 'utf8'), 'previous posts');
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('unpublishing removes saved posts and a later reopen restores them', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'desvaneio-posts-'));
  const outputPath = join(directory, 'posts.json');
  const sync = (issues) => syncPosts({ config, outputPath, token: '', fetchImpl: async () => response(issues) });
  try {
    await sync([issue()]);
    assert.equal(JSON.parse(await readFile(outputPath, 'utf8')).posts.length, 1);
    await sync([issue({ state: 'closed' })]);
    assert.deepEqual(JSON.parse(await readFile(outputPath, 'utf8')).posts, []);
    await sync([issue()]);
    assert.equal(JSON.parse(await readFile(outputPath, 'utf8')).posts[0].slug, 'issue-1');
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('unexpected or malformed API data fails instead of publishing a bad snapshot', async () => {
  await assert.rejects(fetchPublishedPosts({ config, token: '', fetchImpl: async () => response({ message: 'error' }) }), /unexpected response/);
  await assert.rejects(fetchPublishedPosts({ config, token: '', fetchImpl: async () => response([issue({ created_at: 'invalid' })]) }), /invalid creation date/);
});

test('post renderer preserves Markdown tables and images while removing scripts and javascript links', () => {
  const body = '**Música**\n\n| disco | ano |\n| --- | --- |\n| Mutantes | 1968 |\n\n![Rita](https://example.com/rita.jpg)\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))';
  const html = renderToStaticMarkup(createElement(PostBody, { body }));
  assert.match(html, /<strong>Música<\/strong>/);
  assert.match(html, /<table>/);
  assert.match(html, /alt="Rita"/);
  assert.doesNotMatch(html, /<script|javascript:/);
});

test('GitHub uploaded HTML images render with dimensions and alt text, without unsafe attributes', () => {
  const src = 'https://github.com/user-attachments/assets/c58774bb-99e2-42a8-b4c5-c8adcf28a762';
  const body = `<img width="467" height="657" alt="Image" src="${src}" onerror="alert(1)" style="position:fixed" />\n\n<img src="javascript:alert(1)" />\n\n<iframe src="https://example.com"></iframe>`;
  const html = renderToStaticMarkup(createElement(PostBody, { body }));
  assert.match(html, /<img[^>]*width="467"[^>]*height="657"[^>]*alt="Image"/);
  assert.ok(html.includes(`src="${src}"`));
  assert.doesNotMatch(html, /onerror|style=|javascript:|<iframe/);
});
