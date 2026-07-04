# Color Schemes

## 🏖️ beach

Paleta clara e quente, com acento em ciano.

| Token | Hex | Uso |
|---|---|---|
| `bg-cream` | `#F5F1E8` | Fundo geral da página |
| `surface-white` | `#FFFFFF` | Input box, dropdown menu, botões pill |
| `accent-cyan` | `#46B8CF` | Botão de enviar, ícone de logo |
| `active-blue` | `#2C84DB` | Estado ativo (ex: toggle "Web search") |
| `text-primary` | `#3D3929` | Títulos, labels principais |
| `text-secondary` | `#87867F` | Placeholder, texto de apoio |
| `border-subtle` | `#E8E4D9` | Bordas de cards, divisores |

**Hierarquia (dominante → raro):**
1. `bg-cream` — camada base
2. `surface-white` — containers/cards
3. `text-primary` — conteúdo principal
4. `text-secondary` — conteúdo de apoio
5. `border-subtle` — estrutura
6. `accent-cyan` — ação primária / marca
7. `active-blue` — estado ativo único

**Padrão:** paleta neutra dominante + um acento frio (ciano) para ações/marca; azul reservado para indicar estado "ativo".

---

## 🌊 abyss

Paleta escura, tom navy/azul profundo, com acento mint para indicadores de estado ativo.

| Token | Hex | Uso |
|---|---|---|
| `bg-darkest` | `#1A2138` | Fundo externo da página |
| `bg-navy` | `#232C4A` | Fundo da sidebar |
| `bg-panel` | `#2A3457` | Fundo do painel principal |
| `surface-card` | `#303B63` | Cards funcionais (ex: "Send DCR"), inputs |
| `surface-inset` | `#1E2745` | Caixas de detalhe/inset (ex: resumo lateral) |
| `accent-blue` | `#3D7EF5` | Botão de ação primária (CTA) |
| `accent-mint` | `#2EE6A6` | Indicador de item ativo (sidebar, tabs) |
| `text-primary` | `#E8ECF5` | Títulos, item de navegação ativo |
| `text-secondary` | `#8A9BC4` | Labels, itens de navegação inativos |
| `text-muted` | `#5C6B94` | Placeholder, valores desabilitados/apagados |
| `border-subtle` | `#3A4568` | Linhas de input, divisões de painel |

**Hierarquia (dominante → raro):**
1. `bg-darkest` — camada base externa
2. `bg-navy` — base da sidebar
3. `bg-panel` — base da área de conteúdo
4. `surface-card` — containers funcionais
5. `text-secondary` — maioria dos labels/textos
6. `text-primary` — títulos, estados ativos
7. `border-subtle` — linhas estruturais
8. `accent-blue` — CTA primário
9. `accent-mint` — indicador único de "você está aqui"

**Padrão:** base monocromática escura (navy/azul) com dois acentos — azul para ações primárias (botões), mint/verde reservado exclusivamente para indicadores de estado ativo (item de sidebar ativo, aba ativa).
