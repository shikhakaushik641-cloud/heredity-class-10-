/* Class 10 Biology Ch4 Heredity — interactive figures. Shared genetics helpers on window.GEN (used by lab4.js / games4.js) */
(function () {
  "use strict";
  var MA = window.MikoAudio || { sfx: function () {} };
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function read(f, t) { var r = $(".sim-read", f); if (r) r.innerHTML = t; }

  /* ---------- genetics helpers ---------- */
  function pairs(g) { var out = []; for (var i = 0; i < g.length; i += 2) out.push(g.substr(i, 2)); return out; }
  function sortPair(p) { return p[0] === p[0].toUpperCase() || p[1] === p[1].toLowerCase() ? p : p[1] + p[0]; }
  function norm(g) { return pairs(g).map(sortPair).join(""); }
  function gametes(g) { var out = [""]; pairs(g).forEach(function (p) { var n = []; out.forEach(function (o) { [p[0], p[1]].forEach(function (a) { var x = o + a; if (n.indexOf(x) < 0) n.push(x); }); }); out = n; }); return out; }
  function join(a, b) { var s = ""; for (var i = 0; i < a.length; i++) s += sortPair(a[i] + b[i]); return s; }
  function cross(g1, g2) { var A = gametes(g1), B = gametes(g2), cells = []; B.forEach(function (b) { A.forEach(function (a) { cells.push(join(a, b)); }); }); return { top: A, side: B, cells: cells }; }
  function dom(p) { return p[0] === p[0].toUpperCase(); }
  var PH = { T: ["Tall", "Dwarf"], R: ["Round", "Wrinkled"], Y: ["Yellow", "Green"], P: ["Purple", "White"], W: ["Violet", "White"], B: ["Black", "White"], A: ["Dominant A", "recessive a"] };
  function pheno(g) { return pairs(g).map(function (p) { var L = PH[p[0].toUpperCase()] || ["Dominant", "Recessive"]; return dom(p) ? L[0] : L[1]; }).join(", "); }
  function tally(list) { var c = {}, order = []; list.forEach(function (x) { if (!(x in c)) { c[x] = 0; order.push(x); } c[x]++; }); return order.map(function (k) { return [k, c[k]]; }); }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function ratio(counts) { var g = counts.reduce(function (s, x) { return gcd(s, x); }, 0) || 1; return counts.map(function (x) { return x / g; }).join(" : "); }
  function fmt(g) { return g.replace(/I\^?A/g, "I<sup>A</sup>"); }
  // ABO: genotype letters A, B, o
  function aboGroup(g) { var a = g.indexOf("A") > -1, b = g.indexOf("B") > -1; return a && b ? "AB" : a ? "A" : b ? "B" : "O"; }
  function aboHtml(g) { return g.split("").map(function (x) { return x === "o" ? "i" : "I<sup>" + x + "</sup>"; }).join(""); }
  function aboCross(g1, g2) { var cells = []; g2.split("").forEach(function (b) { g1.split("").forEach(function (a) { var p = a + b; if (p[0] === "o" && p[1] !== "o") p = p[1] + p[0]; if (p === "BA") p = "AB"; cells.push(p); }); }); return cells; }
  var plantIc = function (tall) { return '<svg viewBox="0 0 30 40" width="22" height="30" aria-hidden="true"><path d="M15 40 V' + (tall ? 3 : 22) + '" stroke="#15803d" stroke-width="2.5"/><ellipse cx="10" cy="' + (tall ? 14 : 28) + '" rx="5" ry="2.6" fill="#4ade80"/><ellipse cx="20" cy="' + (tall ? 24 : 33) + '" rx="5" ry="2.6" fill="#4ade80"/></svg>'; };
  function seedIc(round, yellow, w) { w = w || 26; var c = yellow ? "#facc15" : "#4ade80"; return '<svg viewBox="0 0 64 64" width="' + w + '" height="' + w + '" aria-hidden="true">' + (round ? '<circle cx="32" cy="32" r="22" fill="' + c + '" stroke="#3f3f46" stroke-width="3"/>' : '<path d="M14 30 Q16 14 30 13 Q36 18 42 13 Q52 18 50 30 Q56 38 48 46 Q40 52 32 48 Q22 54 16 44 Q10 38 14 30 Z" fill="' + c + '" stroke="#3f3f46" stroke-width="3"/>') + "</svg>"; }
  window.GEN = { pairs: pairs, norm: norm, gametes: gametes, cross: cross, pheno: pheno, tally: tally, ratio: ratio, aboGroup: aboGroup, aboHtml: aboHtml, aboCross: aboCross, plantIc: plantIc, seedIc: seedIc, dom: dom };

  function seg(f, name, cb) { $$('[data-set="' + name + '"]', f).forEach(function (b) { b.addEventListener("click", function () { $$('[data-set="' + name + '"]', f).forEach(function (x) { x.classList.toggle("on", x === b); }); MA.sfx("pop", .25); cb(b.dataset.val); }); }); }
  function getSeg(f, name) { var b = $('[data-set="' + name + '"].on', f); return b ? b.dataset.val : null; }
  function slider(f, cb) { $$(".n-range", f).forEach(function (r) { r.addEventListener("input", function () { r.nextElementSibling.textContent = r.value; cb(); }); }); }
  function rv(f) { return +$(".n-range", f).value; }
  function grid(top, side, cells, cellHtml) {
    var cols = top.length, h = '<div class="pg" style="grid-template-columns:44px repeat(' + cols + ',minmax(0,1fr));width:' + (cols * 100 + 60) + 'px;max-width:100%"><div class="pg-x">♀ \\ ♂</div>';
    top.forEach(function (t) { h += '<div class="pg-g"><span>' + t + "</span></div>"; });
    side.forEach(function (s, r) { h += '<div class="pg-g"><span>' + s + "</span></div>"; top.forEach(function (t, c) { h += cellHtml(cells[r * cols + c], r * cols + c); }); });
    return h + "</div>";
  }

  var SIMS = {
    variation: function (f) {
      var box = $(".var-out", f), seed = 7, COLS = ["#a3e635", "#f9a8d4", "#fbbf24", "#c4b5fd", "#fb923c", "#2dd4bf", "#fb7185", "#93c5fd", "#fde047", "#86efac", "#f0abfc", "#fdba74"];
      function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
      function draw() {
        var G = rv(f), sex = getSeg(f, "mode") === "sex", s0 = seed, next = 0, gens = [[[]]];
        for (var g = 1; g < G; g++) {
          var prev = gens[g - 1], cur = [];
          prev.forEach(function (m, i) { for (var k = 0; k < 2; k++) {
            var marks = m.slice();
            if (sex) { var mate = prev[(i + 1 + Math.floor(rnd() * prev.length)) % prev.length]; mate.forEach(function (x) { if (rnd() < .5 && marks.indexOf(x) < 0) marks.push(x); }); if (rnd() < .7) marks.push(next++); }
            else if (rnd() < .35) marks.push(next++);
            cur.push(marks);
          } });
          gens.push(cur);
        }
        seed = s0;
        var W = 360, H = 46 + (G - 1) * 64, svg = '<svg class="var-svg" viewBox="0 0 ' + W + " " + H + '">';
        gens.forEach(function (row, g) { var n = row.length, y = 26 + g * 64;
          row.forEach(function (m, i) { var x = (i + .5) * W / n;
            if (g) { var px = (Math.floor(i / 2) + .5) * W / gens[g - 1].length; svg += '<path d="M' + px + " " + (y - 50) + " L" + x + " " + (y - 16) + '" stroke="#2a5a4f" stroke-width="2"/>'; }
            svg += '<ellipse cx="' + x + '" cy="' + y + '" rx="' + Math.min(18, W / n / 2 - 3) + '" ry="14" fill="#ecfdf5" stroke="#0f766e" stroke-width="2"/>';
            m.slice(-4).forEach(function (c, k) { svg += '<circle cx="' + (x - 7 + (k % 2) * 14) + '" cy="' + (y - 5 + Math.floor(k / 2) * 10) + '" r="4" fill="' + COLS[c % COLS.length] + '"/>'; });
          }); });
        box.innerHTML = svg + "</svg>";
        var last = gens[G - 1], types = {}; last.forEach(function (m) { types[m.slice().sort().join(",")] = 1; });
        read(f, "Generation " + G + ": <b>" + last.length + "</b> individuals, <b>" + Object.keys(types).length + "</b> different type" + (Object.keys(types).length === 1 ? "" : "s") + (sex ? " — mixing DNA from two parents creates much more variety." : " — only DNA-copying errors add variety, so many look alike."));
      }
      seg(f, "mode", draw); slider(f, draw); $(".var-new", f).addEventListener("click", function () { seed = Math.floor(Math.random() * 233280); MA.sfx("pop", .3); draw(); }); draw();
    },
    traits: function (f) {
      var T = [["Colour of the eyes", "inh"], ["A scar from a cycle fall", "acq"], ["Free or attached earlobes", "inh"], ["Ability to speak French", "acq"], ["Blood group", "inh"], ["Big muscles from gym training", "acq"], ["Curly or straight hair", "inh"], ["A tail cut short in an accident (dog)", "acq"], ["Skin tanned by the summer sun", "acq"], ["Shape of the nose", "inh"]], i = 0, score = 0, card = $(".tr-card", f);
      function show() { if (i >= T.length) { card.innerHTML = '<b>Done! ' + score + " / " + T.length + "</b><small>Tap a button to play again</small>"; return; } card.innerHTML = "<small>Trait " + (i + 1) + " of " + T.length + "</small><b>" + T[i][0] + "</b>"; }
      $$(".tr-b", f).forEach(function (b) { b.addEventListener("click", function () {
        if (i >= T.length) { i = 0; score = 0; read(f, ""); show(); return; }
        var ok = b.dataset.a === T[i][1]; if (ok) score++; MA.sfx(ok ? "correct" : "wrong", .3);
        read(f, (ok ? "✅ " : "❌ ") + T[i][0] + " is <b>" + (T[i][1] === "inh" ? "inherited — controlled by genes" : "acquired — it does not change the DNA of germ cells") + "</b>.");
        i++; show(); }); });
      show();
    },
    punnett: function (f) {
      var box = $(".pn", f);
      function draw() {
        var a = getSeg(f, "p1"), b = getSeg(f, "p2"), x = cross(a, b), t = tally(x.cells.map(norm));
        var A = x.top.length === 1 ? [x.top[0], x.top[0]] : x.top, B = x.side.length === 1 ? [x.side[0], x.side[0]] : x.side, cells = [];
        B.forEach(function (s) { A.forEach(function (p) { cells.push(norm(p + s)); }); });
        box.innerHTML = grid(A, B, cells, function (c) { var tall = c.indexOf("T") > -1; return '<div class="pg-c ' + (tall ? "dom" : "rec") + '">' + plantIc(tall) + "<b>" + c + "</b></div>"; });
        var tl = cells.filter(function (c) { return c.indexOf("T") > -1; }).length, gt = tally(cells).sort(function (p, q) { return p[0] < q[0] ? -1 : 1; });
        read(f, a + " × " + b + " → genotypes <b>" + gt.map(function (p) { return p[1] + " " + p[0]; }).join(" : ") + "</b> · phenotypes <b>" + (tl ? tl + " tall" : "") + (tl && 4 - tl ? " : " : "") + (4 - tl ? 4 - tl + " dwarf" : "") + "</b>" + (a === "Tt" && b === "Tt" ? " — Mendel’s 3 : 1!" : (a === "tt") !== (b === "tt") && (a === "Tt" || b === "Tt") ? " — a test cross showing 1 : 1." : ""));
      }
      seg(f, "p1", draw); seg(f, "p2", draw); draw();
    },
    f2count: function (f) {
      var box = $(".fc", f), c = { TT: 0, Tt: 0, tt: 0 };
      function grow(n) { for (var i = 0; i < n; i++) { var a = Math.random() < .5 ? "T" : "t", b = Math.random() < .5 ? "T" : "t"; c[norm(a + b)]++; } MA.sfx("pop", .25); draw(); }
      function draw() { var tot = c.TT + c.Tt + c.tt, tall = c.TT + c.Tt, pc = function (x) { return tot ? Math.round(x / tot * 100) : 0; };
        box.innerHTML = '<div class="fc-bars">' + [["TT", c.TT, "dom"], ["Tt", c.Tt, "dom"], ["tt", c.tt, "rec"]].map(function (r) { return '<div class="fc-r"><b>' + r[0] + '</b><span class="fc-bar"><i class="' + r[2] + '" style="width:' + pc(r[1]) + '%"></i></span><em>' + r[1] + "</em></div>"; }).join("") + "</div>";
        read(f, tot ? "<b>" + tot + "</b> plants: " + tall + " tall, " + c.tt + " dwarf → ratio <b>" + (c.tt ? (tall / c.tt).toFixed(2) : "∞") + " : 1</b>" + (tot >= 400 ? " — very close to 3 : 1." : " — grow more to see the pattern settle.") : "Tt × Tt. Tap Grow to raise F₂ plants."); }
      $(".fc-add", f).addEventListener("click", function () { grow(1); }); $(".fc-add10", f).addEventListener("click", function () { grow(10); });
      $(".fc-add100", f).addEventListener("click", function () { grow(100); }); $(".fc-add1000", f).addEventListener("click", function () { grow(1000); });
      $(".fc-reset", f).addEventListener("click", function () { c = { TT: 0, Tt: 0, tt: 0 }; draw(); }); draw();
    },
    dihybrid: function (f) {
      var box = $(".dh", f), x = cross("RrYy", "RrYy");
      function cls(g) { return (g.indexOf("R") > -1 ? "R" : "r") + (g.indexOf("Y") > -1 ? "Y" : "y"); }
      var NM = { RY: "round yellow", Ry: "round green", rY: "wrinkled yellow", ry: "wrinkled green" };
      function draw() { var k = getSeg(f, "cls");
        box.innerHTML = grid(x.top, x.side, x.cells, function (c) { var q = cls(c); return '<div class="pg-c d4' + (k !== "all" && k !== q ? " dim" : "") + (k === q ? " hi" : "") + '">' + seedIc(q[0] === "R", q[1] === "Y", 22) + "<b>" + c + "</b></div>"; });
        if (k === "all") read(f, "16 boxes → <b>9 round yellow : 3 round green : 3 wrinkled yellow : 1 wrinkled green</b>.");
        else { var m = x.cells.filter(function (c) { return cls(c) === k; }), g = tally(m); read(f, "<b>" + m.length + " / 16</b> are " + NM[k] + ": " + g.map(function (p) { return p[1] + "×" + p[0]; }).join(", ") + "."); } }
      seg(f, "cls", draw); draw();
    },
    gametes: function (f) {
      var box = $(".gm-t", f), inp = $(".gt-in", f);
      function draw(v) {
        v = (v || "").replace(/\s/g, "");
        if (!/^([A-Za-z]{2})+$/.test(v) || pairs(v).some(function (p) { return p[0].toLowerCase() !== p[1].toLowerCase(); }) || v.length > 8) { read(f, "Type pairs of the same letter, like <b>Tt</b> or <b>AaBbCc</b> (up to 4 genes)."); return; }
        var g = gametes(v), het = pairs(v).filter(function (p) { return p[0] !== p[1]; }).length;
        box.innerHTML = '<div class="gm-g">' + g.map(function (x) { return "<span>" + x + "</span>"; }).join("") + "</div>";
        read(f, "<b>" + v + "</b> has " + het + " heterozygous pair" + (het === 1 ? "" : "s") + " → 2<sup>" + het + "</sup> = <b>" + g.length + "</b> type" + (g.length === 1 ? "" : "s") + " of gamete.");
      }
      $$(".chipbtn", f).forEach(function (b) { b.addEventListener("click", function () { inp.value = ""; MA.sfx("pop", .3); draw(b.dataset.n); }); });
      function go() { if (inp.value.trim()) { MA.sfx("pop", .3); draw(inp.value.trim()); } }
      $(".go", f).addEventListener("click", go); inp.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
      draw("RrYy");
    },
    express: function (f) {
      var box = $(".ex", f);
      function draw() { var good = getSeg(f, "enz") === "good";
        box.innerHTML = '<div class="ex-flow"><span class="ex-s"><b>🧬 Gene</b><small>' + (good ? "normal" : "changed") + '</small></span><i>→</i><span class="ex-s"><b>⚙️ Enzyme</b><small>' + (good ? "works well" : "works poorly") + '</small></span><i>→</i><span class="ex-s"><b>💧 Hormone</b><small>' + (good ? "plenty" : "little") + '</small></span><i>→</i><span class="ex-s ex-p">' + plantIc(good).replace('width="22" height="30"', 'width="' + (good ? 44 : 44) + '" height="60"') + "<small>" + (good ? "Tall" : "Short") + "</small></span></div>";
        read(f, good ? "An efficient enzyme makes plenty of growth hormone, so the plant grows <b>tall</b>." : "A change in the gene makes the enzyme less efficient. Less hormone is made, so the plant stays <b>short</b>."); }
      seg(f, "enz", draw); draw();
    },
    sexdet: function (f) {
      var box = $(".sx", f), girls = 0, boys = 0, last = null;
      function baby() { last = Math.random() < .5 ? "X" : "Y"; if (last === "X") girls++; else boys++; }
      function draw() {
        box.innerHTML = '<div class="sx-p"><div class="sx-par"><b>👨 Father</b><span>44 + XY</span><div class="sx-gm"><em class="x' + (last === "X" ? " on" : "") + '">22 + X</em><em class="y' + (last === "Y" ? " on" : "") + '">22 + Y</em></div></div><div class="sx-par"><b>👩 Mother</b><span>44 + XX</span><div class="sx-gm"><em class="x on">22 + X</em><em class="x">22 + X</em></div></div></div>' +
          (last ? '<div class="sx-baby">' + (last === "X" ? "👧 44 + XX — a girl" : "👦 44 + XY — a boy") + "</div>" : '<div class="sx-baby muted">Tap “One baby”</div>');
        var t = girls + boys; read(f, t ? "Girls <b>" + girls + "</b> · Boys <b>" + boys + "</b> (" + Math.round(boys / t * 100) + "% boys). The father’s sperm decided each one." : "Every egg carries X. The sperm decides.");
      }
      $(".sx-one", f).addEventListener("click", function () { baby(); MA.sfx("pop", .3); draw(); });
      $(".sx-ten", f).addEventListener("click", function () { for (var i = 0; i < 10; i++) baby(); MA.sfx("pop", .3); draw(); });
      $(".sx-reset", f).addEventListener("click", function () { girls = boys = 0; last = null; draw(); }); draw();
    },
    abo: function (f) {
      var box = $(".ab-o", f);
      function draw() { var a = getSeg(f, "a1"), b = getSeg(f, "a2"), cells = aboCross(a, b), g = tally(cells.map(aboGroup)).sort();
        box.innerHTML = grid(a.split("").map(function (x) { return x === "o" ? "i" : "I<sup>" + x + "</sup>"; }), b.split("").map(function (x) { return x === "o" ? "i" : "I<sup>" + x + "</sup>"; }), cells, function (c) { return '<div class="pg-c bg-' + aboGroup(c) + '"><b>' + aboHtml(c) + "</b><small>Group " + aboGroup(c) + "</small></div>"; });
        read(f, "Group " + aboGroup(a) + " × group " + aboGroup(b) + " → " + g.map(function (p) { return "<b>" + p[0] + "</b> " + p[1] * 25 + "%"; }).join(", ") + "."); }
      seg(f, "a1", draw); seg(f, "a2", draw); draw();
    },
  };
  $$(".sim[data-sim]").forEach(function (f) { var fn = SIMS[f.dataset.sim]; if (fn) fn(f); });
})();
