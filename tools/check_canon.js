#!/usr/bin/env node
// tools/check_canon.js — detector de drift de canon nos DOCS.
// Varre docs/**/*.md + CLAUDE.md + HANDOFF.md atrás de termos SUPERSEDIDOS.
// src/ fica de fora de propósito: renomes só entram no código quando o balance mandar.
//
// Saída por arquivo: hits + veredito.
//   ✅ limpo · 🟡 hits mas o arquivo tem banner de supersede/histórico (tolerado)
//   🔴 hits em doc VIVO (drift real — corrigir ou banner)
// Exit code 1 se houver 🔴 (dá pra usar em hook/CI depois).

'use strict';
const fs = require('fs');
const path = require('path');

// [padrão supersedido, termo atual, "desculpa" — se a linha casa com ela, o hit é
// uma anotação legítima de rename ("antes X"), não drift]. Lista cresce por sessão.
const OLD7 = /Nihelim|sa[íi]ram|saiu do canon|substituem/i;
const TERMS = [
  [/\bArchons?\b/g, 'Nihelim', OLD7],
  [/\bKenoth\b/g, '(saiu do canon — 7 Nihelim)', OLD7],
  [/\bEntropir\b/g, '(saiu do canon — 7 Nihelim)', OLD7],
  [/\bUmbrar\b/g, '(saiu do canon — 7 Nihelim)', OLD7],
  [/\bNebulor\b/g, 'Okhra (Mapa 1)', /Okhra|Nihelim/i],
  [/\bCinerath\b/g, '(saiu do canon — 7 Nihelim)', OLD7],
  [/\bTaciel\b/g, '(saiu do canon — 7 Nihelim)', OLD7],
  [/\bSpeculor\b/g, '(saiu do canon — 7 Nihelim)', OLD7],
  [/\bEidolas?\b/g, 'The Harbingers', /Harbingers/i],
  [/\bThe Vestiges\b/g, 'The Harbingers (Vestiges = só a moeda)', /Harbingers|moeda/i],
  [/\bKindled\b/g, 'Ember', /Ember/],
  [/\bLuminous\b/g, 'Lumen', /\bLumen\b/],
  [/\bRadiant\b(?! Ascendant)/g, "Corona", /Corona/],
  [/eclats_save_v2|eclats_v3\b/g, 'eclats_v4', /eclats_v4/],
  [/eclats_v4\b/g, 'eclats_v5', /eclats_v5|HIST[OÓ]RICO|superad/i],
  [/\bYaldabaoth\b/g, "(refutado — não usar)", /refutado|superad|Apócrifo|Fonte/i],
];
// linha marcada com "canon-ok" é sempre tolerada
const INLINE_OK = /canon-ok/;

// arquivos onde hit é registro histórico legítimo (logs de decisão)
const DECISION_LOGS = new Set(['docs/lore/DECISOES_JUL26.md']);

// banner de supersede nas primeiras linhas → hits tolerados
const BANNER = /DESATUALIZADO|HISTÓRICO|HISTORICO|defasado|superad[oa]|supersede/i;

function* mdFiles(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name[0] !== '.') yield* mdFiles(p); }
    else if (e.name.endsWith('.md')) yield p;
  }
}

const root = path.join(__dirname, '..');
const targets = ['CLAUDE.md', 'HANDOFF.md']
  .map(f => path.join(root, f)).filter(fs.existsSync)
  .concat([...mdFiles(path.join(root, 'docs'))]);

let live = 0, tolerated = 0, clean = 0;
for (const file of targets) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split('\n');
  const hits = [];
  for (const [re, current, excuse] of TERMS) {
    lines.forEach((line, i) => {
      re.lastIndex = 0;
      const m = line.match(re);
      if (!m) return;
      if (INLINE_OK.test(line)) return;
      if (excuse && excuse.test(line)) return;
      hits.push({ line: i + 1, term: m[0], current });
    });
  }
  if (!hits.length) { clean++; continue; }

  const isLog = DECISION_LOGS.has(rel);
  const hasBanner = BANNER.test(lines.slice(0, 6).join('\n'));
  const badge = isLog ? '🟡 log de decisão' : hasBanner ? '🟡 banner ok' : '🔴 DRIFT VIVO';
  if (isLog || hasBanner) tolerated++; else live++;

  console.log(`\n${badge} — ${rel} (${hits.length} hits)`);
  if (!isLog)
    for (const h of hits.slice(0, 12))
      console.log(`   L${h.line}: "${h.term}" → ${h.current}`);
  if (hits.length > 12 && !isLog) console.log(`   … +${hits.length - 12}`);
}

console.log(`\n— ${targets.length} docs: ${clean} limpos · ${tolerated} tolerados (banner/log) · ${live} com DRIFT VIVO`);
process.exit(live > 0 ? 1 : 0);
