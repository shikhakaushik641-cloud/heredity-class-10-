/* Helix’s Gene Lab — 6 heredity tools */
(function () {
  "use strict";
  var D = JSON.parse(document.getElementById("lab-data").textContent);
  var KEY = "her-b10-lab";
  var MA = window.MikoAudio || { say: function () { return Promise.resolve(false); }, sfx: function () {}, wave: function () {}, stop: function () {} };
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; } }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  var LABS = ["traits", "punnett", "testcross", "dihybrid", "gametes", "sexdet"], hub = $("#lab-hub");
  function show(id) { hub.hidden = !!id; LABS.forEach(function (k) { $("#lab-" + k).hidden = k !== id; }); window.scrollTo(0, 0); if (!id) paintHub(); }
  function paintHub() {
    var S = load(), n = LABS.filter(function (k) { return S[k]; }).length;
    $$(".lab-card").forEach(function (c) { $(".lc-done", c).hidden = !S[c.dataset.lab]; c.classList.toggle("is-done", !!S[c.dataset.lab]); });
    $(".lab-meter i").style.width = (n / 6 * 100) + "%"; $(".lab-meter-t").textContent = n + " of 6 lab tools done" + (n === 6 ? " — you’re a true geneticist! 🏅" : "");
  }
  function done(k) {
    var S = load(); if (S[k]) return; S[k] = 1; save(S);
    MA.sfx("fanfare", .45); MA.say("lab_done", { mascots: $$(".mascot") });
    var t = document.createElement("div"); t.className = "lab-toast"; t.innerHTML = "🏅 <b>Lab complete!</b> Saved to your lab record."; document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }
  $$(".lab-card").forEach(function (c) { c.addEventListener("click", function () { show(c.dataset.lab); MA.sfx("pop", .35); }); });
  $$(".lab-back").forEach(function (b) { b.addEventListener("click", function () { show(null); }); });
  function seg(scope, name, cb) {
    $$('[data-set="' + name + '"]', scope).forEach(function (b) {
      b.addEventListener("click", function () { $$('[data-set="' + name + '"]', scope).forEach(function (x) { x.classList.toggle("on", x === b); }); MA.sfx("pop", .25); if (cb) cb(b.dataset.val); });
    });
  }
  function getSeg(scope, name) { var b = $('[data-set="' + name + '"].on', scope); return b ? b.dataset.val : null; }
  function addRow(L, cells) { var tb = $(".notebook tbody", L), tr = document.createElement("tr"); tr.innerHTML = "<td>" + (tb.children.length + 1) + "</td>" + cells.map(function (c) { return "<td>" + c + "</td>"; }).join(""); tb.appendChild(tr); }
  function ask(box, q, opts, a, onRight, fact) {
    box.hidden = false;
    box.innerHTML = '<p class="q-s">❓ ' + esc(q) + '</p><div class="q-o">' + opts.map(function (o, i) { return '<button type="button" data-i="' + i + '">' + esc(o) + "</button>"; }).join("") + '</div><p class="q-w" hidden></p>';
    $$("button", box).forEach(function (b) {
      b.addEventListener("click", function () {
        var ok = +b.dataset.i === a; b.classList.add(ok ? "ok" : "bad"); MA.sfx(ok ? "correct" : "wrong", .4);
        var w = $(".q-w", box); w.hidden = false; w.innerHTML = ok ? "✅ <b>Correct!</b> " + (fact || "") : "❌ Not quite — look at the pattern and try again.";
        if (ok) { $$("button", box).forEach(function (x) { x.disabled = true; }); if (onRight) onRight(); } else { b.disabled = true; MA.say("lab_oops", {}); }
      });
    });
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var G = window.GEN;
  function chal(L, i, n, html) { $(".chal-pos", L).textContent = "Challenge " + (i + 1) + " of " + n; $(".chal", L).innerHTML = "🎯 <b>Challenge " + (i + 1) + ":</b> " + html; }
  function nextOr(L, key, i, n, load1, read, delay) { if (i < n - 1) { setTimeout(load1, delay || 1500); return i + 1; } done(key); read.innerHTML += " 🏅 All challenges done!"; return i; }
  function gridHtml(top, side, cellFn) { var h = '<div class="pg" style="grid-template-columns:44px repeat(' + top.length + ',minmax(0,1fr));width:' + (top.length * 100 + 60) + 'px;max-width:100%"><div class="pg-x">♀ \\ ♂</div>'; top.forEach(function (t) { h += '<div class="pg-g"><span>' + t + "</span></div>"; });
    side.forEach(function (s, r) { h += '<div class="pg-g"><span>' + s + "</span></div>"; top.forEach(function (t, c) { h += cellFn(r, c); }); }); return h + "</div>"; }
  function two(g) { var x = G.gametes(g); return x.length === 1 ? [x[0], x[0]] : x; }

  /* ---------- 1. Trait Sorter ---------- */
  (function () {
    var L = $("#lab-traits"), i = 0, read = $(".lab-read", L), card = $(".bk-out", L), busy = false;
    function load1() { busy = false; read.innerHTML = ""; card.innerHTML = "<small>Trait " + (i + 1) + " of " + D.traits.length + "</small><b>" + D.traits[i][0] + "</b>"; chal(L, i, D.traits.length, "Is “" + D.traits[i][0] + "” inherited or acquired?"); }
    $$(".ts-b", L).forEach(function (b) { b.addEventListener("click", function () {
      if (busy) return; var t = D.traits[i];
      if (b.dataset.a !== t[1]) { MA.sfx("wrong", .3); MA.say("lab_oops", {}); read.innerHTML = "❌ Think again: " + (t[1] === "inh" ? "this is controlled by genes you were born with." : "this was picked up during life — it doesn’t change the DNA of sperm or egg."); return; }
      busy = true; MA.sfx("correct", .4); addRow(L, [t[0], t[1] === "inh" ? "Inherited" : "Acquired"]);
      read.innerHTML = "✅ " + (t[1] === "inh" ? "Inherited — passed on through genes." : "Acquired — not passed on to children.");
      i = nextOr(L, "traits", i, D.traits.length, load1, read, 1100); }); });
    load1();
  })();

  /* ---------- 2. Punnett Builder ---------- */
  (function () {
    var L = $("#lab-punnett"), i = 0, read = $(".lab-read", L), box = $(".pb", L), askBox = $(".lab-ask", L), cells, A, B, opts;
    function load1() {
      var c = D.punnett[i]; A = two(c.a); B = two(c.b); var ch = c.a[0].toUpperCase(); opts = [ch + ch, ch + ch.toLowerCase(), ch.toLowerCase() + ch.toLowerCase()];
      cells = [null, null, null, null]; read.innerHTML = ""; askBox.hidden = true; askBox.innerHTML = ""; $(".run", L).disabled = false;
      chal(L, i, D.punnett.length, "Cross <b>" + c.a + " × " + c.b + "</b>. Fill each box with the offspring genotype."); draw();
    }
    function draw() {
      box.innerHTML = gridHtml(A, B, function (r, c) { var k = r * 2 + c, v = cells[k]; return '<button type="button" class="pg-c pb-c' + (v === null ? " empty" : "") + '" data-k="' + k + '"><b>' + (v === null ? "?" : opts[v]) + "</b></button>"; });
      $$(".pb-c", box).forEach(function (b) { b.addEventListener("click", function () { var k = +b.dataset.k; cells[k] = cells[k] === null ? 0 : (cells[k] + 1) % 3; MA.sfx("pop", .2); draw(); }); });
    }
    $(".run", L).addEventListener("click", function () {
      if (cells.indexOf(null) > -1) { read.innerHTML = "Fill all four boxes first."; return; }
      var wrong = []; B.forEach(function (s, r) { A.forEach(function (p, c) { if (opts[cells[r * 2 + c]] !== G.norm(p + s)) wrong.push(r * 2 + c); }); });
      if (wrong.length) { MA.sfx("wrong", .3); MA.say("lab_oops", {}); read.innerHTML = "❌ " + wrong.length + " box" + (wrong.length > 1 ? "es are" : " is") + " wrong. Each box takes one letter from its column gamete and one from its row gamete.";
        wrong.forEach(function (k) { $('.pb-c[data-k="' + k + '"]', box).classList.add("bad"); }); return; }
      MA.sfx("correct", .4); $(".run", L).disabled = true; var c = D.punnett[i], gs = cells.map(function (v) { return opts[v]; }), t = G.tally(gs);
      read.innerHTML = "✅ Square correct!";
      ask(askBox, c.q, c.o, c.k, function () { addRow(L, [c.a + " × " + c.b, t.map(function (p) { return p[1] + " " + p[0]; }).join(", "), c.o[c.k]]); i = nextOr(L, "punnett", i, D.punnett.length, load1, read, 1700); });
    });
    load1();
  })();

  /* ---------- 3. Mystery Plant (test cross) ---------- */
  (function () {
    var L = $("#lab-testcross"), i = 0, read = $(".lab-read", L), box = $(".tc", L), vbox = $(".tc-v", L), kids = [], runs = 0;
    var NAME = { T: ["tall", "dwarf", "🌿"], P: ["purple-flowered", "white-flowered", "🌸"], R: ["round-seeded", "wrinkled-seeded", "🟡"], Y: ["yellow-seeded", "green-seeded", "🟡"] };
    function load1() {
      var c = D.testcross[i], ch = c.ch, n = NAME[ch]; kids = []; runs = 0; read.innerHTML = "";
      chal(L, i, D.testcross.length, "A " + n[0] + " plant of unknown genotype. Is it <b>" + ch + ch + "</b> or <b>" + ch + ch.toLowerCase() + "</b>? Cross it with a " + n[1] + " (" + ch.toLowerCase() + ch.toLowerCase() + ") plant.");
      vbox.innerHTML = '<button type="button" class="btn ghost" data-g="' + ch + ch + '">' + ch + ch + " (pure)</button> <button type=\"button\" class=\"btn ghost\" data-g=\"" + ch + ch.toLowerCase() + '">' + ch + ch.toLowerCase() + " (hybrid)</button>";
      $$("button", vbox).forEach(function (b) { b.addEventListener("click", function () { verdict(b.dataset.g); }); }); draw();
    }
    function grow() {
      var c = D.testcross[i], g = c.g; runs++;
      do { kids = []; for (var k = 0; k < 8; k++) kids.push(g[Math.random() < .5 ? 0 : 1] === g[0].toUpperCase() ? 1 : 0); } while (g[0] !== g[1] && kids.indexOf(0) < 0);
      MA.sfx("pop", .3); draw();
    }
    function draw() {
      var c = D.testcross[i], n = NAME[c.ch];
      box.innerHTML = '<div class="tc-par"><span class="tc-m">❓ ' + n[0] + '</span><b>×</b><span>' + c.ch.toLowerCase() + c.ch.toLowerCase() + " " + n[1] + '</span></div><div class="tc-kids">' + (kids.length ? kids.map(function (d) { return '<span class="' + (d ? "dom" : "rec") + '">' + (c.ch === "T" ? G.plantIc(!!d) : d ? "●" : "○") + "</span>"; }).join("") : '<span class="hint">No offspring yet</span>') + "</div>";
      if (kids.length) { var dm = kids.filter(Boolean).length; read.innerHTML = "Offspring: <b>" + dm + " " + n[0] + "</b>, <b>" + (8 - dm) + " " + n[1] + "</b>."; }
    }
    function verdict(gu) {
      if (!kids.length) { read.innerHTML = "Grow some offspring first — that’s your evidence!"; return; }
      var c = D.testcross[i], dm = kids.filter(Boolean).length;
      if (gu !== c.g) { MA.sfx("wrong", .3); MA.say("lab_oops", {}); read.innerHTML = "❌ Look at the evidence: " + (8 - dm ? "a recessive offspring needs a recessive allele from <i>both</i> parents." : "every offspring showed the dominant trait."); return; }
      MA.sfx("correct", .4); addRow(L, ["Plant " + (i + 1), dm + " : " + (8 - dm), c.g]);
      read.innerHTML = "✅ " + c.g + "! " + (c.g[0] === c.g[1] ? "All offspring dominant → the plant gave only dominant alleles." : "Recessive offspring appeared → the plant must carry a recessive allele (about 1 : 1).");
      i = nextOr(L, "testcross", i, D.testcross.length, load1, read, 1900);
    }
    $(".tc-run", L).addEventListener("click", grow);
    load1();
  })();

  /* ---------- 4. Seed Counter (dihybrid) ---------- */
  (function () {
    var L = $("#lab-dihybrid"), i = 0, read = $(".lab-read", L), box = $(".dc", L), inb = $(".dc-in", L), x, want;
    var CL = [["RY", "Round yellow"], ["Ry", "Round green"], ["rY", "Wrinkled yellow"], ["ry", "Wrinkled green"]];
    function cls(g) { return (g.indexOf("R") > -1 ? "R" : "r") + (g.indexOf("Y") > -1 ? "Y" : "y"); }
    function load1() {
      var c = D.dihybrid[i]; x = G.cross(c.a, c.b); read.innerHTML = "";
      want = CL.map(function (k) { return x.cells.filter(function (g) { return cls(g) === k[0]; }).length; });
      chal(L, i, D.dihybrid.length, "Cross <b>" + c.a + " × " + c.b + "</b> gives " + x.cells.length + " boxes. Count each seed type.");
      box.innerHTML = '<div class="pg" style="grid-template-columns:44px repeat(' + x.top.length + ',minmax(0,1fr));width:' + (x.top.length * 100 + 60) + 'px;max-width:100%"><div class="pg-x">♀ \\ ♂</div>' + x.top.map(function (t) { return '<div class="pg-g"><span>' + t + "</span></div>"; }).join("") + x.side.map(function (s, r) { return '<div class="pg-g"><span>' + s + "</span></div>" + x.top.map(function (t, k) { var g = x.cells[r * x.top.length + k], q = cls(g); return '<div class="pg-c d4">' + G.seedIc(q[0] === "R", q[1] === "Y", 22) + "<b>" + g + "</b></div>"; }).join(""); }).join("") + "</div>";
      inb.innerHTML = CL.map(function (k, j) { return '<label class="dc-l">' + G.seedIc(k[0][0] === "R", k[0][1] === "Y", 22) + "<span>" + k[1] + '</span><input type="number" min="0" max="16" inputmode="numeric" class="num-in dc-n" data-j="' + j + '"></label>'; }).join("");
    }
    $(".run", L).addEventListener("click", function () {
      var got = $$(".dc-n", L).map(function (e) { return e.value === "" ? -1 : +e.value; });
      if (got.indexOf(-1) > -1) { read.innerHTML = "Fill in all four counts (use 0 if there are none)."; return; }
      var bad = got.map(function (v, j) { return v !== want[j]; });
      $$(".dc-n", L).forEach(function (e, j) { e.classList.toggle("bad", bad[j]); });
      if (bad.indexOf(true) > -1) { MA.sfx("wrong", .3); MA.say("lab_oops", {}); read.innerHTML = "❌ Some counts are off. Round needs at least one R; yellow needs at least one Y."; return; }
      MA.sfx("correct", .4); var c = D.dihybrid[i]; addRow(L, [c.a + " × " + c.b, want.join(" : ")]);
      read.innerHTML = "✅ " + want.join(" : ") + (want.join() === "9,3,3,1" ? " — Mendel’s famous 9 : 3 : 3 : 1!" : " — ratio " + G.ratio(want.filter(Boolean)) + " for the types present.");
      i = nextOr(L, "dihybrid", i, D.dihybrid.length, load1, read, 1900);
    });
    load1();
  })();

  /* ---------- 5. Gamete Factory ---------- */
  (function () {
    var L = $("#lab-gametes"), i = 0, read = $(".lab-read", L), box = $(".gf", L), ob = $(".gf-o", L), sel = {};
    function load1() {
      var g = D.gametes[i], all = G.gametes(G.pairs(g).map(function (p) { return p[0].toUpperCase() + p[0].toLowerCase(); }).join("")); sel = {}; read.innerHTML = "";
      chal(L, i, D.gametes.length, "Which gametes can <b>" + g + "</b> make? Tap all of them.");
      box.innerHTML = '<div class="gf-big">' + g + "</div><small class=\"hint\">Each gamete gets ONE allele of every gene.</small>";
      ob.innerHTML = all.map(function (x) { return '<button type="button" class="gf-b" data-g="' + x + '">' + x + "</button>"; }).join("");
      $$(".gf-b", ob).forEach(function (b) { b.addEventListener("click", function () { sel[b.dataset.g] = !sel[b.dataset.g]; b.classList.toggle("on", sel[b.dataset.g]); MA.sfx("pop", .2); }); });
    }
    $(".run", L).addEventListener("click", function () {
      var g = D.gametes[i], want = G.gametes(g), got = Object.keys(sel).filter(function (k) { return sel[k]; });
      var extra = got.filter(function (k) { return want.indexOf(k) < 0; }), miss = want.filter(function (k) { return got.indexOf(k) < 0; });
      if (extra.length || miss.length) { MA.sfx("wrong", .3); MA.say("lab_oops", {}); read.innerHTML = "❌ " + (extra.length ? extra.join(", ") + " can’t be made — check the homozygous genes. " : "") + (miss.length ? "You missed " + miss.length + "." : ""); return; }
      MA.sfx("correct", .4); addRow(L, [g, want.join(", "), want.length]);
      read.innerHTML = "✅ " + want.length + " gamete type" + (want.length > 1 ? "s" : "") + " = 2<sup>" + Math.round(Math.log2(want.length)) + "</sup>.";
      i = nextOr(L, "gametes", i, D.gametes.length, load1, read, 1700);
    });
    load1();
  })();

  /* ---------- 6. Baby Predictor ---------- */
  (function () {
    var L = $("#lab-sexdet"), i = 0, read = $(".lab-read", L), box = $(".bp", L), askBox = $(".lab-ask", L);
    seg(L, "sp", paint); seg(L, "eg", paint);
    function paint() { var sp = getSeg(L, "sp"), eg = getSeg(L, "eg");
      box.innerHTML = '<div class="sx-p"><div class="sx-par"><b>👨 Sperm</b><span>' + (sp ? "22 + " + sp : "—") + '</span></div><div class="sx-par"><b>👩 Egg</b><span>' + (eg ? "22 + " + eg : "—") + "</span></div></div>"; }
    function load1() { $$('[data-set]', L).forEach(function (b) { b.classList.remove("on"); }); read.innerHTML = ""; askBox.hidden = true; askBox.innerHTML = ""; $(".run", L).disabled = false; chal(L, i, D.sexdet.length, D.sexdet[i].t); paint(); }
    $(".run", L).addEventListener("click", function () {
      var sp = getSeg(L, "sp"), eg = getSeg(L, "eg"), c = D.sexdet[i];
      if (!sp || !eg) { read.innerHTML = "Pick one sperm and one egg."; return; }
      box.innerHTML += '<div class="sx-baby">' + (sp === "X" ? "👧 44 + XX — a girl" : "👦 44 + XY — a boy") + "</div>";
      if (sp !== c.want) { MA.sfx("wrong", .3); MA.say("lab_oops", {}); read.innerHTML = "❌ That made a " + (sp === "X" ? "girl" : "boy") + ". Which sperm carries the chromosome you need?"; return; }
      MA.sfx("correct", .4); $(".run", L).disabled = true; read.innerHTML = "✅ Sperm 22 + " + sp + " + egg 22 + X.";
      function fin() { addRow(L, ["22+" + sp + " + 22+X", sp === "X" ? "Girl (XX)" : "Boy (XY)"]); i = nextOr(L, "sexdet", i, D.sexdet.length, load1, read, 1700); }
      if (c.q) ask(askBox, c.q, c.o, c.k, fin, "Each birth is an independent 50 : 50 chance, decided by the father’s sperm."); else fin();
    });
    load1();
  })();

  if (/[?&]qa=1/.test(location.search)) window.__lab = { load: load };
  paintHub();
  function fromHash() { var h = (location.hash || "").slice(1); if (LABS.indexOf(h) > -1) show(h); }
  fromHash(); window.addEventListener("hashchange", fromHash);
})();
