import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { postPreview, buildPostPages } from '../scripts/build-post-pages.mjs';
import { resolveRoute } from '../src/route.js';

test('previews choose the first safe Markdown or GitHub HTML image and fall back to Rita', () => {
  assert.equal(postPreview({ body: '![Photo](https://example.com/photo.jpg)', title: 'Photo' }).src, 'https://example.com/photo.jpg');
  assert.deepEqual(postPreview({ body: '<img src="javascript:alert(1)" />\n\n<img src="https://github.com/user-attachments/assets/photo" alt="Tower" />', title: 'Title' }), {
    src: 'https://github.com/user-attachments/assets/photo', alt: 'Tower',
  });
  assert.match(postPreview({ body: 'Only text', title: 'Title' }).src, /images\/cover.jpg$/);
});

test('post share pages have their own static metadata, escape issue content, and describe only blog', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'desvaneio-previews-'));
  try {
    const template = await readFile(new URL('../index.html', import.meta.url), 'utf8');
    await writeFile(join(directory, 'index.html'), template);
    const post = { slug: 'issue-3', title: 'Title " & <script> $&', body: '<img src="https://example.com/photo?a=1&amp;b=2" />' };
    await buildPostPages({ outputDirectory: directory, posts: [post] });
    const html = await readFile(join(directory, 'posts/issue-3/index.html'), 'utf8');
    assert.match(html, /<title>Title &quot; &amp; &lt;script&gt; \$&amp; — desvane.io<\/title>/);
    assert.match(html, /property="og:type" content="article"/);
    assert.match(html, /property="og:url" content="https:\/\/desvane.io\/posts\/issue-3\/"/);
    assert.match(html, /property="og:image" content="https:\/\/example.com\/photo\?a=1&amp;b=2"/);
    assert.equal((html.match(/(?:name="description"|property="og:description"|name="twitter:description") content="blog"/g) ?? []).length, 3);
    assert.match(template, /property="og:type" content="website"/);
    assert.doesNotMatch(html, /futuros possíveis/);
    await assert.rejects(buildPostPages({ outputDirectory: directory, posts: [{ ...post, slug: '../../outside' }] }), /Invalid post slug/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('direct post URLs and legacy hashes resolve, while unknown paths still show 404', () => {
  const post = { slug: 'issue-3' };
  const route = (pathname, hash = '') => resolveRoute({ pathname, hash, basePath: '/', posts: [post], pageSize: 5 });
  assert.equal(route('/posts/issue-3/').post, post);
  assert.equal(route('/', '#/posts/issue-3').post, post);
  assert.equal(route('/', '#/archive').kind, 'archive');
  assert.equal(route('/').kind, 'index');
  for (const path of ['/posts/issue-999/', '/unknown', '/posts/issue-3/extra']) assert.equal(route(path).kind, 'missing');
});
