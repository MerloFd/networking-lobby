# node

Lobby de networking, check-in e sorteio para eventos de tecnologia de comunidade.

Um QR code na tela resolve três coisas que hoje são improvisadas: as pessoas
entram numa lista onde conseguem se achar no LinkedIn depois do evento, os links
dos palestrantes ficam todos num lugar em vez de três QR codes no meio da talk, e
o organizador sorteia os brindes sem sair correndo atrás de quem estava na sala.

## Por que existe

Em evento de comunidade o networking morre no dia seguinte. Você conversa com
dez pessoas, conecta com duas, e esquece o nome das outras oito. O organizador,
por sua vez, faz o check-in do sorteio na mão, pessoa por pessoa.

O `node` ataca os dois pelo mesmo lugar: o participante gasta 15 segundos, e o
resto do valor aparece sozinho.

## O que ele não faz

Não envia convites de conexão do LinkedIn. **Não existe API para isso**, em
nenhum tier, nem para parceiros, e automatizar por fora viola os termos de uso e
derruba conta. O LinkedIn ainda limita convites a cerca de 100 por semana, então
"conectar com todos" nunca foi realista.

O que dá para fazer é reduzir o custo por pessoa a dois toques: o card abre o
perfil no app nativo, já com o botão Conectar na tela, e o lobby marca com quem
você já falou. Vira checklist, não lista.

## Como funciona

**Participante.** Escaneia o QR ou abre o link, cola o LinkedIn, toca em anos de
carreira e nas áreas em que atua. Um campo de texto, o resto é toque. Se for
palestrar, marca "Sou palestrante" e preenche dois campos a mais.

**Palestrante.** Usa o mesmo formulário do participante. O card cai como pendente
no painel e o organizador só aprova. Ninguém digita lista de palestrantes.

**Organizador.** Cria o evento com o nome e a data já sugeridos, abre o telão no
projetor, e sorteia quando quiser.

**Sorteio.** Determinístico e auditável. O ganhador é função pura da seed, que é
montada com o código de presença visível no telão mais o número da rodada.
Publicando seed e lista, qualquer pessoa reconfere o resultado sem precisar
confiar no organizador. Concorre só quem digitou o código, o que substitui o
check-in manual.

## Stack

- **Next.js 15** (App Router) com server actions no lugar de API separada
- **Postgres** via **Drizzle**, Neon em produção
- **PGlite** em desenvolvimento: Postgres em WASM dentro do processo, sem Docker
- **Tailwind 4**, sem lib de UI e sem webfont
- **Zod** na validação, **Vitest** nos testes

Mobile first de verdade, e leve por necessidade: wifi de evento é ruim, e uma
página que demora 4 segundos para abrir mata a ideia por latência, não por
design.

## Rodando

```bash
npm install
npm run seed   # cria o banco local e popula um evento de exemplo
npm run dev    # http://localhost:3210
```

Sem Docker, sem string de conexão, sem serviço para subir. O banco local vive em
`.pglite/`.

| Script | O que faz |
|---|---|
| `npm run dev` | sobe o app na porta 3210 |
| `npm test` | roda a suíte |
| `npm run seed` | popula o banco local |
| `npm run db:reset` | apaga e repopula do zero |
| `npm run db:generate` | gera migration a partir do schema |

Em produção, defina `DATABASE_URL` com a string do Neon. O resto não muda.

## Testes

Cobrem as duas partes onde um bug é silencioso e caro:

**Normalização do handle**, que é a chave única contra inscrição duplicada.
Query de compartilhamento, subdomínio de idioma, `mwlite`, formato `/pub/`
antigo, percent encoding, e recusa de `/feed` e `/company`. Cinco formatos
diferentes do mesmo perfil precisam virar uma linha só.

**Sorteio**, onde se testa determinismo, independência entre rodadas, suplentes
sem repetir o ganhador, e uniformidade da distribuição em 13 mil rodadas.

## Estado

MVP em validação. Funcionando: cadastro com dedup, lobby com filtro e checklist,
aba de palestrantes com aprovação, painel do organizador, telão e sorteio
persistido com prova.

Em aberto: login do organizador com GitHub (hoje o primeiro organizador do banco
é dono de tudo), geração real do QR, rotação automática do código, rate limit no
formulário público, e o lobby visível só para quem se cadastrou.
