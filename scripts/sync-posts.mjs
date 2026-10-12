import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

export function issueToPost(issue, timeZone) {
  if (!Number.isSafeInteger(issue.number) || issue.number < 1 || typeof issue.title !== 'string' || (issue.body != null && typeof issue.body !== 'string')) {
    throw new Error('GitHub returned an invalid post. The saved posts have not been replaced.');
  }
  const created = new Date(issue.created_at);
  if (Number.isNaN(created.getTime())) throw new Error(`Issue #${issue.number} has an invalid creation date.`);
  const parts = new Intl.DateTimeFormat('en', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(created);
  const part = (type) => parts.find((entry) => entry.type === type).value;
  return {
    number: issue.number,
    slug: `issue-${issue.number}`,
    title: issue.title,
    date: `${part('year')}-${part('month')}-${part('day')}`,
    createdAt: issue.created_at,
    body: issue.body ?? '',
    issueUrl: `https://github.com/${issue.repository}/issues/${issue.number}`,
  };
}

export async function fetchPublishedPosts({ config, fetchImpl = fetch, token = process.env.GITHUB_TOKEN }) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(config.repository) || !config.label?.trim()) {
    throw new Error('Check repository and label in blog.config.json.');
  }
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2026-03-10',
    'User-Agent': 'desvaneio-post-sync',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const posts = [];
  for (let page = 1; ; page += 1) {
    const url = new URL(`https://api.github.com/repos/${config.repository}/issues`);
    url.search = new URLSearchParams({ state: 'open', labels: config.label, sort: 'created', direction: 'desc', per_page: '100', page: String(page) });
    const response = await fetchImpl(url, { headers, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`GitHub API returned HTTP ${response.status}. The saved posts have not been replaced.`);
    const issues = await response.json();
    if (!Array.isArray(issues)) throw new Error('GitHub returned an unexpected response. The saved posts have not been replaced.');

    for (const issue of issues) {
      const published = issue.state === 'open' && !('pull_request' in issue) && issue.labels?.some((label) =>
        (typeof label === 'string' ? label : label.name)?.toLowerCase() === config.label.toLowerCase(),
      );
      if (published) posts.push(issueToPost({ ...issue, repository: config.repository }, config.timeZone));
    }
    if (issues.length < 100) break;
  }
  return posts.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.number - a.number);
}

export async function syncPosts({ config, outputPath, fetchImpl, token } = {}) {
  config ??= JSON.parse(await readFile(resolve(projectRoot, 'blog.config.json'), 'utf8'));
  outputPath ??= resolve(projectRoot, 'src/generated/posts.json');
  const posts = await fetchPublishedPosts({ config, fetchImpl, token });
  const contents = `${JSON.stringify({ repository: config.repository, posts }, null, 2)}\n`;
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(`${outputPath}.tmp`, contents, 'utf8');
  await rename(`${outputPath}.tmp`, outputPath);
  return posts;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const posts = await syncPosts();
    console.log(`Synced ${posts.length} published post(s) from GitHub Issues.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
