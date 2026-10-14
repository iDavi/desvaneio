import { useEffect, useRef, useSyncExternalStore } from 'react';
import PostBody from './PostBody';
import postData from './generated/posts.json';
import CoverSlideshow from './CoverSlideshow';
import { resolveRoute } from './route';

const posts = postData.posts;
const PAGE_SIZE = 5;

function subscribe(callback) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

function useRoute() {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  const basePath = new URL(import.meta.env.BASE_URL, window.location.origin).pathname;
  return resolveRoute({ pathname: window.location.pathname, hash, basePath, posts, pageSize: PAGE_SIZE });
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
          <a href={`${import.meta.env.BASE_URL}posts/${post.slug}/`}>{post.title}</a>
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
      <a href={`${import.meta.env.BASE_URL}#/archive`}>archive</a>
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
      <nav className="back-navigation" aria-label="Voltar"><a href={import.meta.env.BASE_URL}>← home</a></nav>
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
        <PostBody body={post.body} />
      </div>
      <nav className="article-navigation" aria-label="Navegação entre posts">
        {older && <a href={`${import.meta.env.BASE_URL}posts/${older.slug}/`}>← previous</a>}
        {newer && <a href={`${import.meta.env.BASE_URL}posts/${newer.slug}/`}>next →</a>}
        <a href={`${import.meta.env.BASE_URL}#/archive`}>archive</a>
        <a href={import.meta.env.BASE_URL}>home</a>
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
    if (route.kind === 'post' && !window.location.pathname.includes('/posts/')) {
      window.location.replace(`${import.meta.env.BASE_URL}posts/${route.post.slug}/`);
      return;
    }
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
          <header><h1 className="wordmark"><a href={import.meta.env.BASE_URL} aria-label="desvane.io — início">desvane.io</a></h1></header>
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
        <aside className={`image-column${route.kind === 'post' ? ' is-invisible' : ''}`} aria-label="Imagem de capa" aria-hidden={route.kind === 'post'}>
          <CoverSlideshow visible={route.kind !== 'post'} />
        </aside>
      </div>
    </>
  );
}
