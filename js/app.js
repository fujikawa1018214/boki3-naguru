(() => {
  'use strict';

  // ===== 共通 =====
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const fmt = n => Number(n).toLocaleString('ja-JP');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  // 全角数字も受け付け、数字以外（カンマ・円記号など）は無視する
  const parseAmt = s => {
    const t = String(s || '').replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/[^\d]/g, '');
    return t === '' ? null : Number(t);
  };

  // ===== 先生（キャラクター）ごとのセリフ・画像・効果音 =====
  const CHARS = {
    m: {
      name: 'さわやかジャージ先生', tool: 'ピコハン', sound: 'pico', img: 'teacher_',
      sfx: ['ピコッ！！', 'ピコーン！！', 'ピコピコッ！！', 'ピコォッ！！'],
      ng: ['違う違う！', 'あれ、寝ぼけてる？', '借方と貸方、もう一回確認しよう！', 'その仕訳だと本番で泣くよ？',
        'はい、ピコハンいきます！', '惜しい…けど不正解！', 'これ、前もやったよね？', '本番でもそれ書いちゃう？', '電卓より先に、頭を動かそう！'],
      ok: ['よし、正解！', 'いいね、その調子！', 'さすが！次いこう。', '正解！でも油断は禁物だよ。', 'ばっちり。続けよう！'],
      idle: {
        q1: ['手が止まってるよ。', '借方は左、貸方は右。ここ大事。', '勘定科目は選択肢の中にあるよ。よく読もう。', '金額の桁、もう一回数えてみて。', '分からない問題は飛ばして、後で戻ろう。'],
        q2: ['現金が動いたら現金出納帳。忘れずにね。', '補助簿は「すべて」選ぶんだ。1つ漏れたら0点だよ。', '語句は落ち着いて読めば大丈夫。'],
        q3: ['第3問は配点が大きいよ。', '月割計算は指を折って数えよう。', '整理事項は1つずつ片付けていこう。', '時計も見てね。60分はあっという間だよ。'],
      },
      title: '70点取るまで、一緒にがんばろう。<br>ただし間違えたら、ピコハンで叩くからね。',
      titleBest: b => `最高${b}点！合格点は取れてるね。<br>本番でも取れるように、もう少し続けよう。`,
      rush: n => `${n}発、ピコハンいきます！`,
      timeUp: '時間切れ！ペンを置いて！',
      pass: (t, n) => `${t}点、合格！ うう…よかった…。でも間違えた${n}問の分は、ピコハンで叩かせてもらったよ。`,
      perfect: '満点！…もう言うことないよ。',
      fail: (t, n) => `${t}点。合格まであと${70 - t}点。間違えた${n}問の分、ピコハンの音で覚えたかな？ 解説を読んで、もう一回いこう！`,
      praisePass: '合格！でも油断は禁物だよ。', praisePerfect: '満点！？すごい、よくやったね！',
      knock: hp => `体力は${hp}。なくなったら終わりだよ。いこう！`,
      knockWeak: '前に間違えた問題だよ。今度は決めよう。',
      knockNg: '解説を読もう。同じ間違いをしたら、またピコハンだよ。',
      streak: n => `${n}連続！やるね！`,
      end: k => k >= 20 ? `${k}問正解！今日はここまでにしようか。` : k >= 10 ? 'あと少し！仕訳は反射で切れるまで練習しよう。' : '大丈夫、ここからだよ。復習ノートで解説を読み直そう！',
    },
    f: {
      name: 'メガネのジャージ先生', tool: 'ハリセン', sound: 'harisen', img: 'teacher_f_',
      sfx: ['スパーン！！', 'パシーン！！', 'スパァン！！', 'スパパーン！！'],
      ng: ['違うわ！', '寝ぼけているの？', '借方と貸方、もう一度言ってみなさい！', 'その仕訳で受かると思わないこと！',
        'ハリセンを受けなさい！', '甘いわね。', '何度言わせるの！', '本番でもそれを書くつもり？', '電卓より先に頭を動かしなさい！'],
      ok: ['…ふうん。正解よ。', '当然ね。次！', 'その調子。気を抜かないで。', 'よろしい。でも油断しないこと。', '悪くないわ。続けなさい。'],
      idle: {
        q1: ['手が止まっているわよ。', '借方は左、貸方は右。基本よ。', '勘定科目は選択肢の中にあるわ。よく読みなさい。', '金額の桁を数え直しなさい。', '分からない問題は飛ばして、後で戻りなさい。'],
        q2: ['現金が動いたら現金出納帳。忘れないで。', '補助簿は「すべて」選ぶの。1つ漏れたら0点よ。', '語句は落ち着いて読めば分かるはず。'],
        q3: ['第3問は配点が大きいわよ。', '月割計算は指を折って数えなさい。', '整理事項は1つずつ片付けていきなさい。', '時計を見なさい。60分は短いわよ。'],
      },
      title: 'いいこと？ 70点取るまで帰さないわよ。<br>間違えた数だけハリセンで叩くから、覚悟なさい。',
      titleBest: b => `最高${b}点ね。合格点には届いているわ。<br>でも本番で取れなければ意味が無いの。続けるわよ。`,
      rush: n => `${n}発、ハリセンの刑よ！`,
      timeUp: '時間切れよ！ペンを置きなさい！',
      pass: (t, n) => `${t}点、合格よ…！ ぐすっ…。でも間違えた${n}問の分は、ハリセンできっちり叩かせてもらったわ。`,
      perfect: '満点…。言うことは何も無いわ。',
      fail: (t, n) => `${t}点。合格まであと${70 - t}点よ。間違えた${n}問の分、ハリセンの音で覚えたわね？ 解説を読んで出直しなさい。`,
      praisePass: '合格よ。でも慢心しないこと。', praisePerfect: '満点…ですって…！よくやったわ！',
      knock: hp => `体力は${hp}。尽きたら終わりよ。始めるわ。`,
      knockWeak: '前に間違えた問題よ。二度目は無いわ。',
      knockNg: '解説を読みなさい。同じ間違いをしたら、次もハリセンよ。',
      streak: n => `${n}連続ね。…やるじゃない。`,
      end: k => k >= 20 ? `${k}問正解ね。今日はここまでにしてあげる。` : k >= 10 ? 'まだまだね。仕訳は反射で切れるまでやりなさい！' : '出直してきなさい！ 復習ノートで解説を読み直すこと！',
    },
  };
  const C = () => CHARS[S.char] || CHARS.m;
  const img = kind => `img/${C().img}${kind}.jpg`;

  // ===== 保存データ =====
  const KEY = 'naguru-boki3-v1';
  const store = (() => {
    let d;
    try { d = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { d = {}; }
    d = Object.assign({ exams: 0, best: null, last: null, punches: 0, wrong: {}, sound: true, mild: false, char: 'm' }, d);
    return {
      d,
      save() { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* 保存できなくても動かす */ } },
    };
  })();
  const S = store.d;

  // ===== 効果音（Web Audio で合成） =====
  let actx = null;
  const ac = () => {
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  };
  function noise(ctx, dur) {
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ch.length, 2);
    const src = ctx.createBufferSource(); src.buffer = buf; return src;
  }
  function sfxHit() {
    if (!S.sound) return;
    const ctx = ac(); if (!ctx) return;
    if (C().sound === 'harisen') harisen(ctx); else pico(ctx);
  }
  // ハリセンの音：紙が鋭くはじける「スパーン」
  function harisen(ctx) {
    const t = ctx.currentTime;
    const n = noise(ctx, .18), hp = ctx.createBiquadFilter(), pk = ctx.createBiquadFilter(), g = ctx.createGain();
    hp.type = 'highpass'; hp.frequency.value = 1200;
    pk.type = 'peaking'; pk.frequency.value = 3200; pk.Q.value = 1.2; pk.gain.value = 10;
    g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(.001, t + .18);
    n.connect(hp).connect(pk).connect(g).connect(ctx.destination); n.start(t);
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(90, t + .08);
    og.gain.setValueAtTime(.35, t); og.gain.exponentialRampToValueAtTime(.001, t + .1);
    o.connect(og).connect(ctx.destination); o.start(t); o.stop(t + .12);
  }
  // ピコピコハンマーの音：軽いプラスチックの「ポコ」＋笛のような「ピコッ」2回
  function pico(ctx) {
    const t = ctx.currentTime;
    const n = noise(ctx, .05), bp = ctx.createBiquadFilter(), ng = ctx.createGain();
    bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 2; ng.gain.value = .8;
    n.connect(bp).connect(ng).connect(ctx.destination); n.start(t);
    [[0, 1500, 2600], [.11, 1900, 3200]].forEach(([dt, f0, f1]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square'; o.frequency.setValueAtTime(f0, t + dt); o.frequency.exponentialRampToValueAtTime(f1, t + dt + .07);
      g.gain.setValueAtTime(.0001, t + dt); g.gain.exponentialRampToValueAtTime(.12, t + dt + .01); g.gain.exponentialRampToValueAtTime(.001, t + dt + .09);
      o.connect(g).connect(ctx.destination); o.start(t + dt); o.stop(t + dt + .1);
    });
  }
  function sfxOk() {
    if (!S.sound) return;
    const ctx = ac(); if (!ctx) return;
    const t = ctx.currentTime;
    [[880, 0], [1320, .09]].forEach(([fq, dt]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = fq;
      g.gain.setValueAtTime(.0001, t + dt); g.gain.exponentialRampToValueAtTime(.35, t + dt + .01); g.gain.exponentialRampToValueAtTime(.001, t + dt + .35);
      o.connect(g).connect(ctx.destination); o.start(t + dt); o.stop(t + dt + .4);
    });
  }

  // ===== 画面切り替え =====
  const screens = ['title', 'exam', 'result', 'knock', 'notes'];
  function show(name) {
    screens.forEach(n => { $('#s-' + n).hidden = n !== name; });
    window.scrollTo(0, 0);
  }
  function applyMotion() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.body.classList.toggle('motion', !S.mild && !reduce);
  }
  function refreshHeader() {
    $('#hitTotal').textContent = fmt(S.punches);
    $('#soundBtn').textContent = '効果音：' + (S.sound ? 'あり' : 'なし');
    $('#soundBtn').setAttribute('aria-pressed', String(S.sound));
  }
  function weakIds() { return Object.keys(S.wrong).filter(id => S.wrong[id] > 0 && JOURNAL.some(q => q.id === id)); }
  function refreshTitle() {
    $('#recCount').textContent = S.exams + '回';
    $('#recBest').textContent = S.best == null ? '—' : S.best + '点';
    $('#recLast').textContent = S.last == null ? '—' : S.last + '点';
    const w = weakIds().length;
    $('#recWeak').textContent = w + '問';
    $('#weakBtn').disabled = w === 0;
    $('#weakDesc').textContent = w === 0 ? 'まだ間違えた仕訳は無い。まずはノックか模試から始める。' : `過去に間違えた仕訳 ${w}問 を集中して出題する。正解すると苦手から外れる。`;
    $('#titleSpeech').innerHTML = S.best != null && S.best >= 70 ? C().titleBest(S.best) : C().title;
  }
  // 選んだ先生に合わせて画像・ボタンの状態を切り替える
  function applyChar() {
    $$('img[data-img]').forEach(el => { el.src = img(el.dataset.img); });
    $$('[data-char]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.char === S.char)));
    refreshTitle();
  }

  // ===== 叩かれ演出 =====
  let fxSkip = null;
  let skipAll = false;
  function shake(el) {
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
  }
  async function bonk(line, sub, hold = 1300) {
    S.punches++; store.save(); refreshHeader();
    const fx = $('#fxPunch');
    $('#fxLine').textContent = line;
    $('#fxSub').textContent = sub || '';
    $('#fxSfx').textContent = pick(C().sfx);
    fx.hidden = false;
    // アニメーションを毎回かけ直す
    const img = $('#fxImg'), sfx = $('#fxSfx');
    [img, sfx].forEach(el => { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; });
    sfxHit();
    shake(fx);
    await new Promise(res => {
      const t = setTimeout(done, hold);
      function done() { clearTimeout(t); fxSkip = null; fx.removeEventListener('click', done); res(); }
      fxSkip = done;
      setTimeout(() => fx.addEventListener('click', done), 250);
    });
    fx.hidden = true;
  }
  let toastTimer = null;
  function praise(line) {
    sfxOk();
    $('#toastLine').textContent = line || pick(C().ok);
    const t = $('#toast');
    t.hidden = false; t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 1400);
  }

  // ===== 仕訳の解答欄 =====
  const ROWS = 4;
  function journalTable(order, saved, onChange) {
    const opts = '<option value="">（選択）</option>' + order.map(a => `<option>${esc(a)}</option>`).join('');
    // 借方・貸方を左右に並べる（スマートフォンでは上下に積む）
    const side = (sd, label) => {
      let rows = '';
      for (let i = 0; i < ROWS; i++) {
        rows += `<div class="jg-row">
          <select data-s="${sd}" data-i="${i}" aria-label="${label} 勘定科目 ${i + 1}行目">${opts}</select>
          <input data-s="${sd}" data-i="${i}" inputmode="numeric" autocomplete="off" placeholder="金額" aria-label="${label} 金額 ${i + 1}行目">
        </div>`;
      }
      return `<div class="jg-side ${sd}"><div class="jg-h">${label}</div><div class="jg-sub"><span>勘定科目</span><span>金額</span></div>${rows}</div>`;
    };
    const wrap = document.createElement('div');
    wrap.className = 'jg';
    wrap.innerHTML = side('dr', '借方') + side('cr', '貸方');
    // 入力済みの内容を戻す
    ['dr', 'cr'].forEach(side => (saved[side] || []).forEach((r, i) => {
      $(`select[data-s="${side}"][data-i="${i}"]`, wrap).value = r[0] || '';
      $(`input[data-s="${side}"][data-i="${i}"]`, wrap).value = r[1] || '';
    }));
    const read = () => {
      const v = { dr: [], cr: [] };
      ['dr', 'cr'].forEach(side => { for (let i = 0; i < ROWS; i++) v[side].push([$(`select[data-s="${side}"][data-i="${i}"]`, wrap).value, $(`input[data-s="${side}"][data-i="${i}"]`, wrap).value]); });
      return v;
    };
    wrap.addEventListener('change', () => onChange && onChange(read()));
    wrap.addEventListener('input', () => onChange && onChange(read()));
    // 金額欄はフォーカスが外れたらカンマ区切りに整える
    wrap.addEventListener('focusout', e => {
      if (e.target.tagName === 'INPUT') { const n = parseAmt(e.target.value); if (n != null) e.target.value = fmt(n); }
    });
    return { el: wrap, read };
  }
  function sideMap(rows) {
    const m = new Map();
    let broken = false;
    rows.forEach(([a, v]) => {
      const n = parseAmt(v);
      if (!a && n == null) return;
      if (!a || n == null) { broken = true; return; }
      m.set(a, (m.get(a) || 0) + n);
    });
    return broken ? null : m;
  }
  const sameMap = (a, b) => a && a.size === b.size && [...b].every(([k, v]) => a.get(k) === v);
  function gradeJournal(q, ans) {
    const keys = [{ dr: q.dr, cr: q.cr }, ...(q.alts || [])];
    const dr = sideMap(ans.dr || []), cr = sideMap(ans.cr || []);
    return keys.some(k => sameMap(dr, new Map(k.dr)) && sameMap(cr, new Map(k.cr)));
  }
  function journalAnsTable(dr, cr) {
    const n = Math.max(dr.length, cr.length);
    let r = '';
    for (let i = 0; i < n; i++) {
      const d = dr[i] || ['', ''], c = cr[i] || ['', ''];
      r += `<tr><td>${esc(d[0])}</td><td class="n">${d[1] !== '' ? fmt(d[1]) : ''}</td><td>${esc(c[0])}</td><td class="n">${c[1] !== '' ? fmt(c[1]) : ''}</td></tr>`;
    }
    return `<div class="tbl-wrap"><table class="rv-tbl"><thead><tr><th>借方科目</th><th>金額</th><th>貸方科目</th><th>金額</th></tr></thead><tbody>${r}</tbody></table></div>`;
  }
  const userRows = rows => (rows || []).filter(([a, v]) => a || parseAmt(v) != null).map(([a, v]) => [a || '（未選択）', parseAmt(v) == null ? '' : parseAmt(v)]);
  const yourJournal = a => {
    const dr = userRows(a.dr), cr = userRows(a.cr);
    return dr.length || cr.length ? `<p class="lbl">あなたの解答</p>${journalAnsTable(dr, cr)}` : '<p class="lbl">あなたの解答：（未記入）</p>';
  };

  // ===== 解説 =====
  const LEFT_UP = ['資産', '費用'], RIGHT_UP = ['負債', '純資産', '収益', '評価勘定'];
  function incDec(type, side) {
    if (LEFT_UP.includes(type)) return side === 'dr' ? '増加' : '減少';
    if (RIGHT_UP.includes(type)) return side === 'cr' ? '増加' : '減少';
    return '—';
  }
  const RULE_HTML = `<details class="rule"><summary>仕訳のルール（借方・貸方の覚え方）</summary>
    <div class="tbl-wrap"><table class="rv-tbl"><thead><tr><th>グループ</th><th>増えたら</th><th>減ったら</th><th>例</th></tr></thead><tbody>
      <tr><td>資産</td><td>借方（左）</td><td>貸方（右）</td><td>現金・売掛金・備品・前払金</td></tr>
      <tr><td>費用</td><td>借方（左）</td><td>貸方（右）</td><td>仕入・給料・支払利息</td></tr>
      <tr><td>負債</td><td>貸方（右）</td><td>借方（左）</td><td>買掛金・借入金・前受金</td></tr>
      <tr><td>純資産</td><td>貸方（右）</td><td>借方（左）</td><td>資本金・繰越利益剰余金</td></tr>
      <tr><td>収益</td><td>貸方（右）</td><td>借方（左）</td><td>売上・受取利息</td></tr>
    </tbody></table></div>
    <p>貸倒引当金・減価償却累計額は、資産の金額を間接的に減らす「評価勘定」。増えたら貸方、減ったら借方（負債と同じ向き）。<br>
    現金過不足・損益は一時的に金額を集める勘定で、5つのグループには入らない。</p></details>`;

  function explainJournal(q) {
    const x = EXPLAIN[q.id] || { why: {} };
    const row = (side, [a, v]) => {
      const t = ACCOUNT_TYPE[a] || '—';
      const why = x.why[(side === 'dr' ? '借:' : '貸:') + a] || x.why[a] || '';
      const id = incDec(t, side);
      return `<tr><td class="c-side">${side === 'dr' ? '借方' : '貸方'}</td><td class="c-acc"><b>${esc(a)}</b><br><span class="amt">${fmt(v)}</span></td><td class="c-type">${esc(t)}</td><td class="c-inc ${id === '増加' ? 'up' : id === '減少' ? 'down' : ''}">${id}</td><td class="c-why">${esc(why)}</td></tr>`;
    };
    const alt = (q.alts || []).map(k => `<p>【別解】次の仕訳でも正解。</p>${journalAnsTable(k.dr, k.cr)}`).join('');
    return `<div class="ex">
      <p class="ex-sum"><b>【要点】</b>${esc(q.exp)}</p>
      <p class="lbl">1行ずつ「何が・増えたか減ったか」で考える</p>
      <div class="tbl-wrap"><table class="ex-tbl"><thead><tr><th>記入</th><th>勘定科目</th><th>グループ</th><th>増減</th><th>なぜ？</th></tr></thead>
      <tbody>${q.dr.map(r => row('dr', r)).join('')}${q.cr.map(r => row('cr', r)).join('')}</tbody></table></div>
      ${x.calc ? `<p><b>【計算】</b>${esc(x.calc)}</p>` : ''}
      ${x.trap ? `<p><b>【ひっかけ注意】</b>${esc(x.trap)}</p>` : ''}
      ${alt}${RULE_HTML}</div>`;
  }
  function explainBook(q) {
    const je = BOOK_JE[q.id];
    const lines = [...je.dr, ...je.cr].map(([a]) => {
      const r = BOOK_RULE[a];
      return r ? `<tr><td>${esc(a)}</td><td><b>${r[0].join('・')}</b></td><td>${esc(r[1])}</td></tr>` : `<tr><td>${esc(a)}</td><td>（補助簿なし）</td><td>この勘定を記録する補助簿は無い</td></tr>`;
    }).join('');
    return `<div class="ex">
      <p class="ex-sum"><b>【要点】</b>${esc(q.exp)}</p>
      <p class="lbl">手順1：まず仕訳を切る</p>${journalAnsTable(je.dr, je.cr)}
      <p class="lbl">手順2：仕訳の勘定科目ごとに補助簿を決める</p>
      <div class="tbl-wrap"><table class="ex-tbl"><thead><tr><th>勘定科目</th><th>記入する補助簿</th><th>理由</th></tr></thead><tbody>${lines}</tbody></table></div>
      ${BOOK_TRAP[q.id] ? `<p><b>【ひっかけ注意】</b>${esc(BOOK_TRAP[q.id])}</p>` : ''}
      <details class="rule"><summary>補助簿の選び方（一覧）</summary>
        <div class="tbl-wrap"><table class="rv-tbl"><thead><tr><th>仕訳に出てくる勘定</th><th>補助簿</th></tr></thead><tbody>
        ${Object.entries(BOOK_RULE).filter(([a]) => a !== '建物' && a !== '土地').map(([a, r]) => `<tr><td>${a === '備品' ? '備品・建物・土地' : esc(a)}</td><td>${r[0].join('・')}</td></tr>`).join('')}
        </tbody></table></div>
        <p>未払金・未収入金・前払金などには補助簿が無い。</p></details></div>`;
  }
  const explainWord = q => `<div class="ex"><p class="ex-sum"><b>【要点】</b>${esc(q.exp)}</p><p>${esc(WORD_EXP[q.id] || '')}</p></div>`;

  function entryTable(list) {
    let r = '';
    list.forEach(e => {
      const n = Math.max(e.dr.length, e.cr.length);
      for (let i = 0; i < n; i++) {
        const d = e.dr[i] || ['', ''], c = e.cr[i] || ['', ''];
        r += `<tr>${i === 0 ? `<td rowspan="${n}"><b>${esc(e.t)}</b></td>` : ''}<td>${esc(d[0])}</td><td class="n">${d[1] !== '' ? fmt(d[1]) : ''}</td><td>${esc(c[0])}</td><td class="n">${c[1] !== '' ? fmt(c[1]) : ''}</td>${i === 0 ? `<td rowspan="${n}" class="why">${esc(e.why)}</td>` : ''}</tr>`;
      }
    });
    return `<div class="tbl-wrap"><table class="rv-tbl ce"><thead><tr><th>整理事項</th><th>借方科目</th><th>金額</th><th>貸方科目</th><th>金額</th><th>ポイント</th></tr></thead><tbody>${r}</tbody></table></div>`;
  }
  function explainClosingItem(c, i) {
    const x = CLOSING_EXP[c.id], it = x.items[i];
    return `<div class="ex"><p class="ex-sum"><b>【計算】</b>${esc(c.ask[i].exp)}</p><p>${esc(it.why)}</p>
      ${it.e.length ? `<p class="lbl">関係する決算整理仕訳</p>${entryTable(it.e.map(n => x.entries[n]))}` : ''}</div>`;
  }
  const closingAll = c => `<div class="ex"><p>決算整理事項を1つずつ仕訳にすると次の通り。財務諸表の金額は「試算表の金額 ± この仕訳の金額」で求める。</p>${entryTable(CLOSING_EXP[c.id].entries)}</div>`;

  // ===== あなたの解答のどこが違うか =====
  const SIDE = { dr: '借方', cr: '貸方' };
  const diagBox = items => items.length
    ? `<div class="diag"><p class="diag-h">あなたの解答のどこが違うか</p><ul>${items.map(([k, t]) => `<li><b>【${k}】</b>${t}</li>`).join('')}</ul></div>` : '';
  function userSide(rows) {
    const m = new Map();
    let orphan = 0;
    (rows || []).forEach(([a, v]) => {
      const n = parseAmt(v);
      if (!a && n == null) return;
      if (!a) { orphan++; return; }
      const cur = m.has(a) ? m.get(a) : null;
      m.set(a, n == null ? cur : (cur || 0) + n);
    });
    return { m, orphan };
  }
  function diagnoseJournal(q, ans) {
    const u = { dr: userSide(ans.dr), cr: userSide(ans.cr) };
    if (!u.dr.m.size && !u.cr.m.size && !u.dr.orphan && !u.cr.orphan) return diagBox([['未記入', '何も入力されていない。まずは「何が増えて、何が減ったか」を考えて書いてみよう。']]);
    // 別解がある問題は、選んだ科目が多く重なる方の答えと比べる
    const keys = [{ dr: q.dr, cr: q.cr }, ...(q.alts || [])];
    const score = k => ['dr', 'cr'].reduce((n, s) => n + k[s].filter(([a]) => u[s].m.has(a)).length, 0);
    const key = keys.reduce((best, k) => (score(k) > score(best) ? k : best), keys[0]);
    const why = (s, a) => { const x = EXPLAIN[q.id] || { why: {} }; return x.why[(s === 'dr' ? '借:' : '貸:') + a] || x.why[a] || ''; };
    const calc = (EXPLAIN[q.id] || {}).calc;
    const items = [];
    ['dr', 'cr'].forEach(s => {
      const o = s === 'dr' ? 'cr' : 'dr';
      const K = new Map(key[s]), Ko = new Map(key[o]), U = u[s].m, Uo = u[o].m;
      U.forEach((v, a) => {
        const name = `${SIDE[s]}の「${esc(a)}」`;
        if (K.has(a)) {
          if (v == null) items.push(['金額が未入力', `${name}に金額が入っていない。正しくは ${fmt(K.get(a))}。`]);
          else if (v !== K.get(a)) items.push(['金額違い', `${name}が ${fmt(v)} になっている。正しくは ${fmt(K.get(a))}。${calc ? `<br>【計算】${esc(calc)}` : ''}`]);
        } else if (Ko.has(a) && !Uo.has(a)) {
          items.push(['貸借が逆', `「${esc(a)}」は${SIDE[o]}に書く。${esc(why(o, a))}`]);
        } else {
          const t = (MISS[q.id] || {})[a] || (Ko.has(a) ? `「${esc(a)}」は${SIDE[o]}だけに書く。${esc(why(o, a))}` : 'この取引では使わない勘定科目。');
          items.push(['科目違い', `${name}は使わない。${esc(t)}`]);
        }
      });
      K.forEach((v, a) => {
        if (U.has(a)) return;
        if (Uo.has(a) && !Ko.has(a)) return; // 貸借が逆として上で説明済み
        items.push(['不足', `${SIDE[s]}の「${esc(a)}」${fmt(v)} が抜けている。${esc(why(s, a))}`]);
      });
      if (u[s].orphan) items.push(['科目が未選択', `${SIDE[s]}に、金額だけ入力して勘定科目を選んでいない行がある。`]);
    });
    return diagBox(items);
  }
  function diagnoseBook(q, chosen) {
    const je = BOOK_JE[q.id];
    const accts = [...je.dr, ...je.cr].map(r => r[0]);
    const items = [];
    if (!chosen.length) return diagBox([['未記入', '補助簿が1つも選ばれていない。まず仕訳を切ってから、勘定科目ごとに補助簿を決めよう。']]);
    chosen.filter(b => !q.ans.includes(b)).forEach(b => {
      items.push(['選びすぎ', `「${b}」は${BOOK_WHEN[b]}に記入する。この取引の仕訳（${accts.join('・')}）には当てはまらない。`]);
    });
    q.ans.filter(b => !chosen.includes(b)).forEach(b => {
      const src = accts.find(a => BOOK_RULE[a] && BOOK_RULE[a][0].includes(b));
      items.push(['選び漏れ', `「${b}」が抜けている。仕訳に「${src}」があるので、${BOOK_WHEN[b]}に記入する${b}が必要。`]);
    });
    return diagBox(items);
  }
  function diagnoseWord(q, a) {
    if (!a) return diagBox([['未記入', '語句が選ばれていない。']]);
    return diagBox([['語句違い', `「${esc(a)}」ではない。${esc((WORD_MISS[q.id] || {})[a] || '')}`]]);
  }
  function diagnoseClosing(c, i, raw) {
    const v = parseAmt(raw), ans = c.ask[i].a;
    if (v == null) return diagBox([['未記入', '金額が入力されていない。']]);
    const trap = ((CLOSING_TRAPS[c.id] || [])[i] || []).find(([n]) => n === v);
    if (trap) return diagBox([['よくある間違い', `${fmt(v)} と答えている。${esc(trap[1])}`]]);
    // ずれの金額が整理仕訳の金額と一致すれば、どの整理の反映漏れかを示す
    const diff = Math.abs(v - ans);
    const hit = (CLOSING_EXP[c.id] || { entries: [] }).entries.find(e => [...e.dr, ...e.cr].some(([, n]) => n === diff));
    return diagBox([['金額違い', `${fmt(v)} と答えている。正解の ${fmt(ans)} と ${fmt(diff)} ずれている。${hit ? `ずれの金額は整理事項「${esc(hit.t.replace(/^\d+\.\s*/, ''))}」の金額と同じ。この整理の反映漏れや二重計上がないか確かめよう。` : '下の解説の計算を、1つずつ照らし合わせよう。'}`]]);
  }

  function tbHTML(c) {
    let dsum = 0, csum = 0;
    const rows = c.tb.map(([n, d, cr]) => { dsum += d; csum += cr; return `<tr><td class="n">${d ? fmt(d) : ''}</td><td>${esc(n)}</td><td class="n">${cr ? fmt(cr) : ''}</td></tr>`; }).join('');
    return `<table class="tb"><thead><tr><th>借方</th><th>勘定科目</th><th>貸方</th></tr></thead><tbody>${rows}</tbody>
      <tfoot><tr><td class="n">${fmt(dsum)}</td><td></td><td class="n">${fmt(csum)}</td></tr></tfoot></table>`;
  }

  // ===== 本番模試 =====
  let E = null; // 試験の状態
  let timerId = null;

  function newExam() {
    const c3 = pick(CLOSING);
    E = {
      q1: shuffle(JOURNAL).slice(0, 15).map(q => ({ q, order: shuffle(q.choices), a: {} })),
      q2a: shuffle(BOOK_Q).slice(0, 5).map(q => ({ q, a: [] })),
      q2b: shuffle(WORD_Q).slice(0, 5).map(q => ({ q, opts: shuffle(q.opts), a: '' })),
      q3: { c: c3, a: c3.ask.map(() => '') },
      page: 0,
      end: Date.now() + 60 * 60 * 1000,
      done: false,
    };
    buildNav();
    renderPage();
    show('exam');
    clearInterval(timerId);
    timerId = setInterval(tick, 500);
    tick();
  }
  const PAGES = () => [...E.q1.map((_, i) => ({ t: 'q1', i })), { t: 'q2' }, { t: 'q3' }];

  function tick() {
    if (!E || E.done) return;
    const left = Math.max(0, E.end - Date.now());
    const m = Math.floor(left / 60000), s = Math.floor(left / 1000) % 60;
    $('#timer').textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    $('#timer').parentElement.classList.toggle('warn', left < 5 * 60000);
    if (left === 0) { $('#examSpeech').textContent = C().timeUp; submitExam(); }
  }

  function buildNav() {
    const nav = $('#qnav');
    nav.innerHTML = '';
    PAGES().forEach((p, idx) => {
      if (p.t === 'q1' && p.i === 0) {
        const h = document.createElement('button');
        h.type = 'button'; h.className = 'sec'; h.textContent = '第1問';
        h.addEventListener('click', () => go(0));
        nav.appendChild(h);
      }
      const b = document.createElement('button');
      b.type = 'button';
      if (p.t === 'q1') { b.textContent = p.i + 1; b.setAttribute('aria-label', `第1問 ${p.i + 1}`); }
      else { b.textContent = p.t === 'q2' ? '第2問' : '第3問'; b.className = 'sec'; }
      b.dataset.idx = idx;
      b.addEventListener('click', () => go(idx));
      nav.appendChild(b);
    });
  }
  function refreshNav() {
    $$('#qnav button[data-idx]').forEach(b => {
      const idx = Number(b.dataset.idx), p = PAGES()[idx];
      b.classList.toggle('cur', idx === E.page);
      let done = false;
      if (p.t === 'q1') { const a = E.q1[p.i].a; done = ['dr', 'cr'].some(s => (a[s] || []).some(r => r[0] || r[1])); }
      if (p.t === 'q2') done = E.q2a.some(x => x.a.length) || E.q2b.some(x => x.a);
      if (p.t === 'q3') done = E.q3.a.some(v => v !== '');
      b.classList.toggle('done', done && idx !== E.page);
    });
  }
  function go(idx) {
    E.page = idx; renderPage(); window.scrollTo(0, 0);
    // スマートフォンでは問題番号が横スクロールなので、今の番号を見える位置へ
    const nav = $('#qnav'), cur = $('#qnav .cur');
    if (cur) nav.scrollLeft = cur.offsetLeft - nav.clientWidth / 2 + cur.offsetWidth / 2;
  }

  function renderPage() {
    // 入力イベントが積み重ならないよう、解答用紙の要素ごと作り直す
    const old = $('#paper'), paper = old.cloneNode(false);
    old.replaceWith(paper);
    const pages = PAGES(), p = pages[E.page];
    $('#prevBtn').disabled = E.page === 0;
    $('#nextBtn').disabled = E.page === pages.length - 1;
    $('#examSpeech').textContent = pick(C().idle[p.t]);

    if (p.t === 'q1') {
      const it = E.q1[p.i];
      paper.innerHTML = `<h2>第1問（45点）　仕訳　${p.i + 1} / 15</h2>
        <p class="note">各取引について仕訳しなさい。勘定科目は選択肢から最も適当なものを選ぶこと。</p>
        <p class="qtext"><span class="qno">${p.i + 1}.</span>${esc(it.q.q)}</p>`;
      const jt = journalTable(it.order, it.a, v => { it.a = v; refreshNav(); });
      paper.appendChild(jt.el);
      paper.insertAdjacentHTML('beforeend', `<p class="choice-list">選択肢：${it.order.map(esc).join('　')}</p>`);
    } else if (p.t === 'q2') {
      paper.innerHTML = `<h2>第2問（20点）</h2>
        <h3>(1) 次の取引が記入される補助簿をすべて選びなさい（各2点・完全解答）。</h3>
        <div class="bk-wrap"><table class="bk"><thead><tr><th>No.</th><th>取引</th>${BOOKS.map(b => `<th>${b}</th>`).join('')}</tr></thead>
        <tbody>${E.q2a.map((x, i) => `<tr><td class="no">${i + 1}</td><td class="tx"><span class="no-sp">${i + 1}. </span>${esc(x.q.q)}</td>${BOOKS.map(b => `<td><label class="bk-cb"><input type="checkbox" data-r="${i}" value="${b}" ${x.a.includes(b) ? 'checked' : ''}><span>${b}</span></label></td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <h3>(2) 文中の（　）に入る最も適当な語句を選びなさい（各2点）。</h3>
        <ol class="wd">${E.q2b.map((x, i) => `<li>${i + 1}. ${esc(x.q.q)}<br><select data-w="${i}" aria-label="語句 ${i + 1}"><option value="">（選択）</option>${x.opts.map(o => `<option ${x.a === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></li>`).join('')}</ol>`;
      paper.addEventListener('change', e => {
        const t = e.target;
        if (t.dataset.r != null) { const x = E.q2a[t.dataset.r]; x.a = $$(`input[data-r="${t.dataset.r}"]:checked`, paper).map(c => c.value); }
        if (t.dataset.w != null) E.q2b[t.dataset.w].a = t.value;
        refreshNav();
      });
    } else {
      const c = E.q3.c;
      paper.innerHTML = `<h2>第3問（35点）　決算</h2>
        <p class="qtext">${esc(c.title)}の決算整理前残高試算表と決算整理事項にもとづいて、損益計算書と貸借対照表に記載される金額を答えなさい（各5点）。</p>
        <div class="c3-grid">
          <div><h3>決算整理前残高試算表</h3>${tbHTML(c)}</div>
          <div><h3>決算整理事項</h3><ol class="adj">${c.adj.map(a => `<li>${esc(a)}</li>`).join('')}</ol>
            <h3>解答欄（単位：円）</h3>
            <table class="ans3">${c.ask.map((k, i) => `<tr><th>${esc(k.k)}</th><td><input data-k="${i}" inputmode="numeric" autocomplete="off" value="${esc(E.q3.a[i])}" aria-label="${esc(k.k)}"></td></tr>`).join('')}</table>
          </div>
        </div>`;
      paper.addEventListener('input', e => { if (e.target.dataset.k != null) { E.q3.a[e.target.dataset.k] = e.target.value; refreshNav(); } });
      paper.addEventListener('focusout', e => { if (e.target.dataset.k != null) { const n = parseAmt(e.target.value); if (n != null) { e.target.value = fmt(n); E.q3.a[e.target.dataset.k] = e.target.value; } } });
    }
    refreshNav();
  }

  async function submitExam() {
    if (!E || E.done) return;
    E.done = true;
    clearInterval(timerId);

    // 採点
    const res = [];
    let s1 = 0, s2 = 0, s3 = 0;
    const miss = id => { S.wrong[id] = (S.wrong[id] || 0) + 1; };
    E.q1.forEach((x, i) => { const ok = gradeJournal(x.q, x.a); if (ok) s1 += 3; else miss(x.q.id); res.push({ sec: '第1問', no: i + 1, ok, x, kind: 'j' }); });
    E.q2a.forEach((x, i) => { const ok = x.a.length === x.q.ans.length && x.q.ans.every(b => x.a.includes(b)); if (ok) s2 += 2; else miss(x.q.id); res.push({ sec: '第2問(1)', no: i + 1, ok, x, kind: 'b' }); });
    E.q2b.forEach((x, i) => { const ok = x.a === x.q.ans; if (ok) s2 += 2; else miss(x.q.id); res.push({ sec: '第2問(2)', no: i + 1, ok, x, kind: 'w' }); });
    E.q3.c.ask.forEach((k, i) => { const ok = parseAmt(E.q3.a[i]) === k.a; if (ok) s3 += 5; res.push({ sec: '第3問', no: i + 1, ok, i, v: E.q3.a[i], kind: 'c' }); });
    const total = s1 + s2 + s3, pass = total >= 70;
    S.exams++; S.last = total; S.best = S.best == null ? total : Math.max(S.best, total);
    store.save();

    renderResult(res, { s1, s2, s3, total, pass });
    show('result');

    // 間違えた数だけ叩く
    const ng = res.filter(r => !r.ok);
    if (ng.length) {
      const hold = ng.length > 10 ? 650 : 1000;
      skipAll = false;
      for (let i = 0; i < ng.length; i++) {
        await bonk(i === 0 ? C().rush(ng.length) : pick(C().ng), `${ng[i].sec} ${ng[i].no}　（${i + 1} / ${ng.length}発目）`, hold);
        // スキップしても残りの発数は累計に足す
        if (skipAll) { S.punches += ng.length - i - 1; store.save(); refreshHeader(); break; }
      }
      skipAll = false;
    }
    if (pass) setTimeout(() => praise(total === 100 ? C().praisePerfect : C().praisePass), 200);
  }

  function renderResult(res, sc) {
    $('#verdict').textContent = sc.pass ? '合格' : '不合格';
    $('#verdict').classList.toggle('fail', !sc.pass);
    $('#resultImg').src = img(sc.pass ? 'pass' : 'ko');
    $('#scoreBody').innerHTML = `
      <tr><td>第1問　仕訳</td><td>${sc.s1}</td><td>45</td></tr>
      <tr><td>第2問　補助簿・語句</td><td>${sc.s2}</td><td>20</td></tr>
      <tr><td>第3問　決算</td><td>${sc.s3}</td><td>35</td></tr>
      <tr class="total"><td>合計</td><td>${sc.total}</td><td>100</td></tr>`;
    const ng = res.filter(r => !r.ok).length;
    $('#resultSpeech').textContent = sc.pass
      ? (ng ? C().pass(sc.total, ng) : C().perfect)
      : C().fail(sc.total, ng);

    const c3 = E.q3.c;
    $('#review').innerHTML = `<p class="note">×の問題は解説を開いた状態で表示している。○の問題も「解説」を開けば読める。</p>` + res.map(r => {
      const mark = `<span class="rv-mark ${r.ok ? 'ok' : 'ng'}">${r.ok ? '○' : '×'}</span>`;
      const ttl = `${r.sec}　${r.no}`;
      if (r.kind === 'j') {
        const body = `<p>${esc(r.x.q.q)}</p>${r.ok ? '' : yourJournal(r.x.a)}<p class="lbl">正解</p>${journalAnsTable(r.x.q.dr, r.x.q.cr)}${r.ok ? '' : diagnoseJournal(r.x.q, r.x.a)}`;
        return block(mark, ttl, r.x.q.cat, body, explainJournal(r.x.q), !r.ok);
      }
      if (r.kind === 'b') {
        const body = `<p>${esc(r.x.q.q)}</p><p>あなたの解答：${r.x.a.length ? r.x.a.join('、') : '（未記入）'}</p><p>正解：<b>${r.x.q.ans.join('、')}</b></p>${r.ok ? '' : diagnoseBook(r.x.q, r.x.a)}`;
        return block(mark, ttl, '補助簿', body, explainBook(r.x.q), !r.ok);
      }
      if (r.kind === 'w') {
        const body = `<p>${esc(r.x.q.q)}</p><p>あなたの解答：${esc(r.x.a || '（未記入）')}　／　正解：<b>${esc(r.x.q.ans)}</b></p>${r.ok ? '' : diagnoseWord(r.x.q, r.x.a)}`;
        return block(mark, ttl, '語句', body, explainWord(r.x.q), !r.ok);
      }
      const v = parseAmt(r.v);
      const head = r.no === 1 ? block('', `第3問　決算整理仕訳の全体（${esc(c3.title)}）`, '決算', '', closingAll(c3), true) : '';
      const body = `<p>${esc(c3.ask[r.i].k)}</p><p>あなたの解答：${v == null ? '（未記入）' : fmt(v)}　／　正解：<b>${fmt(c3.ask[r.i].a)}</b></p>${r.ok ? '' : diagnoseClosing(c3, r.i, r.v)}`;
      return head + block(mark, ttl, '決算', body, explainClosingItem(c3, r.i), !r.ok);
    }).join('');
  }
  const block = (mark, ttl, cat, body, expHtml, open) => `<div class="rv"><div class="rv-head">${mark}<b>${ttl}</b><span class="note">${esc(cat)}</span></div>
    <div class="rv-body">${body}<details class="rv-exp" ${open ? 'open' : ''}><summary>解説（なぜこの答えになるか）</summary>${expHtml}</details></div></div>`;

  // ===== 仕訳千本ノック =====
  const HP_MAX = 5;
  let K = null;
  function newKnock(mode) {
    let pool = JOURNAL;
    const cat = $('#catSel').value;
    if (mode === 'weak') pool = JOURNAL.filter(q => S.wrong[q.id] > 0);
    else if (cat) pool = JOURNAL.filter(q => q.cat === cat);
    if (!pool.length) return;
    K = { mode, pool, deck: [], hp: HP_MAX, n: 0, ok: 0, streak: 0, best: 0, cur: null, judged: false };
    show('knock');
    $('#knockImg').src = img('idle');
    $('#knockSpeech').textContent = mode === 'weak' ? C().knockWeak : C().knock(HP_MAX);
    nextKnock();
  }
  function nextKnock() {
    if (!K.deck.length) K.deck = shuffle(K.pool);
    const q = K.deck.pop();
    K.cur = { q, order: shuffle(q.choices), a: {} };
    K.judged = false;
    // 前の問題の正解・不正解のリアクションを、通常のポーズとせりふに戻す
    $('#knockImg').src = img('idle');
    if (K.n > 0) $('#knockSpeech').textContent = pick(C().idle.q1);
    renderKnock();
  }
  const hpHTML = () => Array.from({ length: HP_MAX }, (_, i) => `<span class="${i < K.hp ? '' : 'lost'}"></span>`).join('');
  const knockStat = () => `出題 ${K.n}問　正解 ${K.ok}問　連続正解 ${K.streak}`;
  function renderKnock() {
    $('#hpCells').innerHTML = hpHTML();
    $('#knockStat').textContent = knockStat();
    const p = $('#knockPaper');
    p.innerHTML = `<h2>仕訳千本ノック　${K.n + 1}本目<span class="h2-sub">${esc(K.cur.q.cat)}</span></h2>
      <p class="qtext">${esc(K.cur.q.q)}</p>`;
    const jt = journalTable(K.cur.order, {}, v => { K.cur.a = v; });
    p.appendChild(jt.el);
    p.insertAdjacentHTML('beforeend', `<p class="choice-list">選択肢：${K.cur.order.map(esc).join('　')}</p>
      <div class="row-btns"><button type="button" class="btn-primary" id="judgeBtn">判定する</button></div><div id="judgeBox"></div>`);
    $('#judgeBtn').addEventListener('click', () => judgeKnock(jt.read()));
    const first = $('select', p); if (first) first.focus({ preventScroll: true });
  }
  async function judgeKnock(ans) {
    if (K.judged) return;
    K.judged = true;
    const q = K.cur.q, ok = gradeJournal(q, ans);
    K.n++;
    $$('#knockPaper select, #knockPaper input').forEach(el => { el.disabled = true; });
    const btn = $('#judgeBtn'); btn.disabled = true;
    if (ok) {
      K.ok++; K.streak++; K.best = Math.max(K.best, K.streak);
      if (S.wrong[q.id] > 0) S.wrong[q.id]--;
      store.save();
      $('#knockImg').src = img('praise');
      $('#knockSpeech').textContent = K.streak >= 5 ? C().streak(K.streak) : pick(C().ok);
      praise();
    } else {
      K.streak = 0; K.hp--;
      S.wrong[q.id] = (S.wrong[q.id] || 0) + 1;
      store.save();
      $('#knockImg').src = img('hit');
      $('#knockSpeech').textContent = C().knockNg;
      await bonk(pick(C().ng), `体力 残り${K.hp}`);
    }
    $('#knockStat').textContent = knockStat();
    $('#hpCells').innerHTML = hpHTML();
    $('#judgeBox').innerHTML = `<div class="judge ${ok ? 'ok' : 'ng'}"><h4>${ok ? '○ 正解' : '× 不正解'}</h4>
      ${ok ? '' : yourJournal(ans)}<p class="lbl">正解</p>${journalAnsTable(q.dr, q.cr)}${ok ? '' : diagnoseJournal(q, ans)}
      <details class="rv-exp" open><summary>解説（なぜこの仕訳になるか）</summary>${explainJournal(q)}</details></div>
      <div class="row-btns"><button type="button" class="btn-primary" id="nextKnockBtn">${K.hp > 0 ? '次の問題' : '結果を見る'}</button></div>`;
    btn.parentElement.remove();
    const nb = $('#nextKnockBtn');
    nb.addEventListener('click', () => { K.hp > 0 ? nextKnock() : endScreen(); });
    if (!ok) $('#judgeBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
    else nb.focus({ preventScroll: true });
  }
  function endScreen() {
    sfxHit();
    $('#koLine').textContent = C().end(K.ok);
    $('#koStat').textContent = `出題 ${K.n}問　正解 ${K.ok}問　最高連続正解 ${K.best}`;
    $('#fxKo').hidden = false;
  }

  // ===== 復習ノート =====
  function renderNotes() {
    const sec = $('#ntSec').value, cat = $('#ntCat').value, weak = $('#ntWeak').checked;
    const kw = $('#ntQ').value.trim();
    $('#ntCatWrap').hidden = sec !== 'j';
    $('#ntWeakWrap').hidden = sec === 'c';
    const hit = (...texts) => !kw || texts.some(t => String(t).includes(kw));
    const weakTag = id => S.wrong[id] > 0 ? `<span class="tag">苦手 ×${S.wrong[id]}</span>` : '';
    let items = [];
    if (sec === 'j') {
      items = JOURNAL.filter(q => (!cat || q.cat === cat) && (!weak || S.wrong[q.id] > 0) &&
        hit(q.q, q.exp, ...q.dr.map(r => r[0]), ...q.cr.map(r => r[0]))).map((q, i) => `<div class="nt">
        <div class="nt-head"><b>仕訳 ${JOURNAL.indexOf(q) + 1}</b><span class="note">${esc(q.cat)}</span>${weakTag(q.id)}</div>
        <p class="qtext">${esc(q.q)}</p>
        <details><summary>答えと解説を見る</summary><p class="lbl">正解</p>${journalAnsTable(q.dr, q.cr)}${explainJournal(q)}</details></div>`);
    } else if (sec === 'b') {
      items = BOOK_Q.filter(q => (!weak || S.wrong[q.id] > 0) && hit(q.q, q.exp, ...q.ans)).map(q => `<div class="nt">
        <div class="nt-head"><b>補助簿 ${BOOK_Q.indexOf(q) + 1}</b>${weakTag(q.id)}</div><p class="qtext">${esc(q.q)}</p>
        <details><summary>答えと解説を見る</summary><p>正解：<b>${q.ans.join('、')}</b></p>${explainBook(q)}</details></div>`);
    } else if (sec === 'w') {
      items = WORD_Q.filter(q => (!weak || S.wrong[q.id] > 0) && hit(q.q, q.ans, WORD_EXP[q.id])).map(q => `<div class="nt">
        <div class="nt-head"><b>語句 ${WORD_Q.indexOf(q) + 1}</b>${weakTag(q.id)}</div><p class="qtext">${esc(q.q)}</p>
        <p class="note">選択肢：${q.opts.map(esc).join('　')}</p>
        <details><summary>答えと解説を見る</summary><p>正解：<b>${esc(q.ans)}</b></p>${explainWord(q)}</details></div>`);
    } else {
      items = CLOSING.filter(c => hit(c.title, ...c.adj, ...c.ask.map(k => k.k))).map(c => `<div class="nt">
        <div class="nt-head"><b>${esc(c.title)}</b></div>
        <div class="c3-grid"><div><h3>決算整理前残高試算表</h3>${tbHTML(c)}</div>
        <div><h3>決算整理事項</h3><ol class="adj">${c.adj.map(a => `<li>${esc(a)}</li>`).join('')}</ol>
        <h3>問われる金額</h3><ol class="adj">${c.ask.map(k => `<li>${esc(k.k)}</li>`).join('')}</ol></div></div>
        <details><summary>決算整理仕訳の全体を見る</summary>${closingAll(c)}</details>
        ${c.ask.map((k, i) => `<details><summary>${esc(k.k)} の答えと解説</summary><p>正解：<b>${fmt(k.a)}</b></p>${explainClosingItem(c, i)}</details>`).join('')}</div>`);
    }
    $('#notesList').innerHTML = items.length ? `<p class="note">${items.length}件</p>` + items.join('')
      : `<p class="speech">${weak ? 'この区分で間違えた問題はまだ無い。' : '該当する問題が無い。'}</p>`;
  }
  function openNotes() {
    $('#ntCat').value = $('#catSel').value;
    renderNotes();
    show('notes');
  }

  // ===== イベント =====
  function init() {
    applyMotion();
    refreshHeader();
    applyChar();
    $('#mildChk').checked = S.mild;
    [...new Set(JOURNAL.map(q => q.cat))].forEach(c => {
      $('#catSel').insertAdjacentHTML('beforeend', `<option>${esc(c)}</option>`);
      $('#ntCat').insertAdjacentHTML('beforeend', `<option>${esc(c)}</option>`);
    });

    document.addEventListener('click', e => {
      const g = e.target.closest('[data-go]');
      if (!g) return;
      ac(); // 初回操作で音声を有効化
      const to = g.dataset.go;
      $('#fxKo').hidden = true;
      if (to === 'title') { leaveExamGuard(() => { refreshTitle(); show('title'); }); }
      if (to === 'exam') newExam();
      if (to === 'knock') newKnock('knock');
      if (to === 'weak') newKnock('weak');
      if (to === 'notes') openNotes();
    });
    $('#toTitle').addEventListener('click', e => { e.preventDefault(); leaveExamGuard(() => { $('#fxKo').hidden = true; refreshTitle(); show('title'); }); });
    $$('[data-char]').forEach(b => b.addEventListener('click', () => { S.char = b.dataset.char; store.save(); applyChar(); sfxHit(); }));
    $('#soundBtn').addEventListener('click', () => { S.sound = !S.sound; store.save(); refreshHeader(); if (S.sound) sfxOk(); });
    $('#mildChk').addEventListener('change', e => { S.mild = e.target.checked; store.save(); applyMotion(); });
    $('#prevBtn').addEventListener('click', () => go(E.page - 1));
    $('#nextBtn').addEventListener('click', () => go(E.page + 1));
    $('#submitBtn').addEventListener('click', () => {
      ask('提出して採点します。提出後は解答を直せません。よろしいですか？', '提出する', submitExam);
    });
    $('#fxSkip').addEventListener('click', e => { e.stopPropagation(); skipAll = true; if (fxSkip) fxSkip(); });
    $('#koRetry').addEventListener('click', () => { $('#fxKo').hidden = true; newKnock(K ? K.mode : 'knock'); });
    ['#ntSec', '#ntCat', '#ntWeak'].forEach(s => $(s).addEventListener('change', renderNotes));
    $('#ntQ').addEventListener('input', renderNotes);
    $('#ntOpenAll').addEventListener('click', () => $$('#notesList details').forEach(d => { d.open = true; }));
    $('#ntCloseAll').addEventListener('click', () => $$('#notesList details').forEach(d => { d.open = false; }));
    window.addEventListener('beforeunload', e => { if (E && !E.done && !$('#s-exam').hidden) { e.preventDefault(); e.returnValue = ''; } });
  }
  function leaveExamGuard(fn) {
    if (E && !E.done && !$('#s-exam').hidden) {
      ask('試験の途中です。中断してタイトルへ戻りますか？（解答は破棄されます）', '中断する', () => {
        E.done = true; clearInterval(timerId);
        fn();
      });
      return;
    }
    fn();
  }
  // 確認の画面（ブラウザの確認ダイアログは、埋め込み表示だと出ないため使わない）
  function ask(msg, okLabel, onOk) {
    const box = $('#fxAsk');
    $('#askMsg').textContent = msg;
    $('#askOk').textContent = okLabel;
    box.hidden = false;
    $('#askOk').onclick = () => { box.hidden = true; onOk(); };
    $('#askNo').onclick = () => { box.hidden = true; };
    $('#askNo').focus({ preventScroll: true });
  }

  init();
})();
