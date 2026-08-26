# Contrataê Bahia — Landing

Landing page do **Contrataê Bahia**, plataforma que conecta clientes a prestadores de serviço em toda a Bahia.

> Oportunidades para quem faz acontecer.

## Stack

- React 18 + Create React App (`react-scripts`)
- `react-router-dom` para o roteamento SPA
- `lucide-react` para os ícones
- CSS puro por componente, com design tokens em `src/styles/global.css`
- Express (`server.js`) para servir o build em produção com fallback SPA

## Identidade visual

| Cor | Hex | Uso |
| --- | --- | --- |
| Azul da marca | `#123FAE` | cor principal, botões, links, títulos |
| Vermelho da marca | `#E31E24` | destaques, CTAs secundários, detalhes |
| Branco | `#FFFFFF` | fundo das áreas claras |
| Neutros | `#F5F7FC` / `#E3E8F2` / `#5A6480` | fundos de seção, bordas, textos secundários |

Tipografia: **Poppins** para títulos e elementos de marca, **Inter** para texto corrido.

Os arquivos originais da marca ficam em `brand/`. Os assets usados pelo site (logo, ícones, favicon e imagem de Open Graph) são gerados a partir deles e ficam em `public/assets/images/`.

## Instalação

```bash
pnpm install
cp .env.example .env
```

## Scripts

| Comando | Descrição |
| --- | --- |
| `pnpm start` | ambiente de desenvolvimento em `http://localhost:3000` |
| `pnpm build` | gera o build de produção em `build/` |
| `pnpm serve` | serve o build via Express (porta `PORT`, padrão `53002`) |

## Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `REACT_APP_API_URL` | URL base da API. Sem ela, as categorias usam a lista estática de `src/data/categories.js`, a busca mostra estado vazio e o cadastro informa indisponibilidade. |
| `REACT_APP_APP_URL` | URL do app/painel de login. Enquanto vazia, o link "Entrar" do header fica oculto. |
| `PORT` | porta usada pelo `pnpm serve`. |

## Estrutura

```text
brand/                      arquivos originais da logo
public/
  assets/images/            logo, ícones, favicon, imagem de Open Graph
  index.html                metadados, SEO, Open Graph e Twitter Cards
src/
  components/               um .jsx + .css por componente
  data/categories.js        categorias estáticas e resolução de ícones
  styles/global.css         design tokens, tipografia e botões da marca
  utils/                    api, formatação de campos e constantes da marca
```

## Rotas

| Rota | Página |
| --- | --- |
| `/` | landing (hero, categorias, como funciona, CTAs, seção Bahia) |
| `/buscar` | busca de prestadores com filtro por cidade |
| `/cadastro/prestador` | página e modal de cadastro de prestador |
| `/termos` | termos de uso |
| `/privacidade` | política de privacidade |
| `/r/:code` | grava o código de indicação e redireciona para a home |
