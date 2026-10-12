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

Este esboço não precisa de chave, backend ou banco de dados. O conteúdo é editado no código; não há painel de publicação. Para hospedar, publique a pasta `dist/` produzida pelo build. Para hospedar em um subdiretório (por exemplo, GitHub Pages em `/desvaneio/`), configure `base: '/desvaneio/'` no Vite; os caminhos dos assets já acompanham essa configuração.
