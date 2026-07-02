# Ajustes e Atualizações do Aplicativo

Este documento consolida os ajustes de interface, usabilidade e novas features solicitados pelo design. As instruções foram otimizadas de forma estruturada e direta para processamento eficiente por modelos de IA.

---

## 1. Layout & Responsividade

* **Modo Overview:** Distribuir a largura dos cards igualmente de forma responsiva, tanto para telas grandes quanto para telas menores.
* **Cabeçalho Mobile (Largura Estreita):**
    * **Linha 1:** Alinhados horizontalmente -> `[Nome (Esquerda)]` ---- `[Número de Cards (Direita)]` ---- `[Botão de Ações / 3 Pontos - Apenas Ícone (Direita)]`.
    * **Linha 2:** `[Grupo de Filtros (Esquerda)]` ---- `[Opções de Visualização - Apenas Ícone (Direita)]`.
* **Iconografia:** Substituir completamente todos os emojis por ícones oficiais do *Material Design*.

## 2. Interação de Cards & UX

* **Fluxo de Clique no Card:** Ao clicar em um card, abrir obrigatoriamente na "Visualização" do conteúdo. **Não** abrir direto em modo de edição (medida de segurança de UX).
* **Rodapé da Visualização do Card:** Incluir botões para `Voltar` e `Editar` posicionados na parte inferior.
* **Comandos Internos:** Nos componentes internos do card, substituir o botão anterior de exclusão por um botão de `Voltar`.

## 3. Lógica de Arquivamento & Exclusão

* **Mecânica de Arquivar:** Substituir a mecânica padrão de exclusão direta por "Arquivar". O card deve conter um botão discreto composto apenas por ícone.
* **Menu de Ações Principal:** Incluir a opção `Ver arquivados` dentro do menu de ações geral.
* **Tela de Arquivados:** Criar uma tela/view que exiba a lista de cards arquivados com filtros pertinentes aplicados.
* **Exclusão Definitiva:** O botão com a ação `Excluir` só deve ser renderizado e visível nos cards que já estiverem dentro da Tela de Arquivados.

## 4. Nova Feature: Log de Contatos (WhatsApp)

* **Gatilho (Opções do Card):** Adicionar o botão `[Ícone do WhatsApp] Criar log de contatos` para registrar interações com o cliente.
* **Interação (Modal de Registro):** Ao clicar no botão, abrir um modal para confirmar a Data e adicionar um Comentário. 
    * *Ações do Modal:* Botão `[X]` para cancelar e botão `[Salvar]`.
* **Exibição no Card (Sessão Inferior):** Criar uma seção separada no final do card intitulada **"Log de contatos"**.
* **Estrutura do Histórico:** Exibir em formato de lista indexada:
    1. `[Data] [Ícone de Comentário]` (O clique no ícone de comentário deve abrir um modal de leitura para exibir o texto completo).
    2. `[Data] [Ícone de Comentário]`
* **Modo Edição do Log:** Quando o card estiver em "Modo de Edição", renderizar um botão `[X]` ao lado de cada linha do histórico de logs para permitir a exclusão individual de registros inseridos incorretamente.
