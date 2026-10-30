// 電卓（問題を解く画面で常に表示）。計算結果は、最後にタップした金額欄へ入れられる。
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const OPS = { '+': (a, b) => a + b, '-': (a, b) => a - b, '*': (a, b) => a * b, '/': (a, b) => (b === 0 ? NaN : a / b) };
  const SYM = { '+': '＋', '-': '−', '*': '×', '/': '÷' };
  // 小数の誤差（0.1+0.2 など）を丸める
  const clean = n => Math.round(n * 1e10) / 1e10;
  const show = n => {
    if (!isFinite(n)) return 'エラー';
    const [i, d] = String(clean(n)).split('.');
    return Number(i).toLocaleString('ja-JP') + (d ? '.' + d : '');
  };

  let cur = '0';      // 入力中の数
  let acc = null;     // 計算途中の値
  let op = null;      // 待っている演算子
  let fresh = true;   // 次の数字で入力し直すか
  let lastAmt = null; // 最後にフォーカスした金額欄

  const num = () => Number(cur);
  function render() {
    $('#calcMain').textContent = cur === 'エラー' ? cur : show(num()) + (cur.endsWith('.') ? '.' : '');
    $('#calcSub').textContent = acc != null && op ? `${show(acc)} ${SYM[op]}` : '';
  }
  function digit(d) {
    if (fresh || cur === '0' || cur === 'エラー') { cur = d === '00' ? '0' : d; fresh = false; }
    else if (cur.replace(/[^\d]/g, '').length < 15) cur += d;
    render();
  }
  function dot() {
    if (fresh || cur === 'エラー') { cur = '0.'; fresh = false; }
    else if (!cur.includes('.')) cur += '.';
    render();
  }
  function setOp(o) {
    if (cur === 'エラー') return;
    if (acc != null && op && !fresh) acc = OPS[op](acc, num());
    else if (acc == null || !op || !fresh) acc = num();
    op = o; fresh = true;
    cur = isFinite(acc) ? String(clean(acc)) : 'エラー';
    render();
  }
  function equal() {
    if (op == null || acc == null || cur === 'エラー') return;
    const r = OPS[op](acc, num());
    cur = isFinite(r) ? String(clean(r)) : 'エラー';
    acc = null; op = null; fresh = true;
    render();
  }
  // ％：「1,000,000 × 2.4 ％」→ 24,000 のように使える
  function percent() {
    if (cur === 'エラー') return;
    let r;
    if (acc != null && op === '*') r = acc * num() / 100;
    else if (acc != null && op === '/') r = acc / num() * 100;
    else if (acc != null && (op === '+' || op === '-')) r = OPS[op](acc, acc * num() / 100);
    else r = num() / 100;
    cur = isFinite(r) ? String(clean(r)) : 'エラー';
    acc = null; op = null; fresh = true;
    render();
  }
  function back() {
    if (fresh || cur === 'エラー') return;
    cur = cur.length > 1 ? cur.slice(0, -1) : '0';
    if (cur === '-') cur = '0';
    render();
  }
  function clearEntry() { cur = '0'; fresh = true; render(); }
  function clearAll() { cur = '0'; acc = null; op = null; fresh = true; render(); }

  function insert() {
    const msg = $('#calcMsg');
    if (cur === 'エラー') return;
    if (!lastAmt || !document.body.contains(lastAmt) || lastAmt.disabled || lastAmt.offsetParent === null) {
      msg.textContent = '先に、入れたい金額欄をタップしてください。';
      return;
    }
    const n = Math.round(num());
    lastAmt.value = Math.abs(n).toLocaleString('ja-JP');
    lastAmt.dispatchEvent(new Event('input', { bubbles: true }));
    lastAmt.dispatchEvent(new Event('change', { bubbles: true }));
    msg.textContent = n !== num() ? '小数点以下を四捨五入して入れました。' : '金額欄に入れました。';
  }

  // 問題を解く画面（本番模試・千本ノック）では常に表示する。
  // パソコンでは右の列（先生の下）に置き、スマートフォンでは画面下に固定する。
  const SOLVE = ['#s-exam', '#s-knock'];
  const narrowMq = window.matchMedia('(max-width: 860px)');
  function place() {
    const panel = $('#calc');
    const scr = SOLVE.map(s => $(s)).find(el => el && !el.hidden);
    const narrow = narrowMq.matches;
    panel.hidden = !scr;
    document.body.classList.toggle('calc-dock', !!scr && narrow);
    if (!scr || !narrow) setOpen(false);
    if (!scr) return;
    // 画面下に固定するときは、画面を揺らす演出の影響を受けないよう body 直下に置く
    const home = narrow ? document.body : scr.querySelector('.side');
    if (panel.parentElement !== home) home.appendChild(panel);
    $('#calcMsg').textContent = '';
    syncHeight();
  }
  // スマートフォン：普段は細い帯だけを出し、タップするとキーを開く
  function setOpen(open) {
    $('#calc').classList.toggle('open', open);
    document.body.classList.toggle('calc-exp', open);
    const t = $('#calcToggle');
    t.textContent = open ? '閉じる' : '開く';
    t.setAttribute('aria-expanded', String(open));
    $('#calcMsg').textContent = '';
    syncHeight();
    if (open && lastAmt && document.body.contains(lastAmt) && lastAmt.offsetParent !== null) keepVisible(lastAmt);
  }
  // スマートフォン：電卓の高さ分だけ下に余白を取り、「前の問題・次の問題」を電卓の上に出す
  function syncHeight() {
    const panel = $('#calc');
    const h = document.body.classList.contains('calc-dock') ? panel.offsetHeight : 0;
    document.documentElement.style.setProperty('--calc-h', h + 'px');
  }
  // スマートフォン：電卓の裏に隠れた金額欄を、選んだときに電卓より上へ出す
  function keepVisible(el) {
    if (!document.body.classList.contains('calc-dock')) return;
    const pager = $('#s-exam').hidden ? null : $('#s-exam .pager');
    const limit = $('#calc').getBoundingClientRect().top - (pager ? pager.offsetHeight : 0) - 8;
    const r = el.getBoundingClientRect();
    if (r.bottom > limit) window.scrollBy({ top: r.bottom - limit + 16, behavior: 'smooth' });
  }

  function init() {
    // 金額欄（仕訳・第3問）を最後に触った場所として覚える
    const remember = e => { if (e.target.matches && e.target.matches('.jg input, .ans3 input')) lastAmt = e.target; };
    document.addEventListener('focusin', remember);
    document.addEventListener('pointerdown', remember);
    document.addEventListener('focusin', e => { if (e.target.matches && e.target.matches('.paper input, .paper select')) keepVisible(e.target); });
    // 画面の切り替え（hidden 属性の変化）と画面幅の変化に合わせて置き場所を変える
    const mo = new MutationObserver(place);
    SOLVE.forEach(s => mo.observe($(s), { attributes: true, attributeFilter: ['hidden'] }));
    narrowMq.addEventListener('change', place);
    new ResizeObserver(syncHeight).observe($('#calc'));
    $('#calcToggle').addEventListener('click', () => setOpen(!$('#calc').classList.contains('open')));
    place();
    const keys = $('#calcKeys');
    // ボタンを押しても金額欄のフォーカスが外れないようにする
    keys.addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); });
    $('#calcIns').addEventListener('mousedown', e => e.preventDefault());
    keys.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const k = b.dataset.k;
      $('#calcMsg').textContent = '';
      if (/^\d+$/.test(k)) digit(k);
      else if (k === '.') dot();
      else if (OPS[k]) setOp(k);
      else if (k === '=') equal();
      else if (k === '%') percent();
      else if (k === 'BS') back();
      else if (k === 'C') clearEntry();
      else if (k === 'AC') clearAll();
    });
    $('#calcIns').addEventListener('click', insert);
    // キーボード：金額欄などに入力中でなければ電卓が受け取る
    document.addEventListener('keydown', e => {
      if ($('#calc').hidden || e.ctrlKey || e.metaKey || e.altKey) return;
      // 電卓の中か、何も選んでいないときだけ電卓が受け取る（ページのボタン操作を邪魔しない）
      const t = e.target;
      if (!(t === document.body || $('#calc').contains(t))) return;
      const k = e.key;
      if (/^\d$/.test(k)) digit(k);
      else if (k === '.') dot();
      else if (OPS[k]) setOp(k);
      else if (k === 'Enter' || k === '=') { equal(); e.preventDefault(); }
      else if (k === '%') percent();
      else if (k === 'Backspace') back();
      else if (k === 'Delete' || k === 'Escape') clearEntry();
      else return;
      e.preventDefault();
    });
    render();
  }
  init();
})();
