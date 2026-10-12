export function resolveRoute({ pathname, hash, basePath, posts, pageSize }) {
  if (!pathname.startsWith(basePath)) return { kind: 'missing' };
  const postPath = pathname.slice(basePath.length).match(/^posts\/(issue-\d+)\/?$/);
  if (postPath) {
    const post = posts.find((entry) => entry.slug === postPath[1]);
    return post ? { kind: 'post', post } : { kind: 'missing' };
  }
  if (pathname !== basePath && pathname !== `${basePath}index.html`) return { kind: 'missing' };
  const path = hash.replace(/^#\/?/, '').split('/');
  if (!path[0] && path.length === 1) return { kind: 'index', page: 1 };
  if (path[0] === 'archive' && path.length === 1) return { kind: 'archive' };
  if (path[0] === 'posts' && path.length === 2) {
    const post = posts.find((entry) => entry.slug === path[1]);
    return post ? { kind: 'post', post } : { kind: 'missing' };
  }
  const page = Number(path[1]);
  if (path[0] === 'page' && path.length === 2 && Number.isInteger(page) && page > 0 && page <= Math.ceil(posts.length / pageSize)) {
    return { kind: 'index', page };
  }
  return { kind: 'missing' };
}
