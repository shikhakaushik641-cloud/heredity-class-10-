/* Flashcards & Mind Map */
(function () {
  "use strict";
  var D = JSON.parse(document.getElementById("rev-data").textContent);
  var KEY = "her-b10-fc";
  var MA = window.MikoAudio || { say: function () { return Promise.resolve(false); }, sfx: function () {} };
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; } }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* tabs */
  $$(".rv-tabs button").forEach(function (b) {
    b.addEventListener("click", function () {
      $$(".rv-tabs button").forEach(function (x) { x.classList.toggle("on", x === b); x.setAttribute("aria-selected", x === b); });
      ["fc", "mm", "nt"].forEach(function (k) { $("#rv-" + k).hidden = b.dataset.tab !== k; }); document.body.classList.toggle("notes-on", b.dataset.tab === "nt"); MA.sfx("pop", .3);
    });
  });

  /* ---------- flashcards ---------- */
  var S = load(); S.known = S.known || {};
  var deck = "all", only = false, list = [], i = 0, card = $(".fc-card"), seenAll = false;
  function build() {
    list = D.cards.filter(function (c) { return (deck === "all" || String(c.t) === deck) && (!only || !S.known[c.k]); });
    if (i >= list.length) i = 0; show();
  }
  function show() {
    card.classList.remove("flip");
    var tot = D.cards.filter(function (c) { return deck === "all" || String(c.t) === deck; }), kn = tot.filter(function (c) { return S.known[c.k]; }).length;
    $(".fc-meter i").style.width = (tot.length ? kn / tot.length * 100 : 0) + "%";
    $(".fc-meter-t").textContent = kn + " of " + tot.length + " cards marked “I know it”" + (kn === tot.length && tot.length ? " — deck mastered! 🏆" : "");
    if (!list.length) { $(".fc-term").textContent = "🎉 Nothing left to learn here!"; $(".fc-def").textContent = "Untick “Only still learning” to see every card."; $$(".fc-tag").forEach(function (t) { t.textContent = ""; }); $(".fc-pos").textContent = "0 / 0"; return; }
    var c = list[i];
    $(".fc-term").textContent = cap(c.k); $(".fc-def").textContent = c.d;
    $$(".fc-tag").forEach(function (t) { t.textContent = "Tutorial " + c.t + (S.known[c.k] ? " · ✓ known" : ""); });
    $(".fc-pos").textContent = (i + 1) + " / " + list.length;
    card.setAttribute("aria-label", "Flashcard: " + c.k + ". Press to flip.");
  }
  function flip() { card.classList.toggle("flip"); MA.sfx("whoosh", .2); }
  function move(d) {
    if (!list.length) return; i = (i + d + list.length) % list.length;
    if (d > 0 && i === 0 && !seenAll) { seenAll = true; MA.say("fc_done", { mascots: $$(".mascot") }); }
    show();
  }
  function mark(k) {
    if (!list.length) return; var c = list[i];
    if (k) S.known[c.k] = 1; else delete S.known[c.k]; save(S); MA.sfx(k ? "correct" : "flag", .3);
    if (only && k) { build(); return; }
    move(1);
  }
  card.addEventListener("click", flip);
  $(".fc-next").addEventListener("click", function () { move(1); });
  $(".fc-prev").addEventListener("click", function () { move(-1); });
  $(".fc-know").addEventListener("click", function () { mark(true); });
  $(".fc-learn").addEventListener("click", function () { mark(false); });
  $(".fc-shuffle").addEventListener("click", function () { for (var a = list.length - 1; a > 0; a--) { var j = Math.floor(Math.random() * (a + 1)), t = list[a]; list[a] = list[j]; list[j] = t; } i = 0; show(); MA.sfx("whoosh", .3); });
  $(".fc-learning").addEventListener("change", function () { only = this.checked; i = 0; build(); });
  $$(".fc-deck button").forEach(function (b) { b.addEventListener("click", function () { $$(".fc-deck button").forEach(function (x) { x.classList.toggle("on", x === b); }); deck = b.dataset.deck; i = 0; build(); }); });
  document.addEventListener("keydown", function (e) {
    if ($("#rv-fc").hidden || /input|textarea/i.test(e.target.tagName)) return;
    if (e.key === " ") { e.preventDefault(); flip(); } else if (e.key === "ArrowRight") move(1); else if (e.key === "ArrowLeft") move(-1);
    else if (e.key === "k" || e.key === "K") mark(true); else if (e.key === "l" || e.key === "L") mark(false);
  });
  build();

  /* ---------- handwritten notes ---------- */
  $$(".nt-pick button").forEach(function (b) {
    b.addEventListener("click", function () {
      $$(".nt-pick button").forEach(function (x) { x.classList.toggle("on", x === b); });
      $$(".nt-page").forEach(function (pg) { pg.classList.toggle("cur", b.dataset.nt === "all" || pg.dataset.nt === b.dataset.nt); });
      MA.sfx("whoosh", .25); var bk = $(".nt-book"); if (bk.getBoundingClientRect().top < 0) bk.scrollIntoView({ behavior: "smooth" });
    });
  });
  $(".nt-print").addEventListener("click", function () { window.print(); });

  /* ---------- mind map ---------- */
  var info = $(".mm-info"), wrap = $(".mm-wrap");
  function br(id) { return D.map.filter(function (b) { return b.id === id; })[0]; }
  function sel(el) { $$(".mm-svg .sel").forEach(function (x) { x.classList.remove("sel"); }); el.classList.add("sel"); }
  $$(".mm-leaf").forEach(function (g) {
    function go() {
      var b = br(g.dataset.b), kid = b.kids[+g.dataset.i]; g.classList.add("shown"); sel(g); MA.sfx("pop", .3);
      info.style.setProperty("--mc", b.c);
      info.innerHTML = "<b>" + kid[0] + "</b> — " + kid[1] + ' <a class="revlink" href="tutorial-' + b.tut + '.html">📖 Tutorial ' + b.tut + "</a>";
    }
    g.addEventListener("click", go); g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });
  $$(".mm-branch").forEach(function (g) {
    function go() {
      var b = br(g.dataset.b); sel(g); MA.sfx("pop", .3); info.style.setProperty("--mc", b.c);
      info.innerHTML = "<b>" + b.t + "</b> (Tutorial " + b.tut + "): " + b.kids.map(function (k) { return k[0]; }).join(" · ") + ' <a class="revlink" href="tutorial-' + b.tut + '.html">📖 Open Tutorial ' + b.tut + "</a>";
    }
    g.addEventListener("click", go); g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });
  $(".mm-test").addEventListener("change", function () { wrap.classList.toggle("test", this.checked); $$(".mm-leaf").forEach(function (g) { g.classList.remove("shown"); }); });
})();
