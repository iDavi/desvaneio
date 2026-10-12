# desvane.io

Esboço de um blog pessoal em **React + Vite**, inspirado na estrutura de [k-punk](https://k-punk.org/) e no mockup fornecido: fundo azul, título vermelho, índice de posts com datas e uma fotografia à direita.

## Rodar

Use Node.js 22.12+ ou 24 LTS.

```sh
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite. Para gerar e conferir a versão de produção:

```sh
npm run build
npm run preview
```

## Editar

- **Posts:** `src/posts.js`. Cada entrada tem `slug` único, `date` em `YYYY-MM-DD`, `title` e um array de parágrafos. A ordem do array define a ordem de exibição; coloque os mais recentes primeiro. As datas e os textos atuais são fictícios, para demonstrar o layout; os textos não são transcrições de Mark Fisher.
- **Visual:** `src/styles.css`. As cores ficam nas variáveis no início do arquivo.
- **Fotos:** `public/images/cover.jpg` e `public/images/rita-lee-maga.jpg`. Ambas mostram Rita Lee vestida de maga olhando para a câmera. A seleção e os textos alternativos ficam em `src/CoverSlideshow.jsx`.
- **Nome e descrição:** `index.html` e o título em `src/App.jsx`.

O índice mostra cinco posts por página. `previous` leva aos mais antigos e `next` aos mais recentes; links indisponíveis aparecem atenuados. O arquivo agrupa todos os posts por ano. Cada post tem sua página e navegação própria.

As rotas usam hash (`#/posts/slug`, `#/archive`, `#/page/2`), então links diretos e recarregamentos funcionam em hospedagem estática sem configurar redirecionamentos. Em celulares a foto aparece depois do conteúdo.

## Troca de fotos

As duas fotos são pré-carregadas localmente. Depois do carregamento, a imagem muda a cada **5 segundos**, com esmaecimento de **1 segundo** (incluído no intervalo). A moldura mantém o mesmo tamanho durante a troca. O botão de pausa aparece ao passar o mouse ou focar com o teclado; em telas de toque fica visível. A troca automática fica desativada quando o visitante prefere movimento reduzido. O temporizador é limpo ao sair do componente e não avança enquanto a aba está oculta.

Fotos baixadas do Pinterest aberto no Chrome:

- [Rita Lee com Os Mutantes, com capas e chapéus](https://br.pinterest.com/pin/1150177192369272762/).
- [Retrato frontal de Rita Lee com chapéu, capa e flor vermelha](https://br.pinterest.com/pin/704180091768806404/).

Este esboço não precisa de chave, backend ou banco de dados. O conteúdo é editado no código; não há painel de publicação. Para hospedar, publique a pasta `dist/` produzida pelo build. Para hospedar em um subdiretório (por exemplo, GitHub Pages em `/desvaneio/`), configure `base: '/desvaneio/'` no Vite; os caminhos dos assets já acompanham essa configuração.
