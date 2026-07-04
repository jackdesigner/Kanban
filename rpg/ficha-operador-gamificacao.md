# Ficha do Operador — Camada Gamificada (separada do Kanban)

Regra de ouro: **o Kanban não muda em nada** — nem coluna, nem legenda, nem texto. A única
adição dentro dele é um botão de acesso. Toda a "roupagem" de RPG (nomes de missão, level up,
sons, ícones) vive exclusivamente dentro da tela nova.

---

## 1. Wireframe (mono, cinza — mesma paleta do Kanban)

```
┌──────────────────────────────────────────────────────────────────┐
│ [FICHA DO OPERADOR]                        NÍVEL 07 · DESIGNER DE │
│                                                    SISTEMAS        │
├──────────────────────────────────────────────────────────────────┤
│      ┌──────────┐                                                 │
│      │          │    XP  [██████████░░░░░░░░] 62% → nível 08      │
│      │  [FOTO]  │                                                 │
│      │ anexada  │    PROJETOS CONCLUÍDOS ......... 14             │
│      │ por você │    MISSÕES ATIVAS .............. 5             │
│      └──────────┘    MISSÕES BLOQUEADAS .......... 2              │
│                                                                    │
│                       PRÓXIMO PRAZO: em 2 dias                     │
├──────────────────────────────────────────────────────────────────┤
│ BIO                                              [editar]         │
│ ─────────────────────────────────────────────────────────────── │
│ nome/apelido .......... "Fer"                                     │
│ título .................. "Arquiteta de Interfaces Errantes"      │
│ bio (livre) ............. texto curto que você escreve            │
│ especialidade ........... tag livre, ex: "UI · Totens · React"    │
│ ícone/emblema ........... escolhido numa lista fixa (seção 5)      │
├──────────────────────────────────────────────────────────────────┤
│ ATRIBUTOS (opcional, cosmético)                                   │
│ ─────────────────────────────────────────────────────────────── │
│ criatividade  ███████░░░       (livre, você define o nº)          │
│ agilidade     █████░░░░░       (livre, você define o nº)          │
│ paciência c/ revisão ██████░░░ (livre, você define o nº)          │
├──────────────────────────────────────────────────────────────────┤
│ MISSÕES ATIVAS                          [ordenar: prazo | tipo]   │
...
```

**Sobre a foto/caricatura:** em vez do boneco ASCII, o espaço no topo da ficha vira um upload
de imagem — você anexa sua própria foto ou caricatura (JPG/PNG) e ela é usada como avatar
do personagem. Alguns pontos práticos:

- A imagem é convertida para base64 e guardada junto com o resto dos dados da ficha
  (mesmo localStorage), então não precisa de um servidor de arquivos separado.
- Recorte automático em formato quadrado/circular (moldura com cantos levemente arredondados,
  seguindo o resto do visual) para manter consistência mesmo se a foto original for retangular.
- Campo de upload fica dentro da própria seção de **bio** (`[editar]`), junto com nome, título
  e especialidade — um único lugar pra personalizar tudo.
- Se nenhuma imagem for anexada, mostra um estado vazio simples (ex: ícone `person` do
  Material Symbols, mencionado na seção 5) até você subir uma.

| Campo | Tipo | Observação |
|---|---|---|
| Nome/apelido | texto curto | aparece no cabeçalho da ficha |
| Título | texto curto | tipo "classe secundária" temática, livre |
| Bio | texto longo (poucas linhas) | história/flavor text, livre |
| Especialidade | tag/texto curto | ex: "UI · Totens · React" |
| Emblema/ícone | escolha entre um conjunto fixo de ícones (ver seção 5) | representa visualmente o personagem |
| Atributos cosméticos | 2–4 barras com valor 0–10 definido por você | puramente estético, não é calculado |

Tudo isso mora num formulário simples de edição (botão `[editar]` dentro da própria seção de
bio) — sem afetar em nada o cálculo de nível/missões, que continua 100% vindo do board.

---

## 2. Mapeamento: dado real do board → elemento de jogo

Nada aqui é decorativo sem lastro — todo número vem de algo que já existe no Kanban.

| Elemento do jogo | Vem de onde no board |
|---|---|
| Nível do personagem | Total de cards em "Instalação concluída" (a cada N conclusões, sobe 1 nível) |
| Barra de XP | Progresso parcial rumo ao próximo nível |
| Classe | Fixo: "Designer de Sistemas" |
| Missões ativas (`>`) | Cards fora da coluna final e fora de colunas `waitsOn` |
| Missão bloqueada (`!` / `!!`) | Cards em colunas com `waitsOn: true` (cliente); `!!` se o due date estiver vencido |
| Missão secundária (`~`) | Cards em "Feature pendente" — usa o checklist como sub-objetivos |
| Conquistas recentes | Últimos cards que entraram em "Instalação concluída" |
| Próximo prazo em destaque | Card com o due date mais próximo entre os bloqueados |

---

## 3. Onde colocar o botão (única mudança no Kanban)

- No `topbar` que já existe no Kanban, ao lado dos filtros atuais, adicionar **um botão só**:
  `[ver perfil]`.
- Nenhum texto, legenda ou coluna do Kanban é alterado — o botão é o único elemento novo ali.
- Clicar nesse botão troca a visualização para a Ficha do Operador. Dentro da ficha, um botão
  equivalente `[voltar ao board]` faz o caminho inverso.
- Tecnicamente isso é resolvido com uma troca de estado simples dentro do app (uma variável tipo
  "tela atual: board ou ficha"), sem precisar de rotas/links novos ou bibliotecas extras.
- A ficha lê os mesmos dados salvos do Kanban (leitura) — qualquer mudança feita no board
  (mover card, editar prazo) já reflete automaticamente na ficha da próxima vez que ela abrir.
- Única exceção de escrita: marcar/desmarcar itens do checklist de "Feature pendente" pode ser
  feito direto na ficha, e isso sim atualiza o card de volta no board.

---

## 4. Efeitos interativos (todos isolados dentro da ficha)

1. **Abrir detalhes da missão** — clicar num item da lista abre as informações completas do
   card (mesmo conteúdo do modal do Kanban), mas com a moldura temática da ficha.
2. **Barra de XP animada** — ao entrar na ficha após uma conclusão, a barra "enche" com uma
   animação até o novo valor, em vez de já aparecer cheia.
3. **Popup de level up** — quando o nível sobe, mostrar um destaque temporário
   (`>>> NÍVEL 8 ALCANÇADO <<<`) por 2–3 segundos ao abrir a ficha logo após a virada.
4. **Reordenar por prazo ou por tipo** — toggle simples acima da lista de missões ativas,
   sem alterar dado nenhum, só a ordem de exibição.
5. **Marcar checklist de feature pendente direto na ficha** — única interação que escreve de
   volta no board.
6. **Som curto ao concluir** (opcional, fácil de remover depois) — um "blip" leve quando algo
   muda de status.

Todo palavreado temático ("missão", "nível", "conquistas", pop-up de level up) fica **restrito à
ficha**. O Kanban que seu chefe vê permanece exatamente como está hoje.

---

## 5. Biblioteca de ícones — Material Symbols/Icons (Google)

Pacote oficial do Google, gratuito, com o maior catálogo de ícones flat prontos — encaixa bem
no visual cinza/flat que já usamos. Nome atual da lib: **Material Symbols** (evolução do antigo
"Material Icons"; o antigo ainda funciona, mas o novo tem mais variações e é o recomendado hoje).

- Site de busca/preview de todos os ícones: https://fonts.google.com/icons
- Pacote npm (para importar como componentes React): `@mui/icons-material` (usa os ícones do
  Material Design, mesmo fora de projetos que usam o resto do MUI) ou, mais leve e sem
  dependência de UI kit, `material-symbols` (pacote de fontes/SVG puro).
- Cada ícone tem 3 estilos (outlined, rounded, sharp) e pode variar peso/preenchimento — dá pra
  escolher o "rounded" pra combinar com os cantos levemente arredondados do resto do app.

Sugestão de uso na ficha:

| Onde | Ícone sugerido (nome no Material Symbols) |
|---|---|
| Emblema de personagem (escolha entre estes) | `person`, `design_services`, `auto_awesome`, `brush`, `shield_person`, `military_tech` |
| Missão ativa | `bolt` ou `directions_run` |
| Missão bloqueada | `hourglass_top` |
| Missão atrasada | `warning` |
| Missão secundária (feature pendente) | `checklist` |
| Conquista/instalação concluída | `military_tech` ou `verified` |
| Nível/XP | `military_tech`, `star` |
| Botão "ver perfil" no Kanban | `badge` ou `account_circle` |
