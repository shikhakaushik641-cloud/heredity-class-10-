/* The Invisible Living World — shared interactions */
(function () {
  "use strict";
  var KEY = "her-b10-done";
  function getDone() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; } }
  function setDone(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} }

  /* ---- difficult-word tooltips (click still opens Google) ---- */
  var tip = document.createElement("div");
  tip.className = "tip"; tip.setAttribute("role", "tooltip");
  document.body.appendChild(tip);
  function showTip(el) {
    tip.innerHTML = "<b></b><span></span><small>Click to see it on Google ↗</small>";
    tip.querySelector("b").textContent = el.dataset.word || el.textContent;
    tip.querySelector("span").textContent = el.dataset.def || "";
    var r = el.getBoundingClientRect();
    tip.classList.add("show");
    var tw = tip.offsetWidth, th = tip.offsetHeight;
    var left = Math.min(Math.max(8, r.left + r.width / 2 - tw / 2), window.innerWidth - tw - 8);
    var top = r.top - th - 10; if (top < 70) top = r.bottom + 10;
    tip.style.left = left + "px"; tip.style.top = top + "px";
  }
  function hideTip() { tip.classList.remove("show"); }
  document.querySelectorAll(".w").forEach(function (el) {
    el.addEventListener("mouseenter", function () { showTip(el); });
    el.addEventListener("focus", function () { showTip(el); });
    el.addEventListener("mouseleave", hideTip);
    el.addEventListener("blur", hideTip);
  });
  window.addEventListener("scroll", hideTip, { passive: true });

  /* ---- reading progress ---- */
  var bar = document.querySelector(".progress");
  if (bar) {
    var upd = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
    };
    window.addEventListener("scroll", upd, { passive: true }); upd();
  }

  /* ---- activity steps: tap to tick ---- */
  document.querySelectorAll(".steps li").forEach(function (li) {
    li.setAttribute("tabindex", "0");
    var t = function () { li.classList.toggle("tick"); };
    li.addEventListener("click", t);
    li.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); t(); } });
  });

  /* ---- figure lightbox ---- */
  var lb = document.createElement("div"); lb.className = "lightbox"; lb.innerHTML = "<img alt=''>";
  document.body.appendChild(lb);
  lb.addEventListener("click", function () { lb.classList.remove("show"); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") lb.classList.remove("show"); });
  document.querySelectorAll(".fig .pane").forEach(function (p) {
    p.addEventListener("click", function () {
      var img = p.querySelector("img"); lb.firstChild.src = img.src; lb.firstChild.alt = img.alt; lb.classList.add("show");
    });
  });

  /* ---- quick check ---- */
  document.querySelectorAll(".check").forEach(function (box) {
    var qs = box.querySelectorAll(".q"), total = 0, right = 0, done = 0;
    var score = box.querySelector(".score");
    function paint() { if (score) score.textContent = "Score: " + right + " / " + total + (done === total ? "  — all done!" : ""); }
    qs.forEach(function (q) {
      if (q.classList.contains("fill")) {
        total++;
        var b = q.querySelector(".reveal-btn");
        b.addEventListener("click", function () {
          if (window.MikoAudio) window.MikoAudio.sfx("pop", .4);
          q.querySelectorAll(".blank").forEach(function (s) { s.textContent = s.dataset.a; });
          if (!q.classList.contains("answered")) { q.classList.add("answered"); done++; right++; paint(); }
          b.disabled = true;
        });
        return;
      }
      total++;
      var ans = q.dataset.ans;
      q.querySelectorAll("button[data-k]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (q.classList.contains("answered")) return;
          q.classList.add("answered"); done++;
          var MA = window.MikoAudio;
          if (btn.dataset.k === ans) { btn.classList.add("right"); right++; if (MA) { MA.sfx("correct", .5); if (Math.random() < .5) setTimeout(function () { MA.say("right" + (1 + Math.floor(Math.random() * 4))); }, 350); } }
          else { btn.classList.add("wrong"); var c = q.querySelector('button[data-k="' + ans + '"]'); if (c) c.classList.add("right"); if (MA) { MA.sfx("wrong", .45); setTimeout(function () { MA.say(Math.random() < .5 ? "wrong1" : "wrong3"); }, 350); } }
          paint();
        });
      });
    });
    paint();
  });

  /* ---- completion ---- */
  var page = document.body.dataset.tut;
  var list = getDone();
  document.querySelectorAll(".tabs a[data-t]").forEach(function (a) { if (list.indexOf(a.dataset.t) > -1) a.classList.add("done"); });
  document.querySelectorAll("[data-stop]").forEach(function (s) {
    if (list.indexOf(s.dataset.stop) > -1) { var c = s.querySelector(".donechip"); if (c) c.hidden = false; }
  });
  var db = document.querySelector(".done-btn");
  if (db && page) {
    var paintBtn = function () {
      var on = getDone().indexOf(page) > -1;
      db.classList.toggle("is-done", on); db.textContent = on ? "✓ Tutorial completed" : "Mark this tutorial complete";
    };
    db.addEventListener("click", function () {
      var l = getDone(), i = l.indexOf(page);
      if (i > -1) l.splice(i, 1); else l.push(page);
      setDone(l); paintBtn();
      if (i < 0 && window.MikoAudio) { window.MikoAudio.sfx("fanfare", .55); setTimeout(function () { window.MikoAudio.say("tut_done", { el: document.querySelector(".t-head") }); window.MikoAudio.wave(document.querySelector(".t-head")); }, 500); }
      var tab = document.querySelector('.tabs a[data-t="' + page + '"]'); if (tab) tab.classList.toggle("done", i < 0);
    });
    paintBtn();
  }

  /* ---- typewriter greeting ---- */
  var tw = document.querySelector("[data-typewriter]");
  if (tw) {
    var html = tw.innerHTML, out = "", i = 0, inTag = false;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      tw.innerHTML = "<span class='caret'></span>";
      (function step() {
        if (i >= html.length) { tw.innerHTML = html; return; }
        var ch = html[i++]; out += ch;
        if (ch === "<") inTag = true; if (ch === ">") inTag = false;
        if (inTag) return step();
        tw.innerHTML = out + "<span class='caret'></span>";
        setTimeout(step, ch === "." || ch === "!" ? 220 : 18);
      })();
    }
  }
})();

/* ---- Sticky note: one note per page (and per Practice Hub section) ---- */
(function () {
  "use strict";
  var PREFIX = "her-b10-note:";
  var fab = document.createElement("button");
  fab.type = "button"; fab.className = "note-fab"; fab.setAttribute("aria-label", "Open my sticky note");
  fab.innerHTML = "📝<span>My Notes</span>";
  var pad = document.createElement("aside");
  pad.className = "sticky"; pad.setAttribute("aria-label", "Sticky note");
  pad.innerHTML = '<div class="sticky-h"><b>📌 Important concepts</b><button type="button" class="sticky-x" aria-label="Close note">✕</button></div>' +
    '<div class="sticky-for"></div><textarea placeholder="Write the key ideas you want to remember from this page…"></textarea><div class="sticky-s">Saved on this device</div>';
  document.body.appendChild(fab); document.body.appendChild(pad);
  var ta = pad.querySelector("textarea"), forEl = pad.querySelector(".sticky-for"), stat = pad.querySelector(".sticky-s");
  var key = document.body.dataset.note || (location.pathname.split("/").pop() || "index.html");
  var label = document.body.dataset.noteLabel || document.title.split(" — ")[0];
  function load() {
    var v = ""; try { v = localStorage.getItem(PREFIX + key) || ""; } catch (e) {}
    ta.value = v; forEl.textContent = "For: " + label; fab.classList.toggle("has", !!v.trim());
  }
  var t;
  ta.addEventListener("input", function () {
    stat.textContent = "Saving…"; clearTimeout(t);
    t = setTimeout(function () {
      try { localStorage.setItem(PREFIX + key, ta.value); stat.textContent = "Saved on this device ✓"; }
      catch (e) { stat.textContent = "Couldn’t save in this browser"; }
      fab.classList.toggle("has", !!ta.value.trim());
    }, 350);
  });
  fab.addEventListener("click", function () { pad.classList.toggle("open"); if (pad.classList.contains("open")) ta.focus(); });
  pad.querySelector(".sticky-x").addEventListener("click", function () { pad.classList.remove("open"); });
  window.ILWNote = { setKey: function (k, l) { key = k; label = l; load(); } };
  load();
})();

/* ---- Roadmap: Practice Hub progress meter ---- */
(function () {
  var m = document.querySelector("[data-hub-meter]"); if (!m) return;
  var S = {}; try { S = JSON.parse(localStorage.getItem("her-b10-hub") || "{}") || {}; } catch (e) {}
  var total = +m.dataset.total, done = 0, right = 0;
  Object.keys(S).forEach(function (k) { if (S[k] && S[k].st) { done++; if (S[k].st === "right") right++; } });
  m.firstChild.style.width = Math.round(done * 100 / total) + "%";
  var t = document.querySelector(".hub-meter-t");
  if (t && done) t.textContent = done + " of " + total + " questions done · " + right + " correct";
})();

/* ---- Roadmap: Assessment best scores ---- */
(function () {
  var els = document.querySelectorAll("[data-best]"); if (!els.length) return;
  var S = {}; try { S = JSON.parse(localStorage.getItem("her-b10-assess") || "{}") || {}; } catch (e) {}
  els.forEach(function (b) { var r = S[b.dataset.best]; if (r) b.textContent = r.best + "/20 (" + r.attempts + (r.attempts > 1 ? " attempts)" : " attempt)"); });
})();

/* ---- Animated figures: pause/play + labels ---- */
(function () {
  document.querySelectorAll(".anim-fig").forEach(function (f) {
    var b = f.querySelector(".anim-play"), l = f.querySelector(".anim-lbl");
    if (b) b.addEventListener("click", function () {
      var p = f.classList.toggle("paused"); b.textContent = p ? "▶ Play" : "⏸ Pause"; b.setAttribute("aria-pressed", p);
    });
    if (l) l.addEventListener("change", function () { f.classList.toggle("no-labels", !l.checked); });
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches && b) { f.classList.add("paused"); b.textContent = "▶ Play"; }
  });
})();

/* ---- Fig 2.1: water-flask magnifier (JS driven) ---- */
(function () {
  var f = document.querySelector('[data-driver="flask"]'); if (!f) return;
  var flask = f.querySelector(".fl-flask"), clip = f.querySelector(".fl-c"), mag = f.querySelector(".fl-mag");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var t = 0, last = null;
  function draw() {
    var cx = 200 + 128 * Math.sin(t * 2 * Math.PI / 10), cy = 124 + 52 * Math.sin(t * 2 * Math.PI / 6.5);
    flask.setAttribute("transform", "translate(" + cx.toFixed(1) + " " + cy.toFixed(1) + ")");
    clip.setAttribute("cx", cx.toFixed(1)); clip.setAttribute("cy", cy.toFixed(1));
    mag.setAttribute("transform", "translate(" + cx.toFixed(1) + " " + cy.toFixed(1) + ") scale(1.9) translate(" + (-cx).toFixed(1) + " " + (-cy).toFixed(1) + ")");
  }
  function loop(ts) {
    if (last != null && !f.classList.contains("paused")) t += (ts - last) / 1000;
    last = ts; draw(); requestAnimationFrame(loop);
  }
  draw(); if (!reduce) requestAnimationFrame(loop);
})();

/* ---- Virtual Lab progress on the roadmap ---- */
(function () {
  var m = document.querySelector("[data-lab-meter]"); if (!m) return;
  var S = {}; try { S = JSON.parse(localStorage.getItem("her-b10-lab") || "{}") || {}; } catch (e) {}
  var n = ["traits", "punnett", "testcross", "dihybrid", "gametes", "sexdet"].filter(function (k) { return S[k]; }).length;
  m.querySelector("i").style.width = (n / 6 * 100) + "%";
  var t = document.querySelector(".lab-meter-idx"); if (t && n) t.textContent = n + " of 6 experiments done";
})();
