/* Helix's Gene Arcade — Pea Breeder, Gene Pairs, Allele Catcher */
(function () {
  "use strict";
  var D = JSON.parse(document.getElementById("games-data").textContent);
  var KEY = "her-b10-games";
  var MA = window.MikoAudio || { say: function () { return Promise.resolve(false); }, sfx: function () {}, wave: function () {}, stop: function () {} };
  var G = window.GEN;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; } }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function shuf(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var views = { hub: $("#g-hub"), pb: $("#g-pb"), gp: $("#g-gp"), ac: $("#g-ac") };
  function show(v) { Object.keys(views).forEach(function (k) { views[k].hidden = k !== v; }); document.body.classList.toggle("in-game", v !== "hub"); window.scrollTo(0, 0); }
  function coach(scope, text, voice) {
    var b = $(".coach-bubble", scope); if (b) { b.innerHTML = text; b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); }
    if (voice) MA.say(voice, { mascots: $$(".coach .mascot", scope) });
  }
  function paintHub() { var S = load(); ["pb", "gp", "ac"].forEach(function (k) { var e = $("#best-" + k); if (e) e.textContent = S[k] ? S[k] + " pts" : "–"; }); }
  function best(k, score) { var S = load(), had = !!S[k], nb = !S[k] || score > S[k]; if (nb) { S[k] = score; save(S); } return { nb: nb && had, best: S[k] }; }
  function stopAll() { stopGP(); stopAC(); }
  $$("[data-play]").forEach(function (b) { b.addEventListener("click", function () { ({ pb: startPB, gp: startGP, ac: startAC })[b.dataset.play](); }); });
  $$(".to-hub").forEach(function (b) { b.addEventListener("click", function () { stopAll(); MA.stop(); show("hub"); paintHub(); }); });

  /* ================= Pea Breeder ================= */
  var B = null;
  function phen(g) { var p = G.pairs(g).map(function (x) { return G.dom(x) ? x[0].toUpperCase() : x[0].toLowerCase(); }).join(""); return p; }
  function kidIcon(g) {
    var ch = g[0].toUpperCase(), d = G.dom(g.substr(0, 2));
    if (g.length === 4) { var r = G.dom(g.substr(0, 2)), y = G.dom(g.substr(2, 2)); return G.seedIc(r, y, 24); }
    if (ch === "T") return G.plantIc(d);
    return '<span class="pb-fl" style="color:' + (d ? "#a78bfa" : "#f8fafc") + '">✿</span>';
  }
  function offspring(a, b) { var x = G.cross(a, b), c = x.cells.map(G.norm); while (c.length < 16) c = c.concat(c); return c.slice(0, 16); }
  function judge(k, kids) {
    var ph = kids.map(phen), t = G.tally(ph), cnt = function (p) { return ph.filter(function (x) { return x === p; }).length; };
    if (k === "tt") return kids.indexOf("tt") > -1;
    if (k === "pp") return kids.indexOf("pp") > -1;
    if (k === "rryy") return kids.indexOf("rryy") > -1;
    if (k === "allT") return cnt("T") === 16;
    if (k === "half") return cnt("T") === 8 && cnt("t") === 8;
    if (k === "allRY") return cnt("RY") === 16;
    if (k === "9331") return cnt("RY") === 9 && cnt("Ry") === 3 && cnt("rY") === 3 && cnt("ry") === 1;
    if (k === "1111") return t.length === 4 && t.every(function (p) { return p[1] === 4; });
    return false;
  }
  function startPB() { stopAll(); show("pb"); $(".pb-end").hidden = true; $(".pb-wrap").hidden = false; B = { i: 0, score: 0, stars: 0, first: 0 }; coach(views.pb, "Pick two parents that will give me the target!", "pb_start"); MA.wave(views.pb); pbRound(); }
  function pbRound() {
    var c = D.breed[B.i]; B.tries = 0; B.sel = []; B.done = false;
    $(".b-lvl").textContent = "Target " + (B.i + 1) + " of " + D.breed.length; $(".pb-goal").innerHTML = "🎯 Breed " + c.t + ".";
    $(".pb-bank").innerHTML = c.bank.map(function (g, j) { return '<button type="button" class="pb-p" data-j="' + j + '"><span>' + kidIcon(g) + "</span><b>" + g + "</b><small>" + G.pheno(g) + "</small></button>"; }).join("");
    $$(".pb-p").forEach(function (b) { b.addEventListener("click", function () { if (B.done) return; var j = +b.dataset.j, k = B.sel.indexOf(j); if (k > -1) B.sel.splice(k, 1); else { if (B.sel.length === 2) B.sel.shift(); B.sel.push(j); } MA.sfx("pop", .2); paintSel(); }); });
    $(".pb-kids").innerHTML = ""; $(".b-msg").textContent = ""; $(".b-msg").className = "rr-msg b-msg"; $(".pb-next").hidden = true; $(".pb-grow").disabled = false; paintSel(); pbStats();
  }
  function paintSel() { $$(".pb-p").forEach(function (b) { b.classList.toggle("on", B.sel.indexOf(+b.dataset.j) > -1); }); }
  function pbStats() { $(".b-score").textContent = B.score; $(".b-tries").textContent = B.tries; $(".b-stars").textContent = B.stars + "⭐"; }
  $(".pb-grow").addEventListener("click", function () {
    if (!B || B.done) return; if (B.sel.length < 2) { $(".b-msg").textContent = "Pick two parents first."; return; }
    var c = D.breed[B.i], a = c.bank[B.sel[0]], b = c.bank[B.sel[1]], kids = offspring(a, b); B.tries++;
    $(".pb-kids").innerHTML = '<p class="hint">' + a + " × " + b + "</p>" + kids.map(function (g) { return '<span class="pb-k">' + kidIcon(g) + "<small>" + g + "</small></span>"; }).join("");
    var ok = judge(c.k, kids), m = $(".b-msg");
    if (ok) { B.done = true; var pts = Math.max(10, 100 - (B.tries - 1) * 30), st = B.tries === 1 ? 3 : B.tries === 2 ? 2 : 1; B.score += pts; B.stars += st; if (B.tries === 1) B.first++;
      MA.sfx("correct", .45); m.innerHTML = "✅ Target bred! +" + pts + " " + "⭐".repeat(st); m.className = "rr-msg b-msg ok"; $(".pb-grow").disabled = true;
      if (st === 3) coach(views.pb, "First try! You think like Mendel! 🌱", "g_combo");
      var n = $(".pb-next"); n.hidden = false; n.textContent = B.i < D.breed.length - 1 ? "Next target →" : "See results →"; }
    else { MA.sfx("wrong", .35); m.innerHTML = "❌ Not this time — look at the offspring and pick a different pair."; m.className = "rr-msg b-msg bad"; }
    pbStats();
  });
  $(".pb-next").addEventListener("click", function () { if (B.i < D.breed.length - 1) { B.i++; pbRound(); } else pbEnd(); });
  function pbEnd() {
    $(".pb-wrap").hidden = true; var e = $(".pb-end"); e.hidden = false; var b = best("pb", B.score);
    $(".b-final", e).textContent = B.score; $(".b-best", e).hidden = !b.nb;
    $(".b-stats", e).innerHTML = "<div><b>" + B.stars + "/" + D.breed.length * 3 + "</b><span>Stars ⭐</span></div><div><b>" + B.first + "</b><span>First-try targets</span></div><div><b>" + b.best + "</b><span>High score</span></div>";
    MA.sfx("fanfare", .55); MA.wave(views.pb); coach(views.pb, b.nb ? "New high score! Woo-hoo! 🏆" : "Every target bred — what a plant breeder!", b.nb ? "g_best" : "pb_win");
  }
  $(".b-again").addEventListener("click", startPB);

  /* ================= Gene Pairs ================= */
  var P = null, piv = null;
  function stopGP() { clearInterval(piv); }
  function startGP() {
    stopAll(); show("gp"); $(".gp-end").hidden = true; $(".gp-board").hidden = false;
    var pick = shuf(D.pairs.slice()).slice(0, 8), cards = [];
    pick.forEach(function (p, i) { cards.push({ id: i, t: p[0], w: true }); cards.push({ id: i, t: p[1], w: false }); });
    P = { cards: shuf(cards), open: [], moves: 0, pairs: 0, t: 0, lock: false };
    $(".gp-board").innerHTML = P.cards.map(function (c, k) { return '<button type="button" class="gp-c" data-k="' + k + '"><span class="gp-in"><span class="gp-f">🧬</span><span class="gp-b' + (c.w ? " w" : "") + '">' + esc(c.t) + "</span></span></button>"; }).join("");
    $$(".gp-c").forEach(function (b) { b.addEventListener("click", function () { flip(+b.dataset.k); }); });
    coach(views.gp, "Match each word with its meaning!", "gp_start"); MA.wave(views.gp); gpStats();
    piv = setInterval(function () { P.t++; gpStats(); }, 1000);
  }
  function gpStats() { $(".p-moves").textContent = P.moves; $(".p-pairs").textContent = P.pairs; $(".p-time").textContent = P.t + "s"; }
  function flip(k) {
    if (P.lock) return; var el = $('.gp-c[data-k="' + k + '"]'); if (el.classList.contains("up") || el.classList.contains("done")) return;
    el.classList.add("up"); MA.sfx("pop", .2); P.open.push(k);
    if (P.open.length < 2) return;
    P.moves++; var a = P.cards[P.open[0]], b = P.cards[P.open[1]], ea = $('.gp-c[data-k="' + P.open[0] + '"]'), m = $(".p-msg");
    if (a.id === b.id) { ea.classList.add("done"); el.classList.add("done"); P.pairs++; P.open = []; MA.sfx("correct", .4); m.innerHTML = "✅ " + esc(a.w ? a.t : b.t) + " → " + esc(a.w ? b.t : a.t); m.className = "rr-msg p-msg ok";
      if (P.pairs === 8) setTimeout(gpEnd, 600); }
    else { P.lock = true; MA.sfx("wrong", .25); m.textContent = "Not a pair — remember where they are!"; m.className = "rr-msg p-msg bad";
      setTimeout(function () { ea.classList.remove("up"); el.classList.remove("up"); P.open = []; P.lock = false; }, 900); }
    gpStats();
  }
  function gpEnd() {
    stopGP(); $(".gp-board").hidden = true; var score = Math.max(20, 220 - P.moves * 8 - Math.floor(P.t / 2)), e = $(".gp-end"), b; e.hidden = false; b = best("gp", score);
    $(".p-final", e).textContent = score; $(".p-best", e).hidden = !b.nb;
    $(".p-stats", e).innerHTML = "<div><b>" + P.moves + "</b><span>Moves (8 is perfect)</span></div><div><b>" + P.t + "s</b><span>Time</span></div><div><b>" + b.best + "</b><span>High score</span></div>";
    MA.sfx("fanfare", .55); MA.wave(views.gp); coach(views.gp, b.nb ? "New high score! Woo-hoo! 🏆" : "Board cleared! Your gene memory is dominant!", b.nb ? "g_best" : "gp_win");
  }
  $(".p-again").addEventListener("click", startGP);

  /* ================= Allele Catcher ================= */
  var C = null, raf = 0, civ = null, LANES = 4;
  var FAM = { T: ["T", "t"], t: ["T", "t"], X: ["X", "Y"], Y: ["X", "Y"], p: ["P", "p"], R: ["R", "r", "Y", "y"], r: ["R", "r", "Y", "y"], "Iᴬ": ["Iᴬ", "Iᴮ", "i"], "Iᴮ": ["Iᴬ", "Iᴮ", "i"] };
  function stopAC() { cancelAnimationFrame(raf); clearInterval(civ); if (C) C.over = true; }
  function startAC() {
    stopAll(); show("ac"); $(".ac-end").hidden = true; $(".ac-field").hidden = false;
    $$(".ac-item").forEach(function (x) { x.remove(); });
    C = { score: 0, lives: 3, t: 60, lane: 1, items: [], spawn: 0, made: 0, ti: 0, over: false, last: 0, wrong: [] };
    newTarget(); placeBasket(); coach(views.ac, "Catch only what the target needs!", "ac_start"); MA.wave(views.ac); acStats();
    civ = setInterval(function () { C.t--; if (C.t <= 10) MA.sfx("tick", .2); acStats(); if (C.t <= 0) acEnd(); }, 1000);
    C.last = performance.now(); raf = requestAnimationFrame(tick);
  }
  function newTarget() { var c = D.catch[C.ti % D.catch.length]; C.ti++; C.goal = c; C.need = c.need.slice(); paintGoal(); }
  function paintGoal() { $(".ac-goal").innerHTML = "🎯 Build " + esc(C.goal.t) + ": " + C.goal.need.map(function (x, i) { return '<span class="ac-n' + (i < C.goal.need.length - C.need.length ? " got" : "") + '">' + esc(x) + "</span>"; }).join(""); }
  function placeBasket() { $(".ac-basket").style.left = ((C.lane + .5) / LANES * 100) + "%"; }
  function acStats() { $(".c-score").textContent = C.score; $(".c-lives").textContent = "❤️".repeat(Math.max(0, C.lives)) + "🖤".repeat(3 - Math.max(0, C.lives)); var t = $(".c-time"); t.textContent = Math.max(0, C.t) + "s"; t.classList.toggle("hot", C.t <= 10); }
  function spawn() {
    var pool = FAM[C.goal.need[0]] || ["T", "t"], v = Math.random() < .55 && C.need.length ? C.need[Math.floor(Math.random() * C.need.length)] : pool[Math.floor(Math.random() * pool.length)];
    var el = document.createElement("span"); el.className = "ac-item"; el.textContent = v; $(".ac-field").appendChild(el);
    var it = { v: v, lane: Math.floor(Math.random() * LANES), y: -8, el: el }; el.style.left = ((it.lane + .5) / LANES * 100) + "%"; C.items.push(it);
  }
  function tick(now) {
    if (!C || C.over) return; var dt = Math.min(50, now - C.last) / 1000; C.last = now;
    var speed = 26 + (60 - C.t) * .55; C.spawn -= dt; if (C.spawn <= 0) { spawn(); C.spawn = Math.max(.55, 1.15 - (60 - C.t) * .01); }
    C.items = C.items.filter(function (it) {
      it.y += speed * dt; it.el.style.top = it.y + "%";
      if (it.y >= 82 && it.y < 96 && it.lane === C.lane) { catchIt(it); it.el.remove(); return false; }
      if (it.y > 104) { it.el.remove(); return false; }
      return true;
    });
    raf = requestAnimationFrame(tick);
  }
  function catchIt(it) {
    var k = C.need.indexOf(it.v);
    if (k > -1) { C.need.splice(k, 1); C.score += 10; MA.sfx("pop", .3); paintGoal();
      if (!C.need.length) { C.score += 40; C.made++; MA.sfx("correct", .45); coach(views.ac, "Built " + esc(C.goal.t) + "! +50", C.made % 3 === 0 ? "g_combo" : null); setTimeout(function () { if (C && !C.over) newTarget(); }, 250); } }
    else { C.lives--; MA.sfx("wrong", .4); C.wrong.push(it.v + " (needed " + C.need.join(", ") + " for " + C.goal.t + ")"); $(".ac-field").classList.add("shake"); setTimeout(function () { $(".ac-field").classList.remove("shake"); }, 400); if (C.lives <= 0) acEnd(); }
    acStats();
  }
  function move(d) { if (!C || C.over) return; C.lane = Math.max(0, Math.min(LANES - 1, C.lane + d)); placeBasket(); }
  $(".ac-l").addEventListener("click", function () { move(-1); }); $(".ac-r").addEventListener("click", function () { move(1); });
  $(".ac-field").addEventListener("pointerdown", function (e) { if (!C || C.over) return; var r = this.getBoundingClientRect(); C.lane = Math.max(0, Math.min(LANES - 1, Math.floor((e.clientX - r.left) / r.width * LANES))); placeBasket(); });
  document.addEventListener("keydown", function (e) { if (!C || C.over || views.ac.hidden) return; if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); } if (e.key === "ArrowRight") { e.preventDefault(); move(1); } });
  function acEnd() {
    if (C.over) return; stopAC(); $$(".ac-item").forEach(function (x) { x.remove(); }); $(".ac-field").hidden = true;
    var e = $(".ac-end"), b = best("ac", C.score); e.hidden = false; $(".c-final", e).textContent = C.score; $(".c-best", e).hidden = !b.nb;
    $(".c-stats", e).innerHTML = "<div><b>" + C.made + "</b><span>Targets built</span></div><div><b>" + Math.max(0, C.lives) + "</b><span>Lives left</span></div><div><b>" + b.best + "</b><span>High score</span></div>";
    MA.sfx("fanfare", .5); MA.wave(views.ac); coach(views.ac, b.nb ? "New high score! Woo-hoo! 🏆" : C.lives <= 0 ? "Out of lives — catch only what you need!" : "Time’s up! Great catching!", b.nb ? "g_best" : "ac_end");
  }
  $(".c-again").addEventListener("click", startAC);

  if (/[?&]qa=1/.test(location.search)) window.__gQA = { B: function () { return B; }, P: function () { return P; }, C: function () { return C; }, judge: judge, offspring: offspring, acEnd: function () { acEnd(); } };
  paintHub();
})();
