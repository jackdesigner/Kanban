# Design Kanban

Board Kanban para acompanhar o processo de design de sistemas para totens.

## Stack
- **Next.js 14** (App Router)
- **@hello-pangea/dnd** — drag and drop
- **localStorage** — persistência local (sem banco)
- Design: grayscale, Consolas, flat styling

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

## Deploy no Vercel (passo a passo sem terminal)

1. **Crie o repositório no GitHub**
   - Acesse github.com → "New repository"
   - Nome sugerido: `design-kanban`
   - Visibilidade: Privado (recomendado)
   - **Não** inicialize com README (já existe)
   - Clique em "Create repository"

2. **Suba os arquivos** (se não tiver Git configurado, use GitHub Desktop)
   - Baixe [GitHub Desktop](https://desktop.github.com/)
   - File → Add local repository → selecione a pasta deste projeto
   - Commit "initial commit" → Push to origin

3. **Deploy no Vercel**
   - Acesse [vercel.com](https://vercel.com) → "Add New Project"
   - Importe o repositório `design-kanban`
   - Framework: Next.js (detecta automático)
   - Clique em **Deploy**
   - Pronto — URL pública gerada em ~1 min

## Funcionalidades

- 13 colunas fixas do processo de design
- Cards com título, notas, owner, due date, checklist de features, ajustes feitos/pendentes, tag "Totem prévio"
- Drag and drop entre colunas (owner atualiza automaticamente)
- Filtro por responsável (Eu / Cliente / Interno)
- Due date com alerta visual (⚠ perto / ⚠ atrasado)
- Exportar board como JSON
- Persistência automática no localStorage

## Estrutura

```
app/
  layout.js       ← Layout raiz + metadata
  page.js         ← Página principal
  globals.css     ← Tokens grayscale + estilos

components/
  KanbanBoard.jsx ← Estado global, DnD, filtros
  KanbanColumn.jsx← Coluna com Droppable
  KanbanCard.jsx  ← Card com tags e progresso
  CardModal.jsx   ← Modal de edição completa

lib/
  initialData.js  ← Definição das 13 colunas e createCard
  storage.js      ← localStorage helpers
  date.js         ← Formatação e status de due date
```
