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
- **Imagem:** `public/images/cover.jpg`, extraída do mockup fornecido para este esboço. Substitua pelo arquivo original em melhor resolução ou por outra imagem de sua escolha e atualize o texto alternativo em `src/App.jsx`.
- **Nome e descrição:** `index.html` e o título em `src/App.jsx`.

O índice mostra cinco posts por página. `previous` leva aos mais antigos e `next` aos mais recentes; links indisponíveis aparecem atenuados. O arquivo agrupa todos os posts por ano. Cada post tem sua página e navegação própria.

As rotas usam hash (`#/posts/slug`, `#/archive`, `#/page/2`), então links diretos e recarregamentos funcionam em hospedagem estática sem configurar redirecionamentos. Em celulares a foto aparece depois do conteúdo.

Este esboço não precisa de chave, backend ou banco de dados. O conteúdo é editado no código; não há painel de publicação. Para hospedar, publique a pasta `dist/` produzida pelo build. Para hospedar em um subdiretório (por exemplo, GitHub Pages em `/desvaneio/`), configure `base: '/desvaneio/'` no Vite; os caminhos dos assets já acompanham essa configuração.
