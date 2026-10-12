# desvane.io

Blog pessoal em **React + Vite**, com posts escritos em GitHub Issues. Inspirado na estrutura de [k-punk](https://k-punk.org/) e no mockup fornecido: fundo azul, título vermelho, índice de posts com datas e fotografias à direita.

## Publicar pelo GitHub

1. Abra [Novo post](https://github.com/iDavi/desvaneio/issues/new?template=post.md).
2. Escreva o título da issue e o texto em Markdown. A label `post` vem selecionada no modelo.
3. Crie a issue. Uma issue **aberta** com a label **`post`** entra no blog.

Para editar, altere o título ou o corpo da mesma issue. Para retirar do blog, feche a issue ou remova a label `post`; reabrir com a label publica novamente. Outras issues e pull requests não aparecem no blog. Comentários não fazem parte do texto publicado.

O título da issue vira o título do post; o corpo vira seu conteúdo. A data é a de criação da issue, no fuso `America/Sao_Paulo`, e a ordem é do mais recente para o mais antigo. O endereço usa o número da issue (`#/posts/issue-123`), então editar o título mantém o link. Há suporte a links, imagens em Markdown, citações, listas, tabelas, checklists e blocos de código. HTML é ignorado; para imagens, use `![descrição](URL)`.

Um rascunho é uma issue sem a label `post`. Como este repositório é público, rascunhos também ficam visíveis no GitHub. A label de publicação é controlada por quem tem permissão de gerenciar labels no repositório.

## Sincronização e hospedagem

O workflow **Sync blog posts** roda ao criar, editar, rotular, fechar, reabrir, apagar ou transferir issues, ao alterar labels, em mudanças relevantes no código e manualmente pela aba Actions. Ele:

1. Consulta todas as páginas de issues abertas com a label `post`.
2. Atualiza `src/generated/posts.json`, roda a validação e gera o site.
3. Salva uma alteração de conteúdo no repositório, quando necessário, e disponibiliza `blog-build` como artefato na execução do workflow.

O frontend lê essa cópia estática: visitantes não consultam a API do GitHub e não recebem tokens. O `GITHUB_TOKEN` automático das Actions é usado somente durante a sincronização. Falhas de API interrompem a atualização e preservam os posts salvos.

**Esta etapa não ativa GitHub Pages nem configura um domínio.** O workflow gera o build, mas não faz deploy. Quando a hospedagem for conectada, a etapa de deploy poderá usar o mesmo build após cada atualização. Para atualizar uma cópia local, use `git pull` depois que o workflow terminar, ou rode `npm run sync:posts`.

## Rodar

Use Node.js 22.12+ ou 24 LTS.

```sh
npm install
npm run sync:posts
npm run dev
```

Abra o endereço mostrado pelo Vite. Para gerar e conferir a versão de produção:

```sh
npm run build:blog
npm run preview
```

## Editar

- **Posts:** escreva no GitHub Issues. `src/generated/posts.json` é gerado automaticamente; não edite esse arquivo para publicar.
- **Fonte dos posts:** `blog.config.json` define o repositório, a label e o fuso das datas. O sincronizador fica em `scripts/sync-posts.mjs`.
- **Visual:** `src/styles.css`. As cores ficam nas variáveis no início do arquivo.
- **Fotos:** dez imagens locais em `public/images/`, com Rita Lee vestida de maga. A seleção, a ordem, os textos alternativos e os pins de origem ficam em `src/coverPhotos.js`; a animação fica em `src/CoverSlideshow.jsx`. A seleção inclui um enquadramento aberto e um recorte do retrato sorrindo com a flor vermelha.
- **Nome e descrição:** `index.html` e o título em `src/App.jsx`.

O índice mostra cinco posts por página. `previous` leva aos mais antigos e `next` aos mais recentes; links indisponíveis aparecem atenuados. O arquivo agrupa todos os posts por ano. Cada post tem sua página e navegação própria.

As rotas usam hash (`#/posts/slug`, `#/archive`, `#/page/2`), então links diretos e recarregamentos funcionam em hospedagem estática sem configurar redirecionamentos. Em celulares a foto aparece depois do conteúdo.

## Troca de fotos

As dez imagens são pré-carregadas localmente. Depois do carregamento, a imagem muda a cada **5 segundos**, com esmaecimento de **1 segundo** (incluído no intervalo). Um ciclo completo dura **50 segundos**. A moldura mantém o mesmo tamanho durante a troca. O botão de pausa aparece ao passar o mouse ou focar com o teclado; em telas de toque fica visível. A troca automática fica desativada quando o visitante prefere movimento reduzido. O temporizador é limpo ao sair do componente e não avança enquanto a aba está oculta.

Fotos baixadas do Pinterest aberto no Chrome:

- [Rita Lee com Os Mutantes, com capas e chapéus](https://br.pinterest.com/pin/1150177192369272762/).
- [Retrato frontal de Rita Lee com chapéu, capa e flor vermelha](https://br.pinterest.com/pin/704180091768806404/).
- [Retrato com a cabeça inclinada](https://br.pinterest.com/pin/252131279135563710/).
- [Retrato em preto e branco com a mão junto ao rosto](https://br.pinterest.com/pin/18718154694427829/).
- [Os Mutantes de frente](https://br.pinterest.com/pin/21884748173601364/).
- [Retrato com expressão séria e flor vermelha](https://br.pinterest.com/pin/216595063324550454/).
- [Os Mutantes fotografados de cima](https://br.pinterest.com/pin/21462535720575638/).
- [Rita Lee com gato preto](https://br.pinterest.com/pin/8866530511130473/).
- [Retrato sorrindo em enquadramento aberto](https://br.pinterest.com/pin/27232772742533237/).
- [Rita Lee sentada em preto e branco](https://br.pinterest.com/pin/18718154694427826/).

Não é necessário banco de dados ou backend próprio para escrever posts; o editor é o GitHub. Para hospedar, publique a pasta `dist/` produzida pelo build. Para hospedar em um subdiretório (por exemplo, GitHub Pages em `/desvaneio/`), configure `base: '/desvaneio/'` no Vite; os caminhos dos assets já acompanham essa configuração.

## Validar

```sh
npm test
npm run build:blog
```

Os testes verificam seleção de posts, paginação da API, edição com URLs estáveis, fuso das datas, remoção e republicação, preservação do conteúdo em falhas e renderização segura de Markdown. O comando `npm run build` usa os posts já salvos e funciona sem rede; `npm run build:blog` sincroniza antes de gerar o site.
