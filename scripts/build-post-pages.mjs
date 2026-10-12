import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PostBody from '../src/PostBody.js';

const siteUrl = 'https://desvane.io/';
const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

export function postPreview(post) {
  let image;
  renderToStaticMarkup(createElement(PostBody, {
    body: post.body,
    components: {
      img: ({ node, ...props }) => {
        if (!image && props.src) {
          try {
            const url = new URL(props.src, siteUrl);
            if (['https:', 'http:'].includes(url.protocol)) image = { src: url.href, alt: props.alt || post.title };
          } catch { /* An invalid image URL is not used in the preview. */ }
        }
        return createElement('img', props);
      },
    },
  }));
  return image ?? { src: `${siteUrl}images/cover.jpg`, alt: 'Rita Lee vestida de maga' };
}

export function renderPostPage(template, post) {
  if (!/^issue-\d+$/.test(post.slug)) throw new Error('Invalid post slug');
  const title = escape(post.title);
  const url = `${siteUrl}posts/${post.slug}/`;
  const image = postPreview(post);
  return template
    .replace(/<title>.*?<\/title>/, () => `<title>${title} — desvane.io</title>`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`)
    .replace(/(<meta property="og:type" content=")[^"]*/, '$1article')
    .replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*/g, (_, prefix) => `${prefix}${title}`)
    .replace(/(<meta property="og:url" content=")[^"]*/, (_, prefix) => `${prefix}${url}`)
    .replace(/(<meta (?:property="og:image"|name="twitter:image") content=")[^"]*/g, (_, prefix) => `${prefix}${escape(image.src)}`)
    .replace(/(<meta (?:property="og:image:alt"|name="twitter:image:alt") content=")[^"]*/g, (_, prefix) => `${prefix}${escape(image.alt)}`);
}

export async function buildPostPages({ outputDirectory, posts } = {}) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  outputDirectory ??= resolve(root, 'dist');
  posts ??= JSON.parse(await readFile(resolve(root, 'src/generated/posts.json'), 'utf8')).posts;
  const template = await readFile(resolve(outputDirectory, 'index.html'), 'utf8');
  for (const post of posts) {
    const html = renderPostPage(template, post);
    const directory = resolve(outputDirectory, 'posts', post.slug);
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, 'index.html'), html);
  }
  return posts.length;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Built ${await buildPostPages()} post preview page(s).`);
}
