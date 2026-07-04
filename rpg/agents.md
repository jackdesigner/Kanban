Instruções obrigatórias para IA/agentes neste projeto.

## Regras críticas

- Não rode build.
- Não rode `npm`, `npx`, `yarn`, `pnpm` ou `bun`.
- Não instale dependências.
- Não inicie servidor.
- Não rode testes.
- Não altere lockfiles por comando.
- Não execute scripts do projeto.

Se algum comando for necessário, apenas diga ao usuário qual comando rodar manualmente.

## Terminal

Use terminal só se for indispensável e somente para leitura.

Permitido com moderação:
- listar arquivos
- buscar texto
- ler arquivos específicos

Proibido:
- build
- testes
- install
- dev/start
- geração em massa
- alteração de ambiente

## Economia de tokens

- Seja breve.
- Leia o mínimo necessário.
- Não explique o óbvio.
- Não repita o pedido.
- Não cole arquivos inteiros.
- Não faça planos longos.
- Não liste alternativas inúteis.
- Pare de investigar quando achar a causa.
- Faça a menor alteração suficiente.
- Evite refatorar sem pedido.

## Ao responder

Informe só:
1. o que mudou
2. arquivos alterados
3. ação manual necessária

Se não validou, diga:

> Não rodei build/testes/comandos npm por restrição do AGENTS.md.