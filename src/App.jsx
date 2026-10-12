import { useEffect, useRef, useSyncExternalStore } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import postData from './generated/posts.json';
import CoverSlideshow from './CoverSlideshow';

const posts = postData.posts;
const PAGE_SIZE = 5;

function subscribe(callback) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

function useRoute() {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  const basePath = new URL(import.meta.env.BASE_URL, window.location.origin).pathname;
  if (window.location.pathname !== basePath && window.location.pathname !== `${basePath}index.html`) return { kind: 'missing' };
  const path = hash.replace(/^#\/?/, '').split('/');
  if (!path[0] && path.length === 1) return { kind: 'index', page: 1 };
  if (path[0] === 'archive' && path.length === 1) return { kind: 'archive' };
  if (path[0] === 'posts' && path.length === 2) {
    const post = posts.find((entry) => entry.slug === path[1]);
    return post ? { kind: 'post', post } : { kind: 'missing' };
  }
  const page = Number(path[1]);
  if (path[0] === 'page' && path.length === 2 && Number.isInteger(page) && page > 0 && page <= Math.ceil(posts.length / PAGE_SIZE)) {
    return { kind: 'index', page };
  }
  return { kind: 'missing' };
}

function DateLabel({ date }) {
  return <time dateTime={date}>{date.split('-').reverse().join('.')}</time>;
}

function PostList({ entries }) {
  return (
    <ul className="post-list">
      {entries.map((post) => (
        <li key={post.slug}>
          <DateLabel date={post.date} />
          <span aria-hidden="true"> - </span>
          <a href={`#/posts/${post.slug}`}>{post.title}</a>
        </li>
      ))}
    </ul>
  );
}

function Pagination({ page }) {
  const lastPage = Math.ceil(posts.length / PAGE_SIZE);
  return (
    <nav className="navigation" aria-label="Paginação e arquivo">
      {page < lastPage ? (
        <a href={`#/page/${page + 1}`} aria-label="previous — posts mais antigos">previous</a>
      ) : <span className="unavailable" aria-disabled="true">previous</span>}
      {page > 1 ? (
        <a href={page === 2 ? '#/' : `#/page/${page - 1}`} aria-label="next — posts mais recentes">next</a>
      ) : <span className="unavailable" aria-disabled="true">next</span>}
      <a href="#/archive">archive</a>
    </nav>
  );
}

function Archive() {
  const years = [...new Set(posts.map((post) => post.date.slice(0, 4)))];
  return (
    <section className="archive" aria-labelledby="archive-title">
      <h2 id="archive-title">archive</h2>
      {posts.length === 0 && <p className="empty-state">Ainda não há posts.</p>}
      {years.map((year) => (
        <section className="archive-year" key={year} aria-labelledby={`year-${year}`}>
          <h3 id={`year-${year}`}>{year}</h3>
          <PostList entries={posts.filter((post) => post.date.startsWith(year))} />
        </section>
      ))}
      <nav className="back-navigation" aria-label="Voltar"><a href="#/">← home</a></nav>
    </section>
  );
}

function Article({ post }) {
  const index = posts.indexOf(post);
  const older = posts[index + 1];
  const newer = posts[index - 1];
  return (
    <article className="article">
      <DateLabel date={post.date} />
      <h2>{post.title}</h2>
      <div className="article-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>{post.body}</ReactMarkdown>
      </div>
      <nav className="article-navigation" aria-label="Navegação entre posts">
        {older && <a href={`#/posts/${older.slug}`}>← previous</a>}
        {newer && <a href={`#/posts/${newer.slug}`}>next →</a>}
        <a href="#/archive">archive</a>
        <a href="#/">home</a>
      </nav>
    </article>
  );
}

export default function App() {
  const route = useRoute();
  const main = useRef(null);
  const routeKey = `${route.kind}:${route.page ?? route.post?.slug ?? ''}`;
  const previousRoute = useRef(routeKey);

  useEffect(() => {
    document.title = route.kind === 'missing' ? '404 — Not Found' : route.kind === 'post' ? `${route.post.title} — desvane.io` : route.kind === 'archive' ? 'archive — desvane.io' : 'desvane.io';
    if (previousRoute.current !== routeKey) {
      main.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
      previousRoute.current = routeKey;
    }
  }, [routeKey, route.kind, route.post]);

  if (route.kind === 'missing') {
    return (
      <main className="not-found" ref={main} tabIndex={-1}>
        <img src={`${import.meta.env.BASE_URL}images/not-found.jpg`} alt="404 — Not Found" width="750" height="600" />
      </main>
    );
  }

  return (
    <>
      <a className="skip-link" href="#content" onClick={(event) => { event.preventDefault(); main.current?.focus(); }}>Pular para o conteúdo</a>
      <div className="layout">
        <div className="writing-column">
          <header><h1 className="wordmark"><a href="#/" aria-label="desvane.io — início">desvane.io</a></h1></header>
          <main id="content" ref={main} tabIndex={-1}>
            {route.kind === 'index' && (
              <>
                <h2 className="sr-only">Posts — página {route.page}</h2>
                {posts.length === 0 && <p className="empty-state">Ainda não há posts.</p>}
                <PostList entries={posts.slice((route.page - 1) * PAGE_SIZE, route.page * PAGE_SIZE)} />
                <Pagination page={route.page} />
              </>
            )}
            {route.kind === 'archive' && <Archive />}
            {route.kind === 'post' && <Article post={route.post} />}
          </main>
        </div>
        <aside className="image-column" aria-label="Imagem de capa">
          <CoverSlideshow />
        </aside>
      </div>
    </>
  );
}
