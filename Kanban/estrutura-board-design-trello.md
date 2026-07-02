# Estrutura do Board — Processo de Design de Sistemas (Trello)

Guia de referência para montar o board no Trello: colunas, labels, due dates e o que colocar dentro de cada card.

---

## 1. Colunas (listas)

Mantendo a sequência original, com pequenos ajustes de nome para clareza:

1. **Criação do Design** — *Responsável: Eu*
2. **Apresentar primeiras telas** — *Responsável: Eu* (aguardando marcar/realizar reunião)
3. **Comentários do cliente** — *Responsável: Cliente*
4. **Realizando ajustes** — *Responsável: Eu*
5. **Aguardando aprovação (estrutura)** — *Responsável: Cliente*
6. **Design final** — *Responsável: Eu*
7. **Aprovação final (conteúdo)** — *Responsável: Cliente*
8. **Programação (React)** — *Responsável: Interno*
9. **Apresentar sistema** — *Responsável: Interno* (aguardando marcar/realizar call)
10. **Ajustes na programação** — *Responsável: Interno*
11. **Instalação pendente** — *Responsável: Cliente* (logística do totem)
12. **Feature pendente** — *Responsável: Eu / Interno* (projetos instalados mas incompletos)
13. **Instalação concluída** — *Fim do processo (nesta etapa que é comigo)*

> Nota: colunas 5 e 7 têm nomes diferenciados só pra deixar claro, de cara, que tipo de aprovação é aquela (estrutura vs. conteúdo) — já que hoje isso só está claro pra quem conhece o processo por dentro.

---

## 2. Labels

### Por responsável (bola com quem)
| Label | Cor sugerida |
|---|---|
| Eu | Verde |
| Cliente | Amarelo |
| Interno | Roxo |

Aplicar em cada card conforme a coluna atual. Pode ser automatizado com o **Butler** (nativo do Trello, gratuito): regra tipo "quando card entra na lista X → aplicar label Y". Assim você nunca esquece de trocar manualmente.

### Situações especiais
| Label | Cor sugerida | Uso |
|---|---|---|
| Totem prévio ativo | Laranja | Cliente já está usando um modelo básico instalado enquanto a versão robusta é desenvolvida — aplicar independente da coluna em que o card estiver |
| Feature pendente | Vermelho | Reforça visualmente mesmo fora da coluna 12, se o projeto já avançou mas ainda carrega uma pendência |

---

## 3. Due Date (prazo)

Usar em qualquer card que estiver nas colunas **3, 5, 7 ou 11** (etapas em que a bola está com o cliente):

- Ao mover o card pra essas colunas, definir uma data esperada de retorno.
- O Trello já sinaliza automaticamente:
  - 🟡 **Amarelo** = perto do prazo
  - 🔴 **Vermelho** = atrasado
- Isso resolve visualmente o "preciso cobrar esse cliente?" sem precisar de alarme externo — só de abrir o board.

---

## 4. O que colocar dentro de cada card

### Colunas 5 e 7 (Aguardando aprovação / Aprovação final)
Descrição do card com duas listas:
```
✅ Ajustes feitos:
- ...

⏳ Ajustes pendentes:
- ...
```
Atualizar a cada rodada de revisão. Se o cliente reprovar, o card volta pra "Realizando ajustes" carregando essa mesma descrição.

### Coluna 12 (Feature pendente)
Usar o **checklist nativo do Trello**, um item por feature:
```
☐ Feature X — previsão: dd/mm
☐ Feature Y — previsão: dd/mm
```
Isso permite ver não só *que* falta algo, mas *o quê* e *desde quando*, direto no card, sem precisar abrir outra ferramenta.

### Coluna 8 (Programação)
Tags/labels internos adicionais (pode ser texto na descrição ou labels extras, se quiser):
- **Sistema prévio** (se o totem básico já foi enviado)
- **Feature pendente (qual)** — se já se sabe de antemão que algo vai ficar de fora nessa rodada

---

## 5. Resumo visual do fluxo

```
Eu ──────► Eu (aguarda reunião) ──────► Cliente (aguarda resposta, due date)
                                              │
                                              ▼
                                          Eu (ajustes)
                                              │
                                              ▼
                             Cliente (aprova estrutura, due date) ──► reprova? volta pra ajustes
                                              │ aprova
                                              ▼
                                          Eu (design final)
                                              │
                                              ▼
                             Cliente (aprova conteúdo, due date) ──► reprova? volta pra ajustes
                                              │ aprova
                                              ▼
                                    Interno (programação React)
                                              │
                                              ▼
                              Interno (aguarda call de apresentação)
                                              │
                                              ▼
                                    Interno (ajustes programação)
                                              │
                                              ▼
                            Cliente (logística de envio do totem, due date)
                                              │
                          ┌───────────────────┴───────────────────┐
                          ▼                                       ▼
                Feature pendente (checklist)              Instalação concluída
                          │
                          ▼ (ao concluir features)
                Instalação concluída
```

---

## Próximo passo sugerido
Montar isso direto no Trello (colunas, labels e a regra do Butler para troca automática de label por responsável). Posso montar o board estrutural em formato de checklist de setup passo a passo, se quiser usar como guia ao criar no Trello.
