/* Practice Hub — question engine, progress, revision flags, recaps, mascot cheers */
(function () {
  "use strict";
  var KEY = "her-b10-hub";
  var S = {};
  try { S = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { S = {}; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function st(id) { return S[id] || (S[id] = {}); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function norm(x) { return String(x || "").toLowerCase().replace(/[₂]/g, "2").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim(); }

  var QS = $$(".pq");
  var streak = 0;

  /* ---------- toasts with Helix ---------- */
  var toast = document.createElement("div"); toast.className = "toast"; toast.setAttribute("role", "status");
  toast.innerHTML = '<div class="toast-m"></div><p></p>'; document.body.appendChild(toast);
  var mini = $("#miko-mini"); if (mini) toast.firstChild.innerHTML = mini.innerHTML;
  var tt;
  var MA = window.MikoAudio || { say: function () { return Promise.resolve(false); }, sfx: function () {}, once: function () {} };
  function cheer(msg, voiceId) {
    if (Array.isArray(msg)) { voiceId = msg[1]; msg = msg[0]; }
    toast.querySelector("p").innerHTML = msg; toast.classList.add("show");
    if (voiceId) MA.say(voiceId, { mascots: toast.querySelectorAll(".mascot") });
    clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove("show"); }, 3200);
  }
  var RIGHT = [["Nailed it! 🎯","right1"], ["Yes! Your concept is crystal clear.","right2"], ["Brilliant — keep that streak alive!","right3"], ["Spot on! That’s a dominant answer! 🥇","right4"]];
  var WRONG = [["Oops! Read the reason — that’s how concepts stick.","wrong1"], ["Not quite. Tap “Mark for revision” to save it.","wrong2"], ["Mistakes are how scientists learn. Check the explanation!","wrong3"]];
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  /* ---------- result ---------- */
  function setResult(q, ok, silent) {
    var s = st(q.dataset.id); s.st = ok ? "right" : "wrong";
    q.classList.remove("right", "wrong"); q.classList.add("done", ok ? "right" : "wrong");
    var badge = $(".result", q); if (badge) badge.textContent = ok ? "✓ Correct" : "✗ Needs work";
    if (!silent) {
      save();
      MA.sfx(ok ? "correct" : "wrong", ok ? .5 : .45);
      if (ok) { streak++; if (streak === 3 || streak === 5 || streak % 10 === 0) cheer("🔥 <b>" + streak + " in a row!</b> " + pick(RIGHT)[0], "streak"); else if (Math.random() < .35) cheer(pick(RIGHT)); }
      else { streak = 0; cheer(pick(WRONG)); var f = $(".flag", q); if (f && !st(q.dataset.id).flag) { f.classList.add("nudge"); setTimeout(function () { f.classList.remove("nudge"); }, 2400); } }
      refresh(); sectionDoneCheck(q.dataset.sec);
    }
  }

  /* ---------- MCQ / True-False ---------- */
  function initChoice(q) {
    var ans = q.dataset.ans;
    function apply(k, silent) {
      $$("button[data-k]", q).forEach(function (b) {
        b.disabled = true;
        if (b.dataset.k === ans) b.classList.add("ok");
        else if (b.dataset.k === k) b.classList.add("bad");
      });
      setResult(q, k === ans, silent);
    }
    $$("button[data-k]", q).forEach(function (b) {
      b.addEventListener("click", function () { if (q.classList.contains("done")) return; st(q.dataset.id).v = b.dataset.k; apply(b.dataset.k); });
    });
    var s = S[q.dataset.id]; if (s && s.v) apply(s.v, true);
  }

  /* ---------- Fill in the blanks ---------- */
  function initFib(q) {
    var ins = $$("input.fb", q), any = q.dataset.anyorder === "1";
    var keys = ins.map(function (i) { return JSON.parse(i.dataset.a); });
    ins.forEach(function (i) { i.addEventListener("keydown", function (e) { if (e.key === "Enter") check(); }); });
    function check(silent) {
      if (q.classList.contains("done")) return;
      var vals = ins.map(function (i) { return norm(i.value); });
      if (!silent && vals.every(function (v) { return !v; })) { ins[0].focus(); return; }
      var used = [], allOk = true;
      ins.forEach(function (inp, idx) {
        var v = vals[idx], hit = -1;
        if (any) { keys.forEach(function (k, j) { if (hit < 0 && used.indexOf(j) < 0 && k.map(norm).indexOf(v) > -1) hit = j; }); }
        else if (keys[idx].map(norm).indexOf(v) > -1) hit = idx;
        if (hit > -1) { used.push(hit); inp.classList.add("ok"); }
        else { allOk = false; inp.classList.add("bad"); }
        inp.disabled = true;
      });
      // show the correct answers for wrong blanks
      if (!allOk) {
        var rest = keys.map(function (k, j) { return j; }).filter(function (j) { return used.indexOf(j) < 0; });
        ins.forEach(function (inp, idx) {
          if (inp.classList.contains("bad")) {
            var j = any ? rest.shift() : idx;
            var h = document.createElement("span"); h.className = "fix-word"; h.textContent = keys[j][0];
            inp.insertAdjacentElement("afterend", h);
          }
        });
      }
      st(q.dataset.id).v = ins.map(function (i) { return i.value; });
      var b = $(".check-btn", q); if (b) b.disabled = true;
      setResult(q, allOk, silent);
    }
    $(".check-btn", q).addEventListener("click", function () { check(false); });
    var s = S[q.dataset.id];
    if (s && s.v) { ins.forEach(function (i, k) { i.value = s.v[k] || ""; }); check(true); }
  }

  /* ---------- Match the columns ---------- */
  function initMatch(q) {
    var sels = $$("select", q), ans = JSON.parse(q.dataset.ans);
    function check(silent) {
      if (!silent && sels.some(function (s) { return !s.value; })) { cheer("Pick a match for every row first 🙂"); return; }
      var ok = true;
      sels.forEach(function (s, i) {
        s.disabled = true;
        if (s.value === ans[i]) s.closest("tr").classList.add("ok");
        else { ok = false; s.closest("tr").classList.add("bad"); $(".fix-word", s.closest("tr")).textContent = "→ " + ans[i]; }
      });
      st(q.dataset.id).v = sels.map(function (s) { return s.value; });
      $(".check-btn", q).disabled = true;
      setResult(q, ok, silent);
    }
    $(".check-btn", q).addEventListener("click", function () { check(false); });
    var s = S[q.dataset.id];
    if (s && s.v) { sels.forEach(function (x, i) { x.value = s.v[i] || ""; }); check(true); }
  }

  /* ---------- Sort into groups ---------- */
  function initSort(q) {
    var ans = JSON.parse(q.dataset.ans), sel = null, tray = $(".tray", q);
    function chip(name) { return $('.chip-s[data-c="' + name + '"]', q); }
    $$(".chip-s", q).forEach(function (c) {
      c.addEventListener("click", function (e) {
        e.stopPropagation(); if (q.classList.contains("done")) return;
        var home = c.closest(".bucket");
        if (sel && sel !== c && home) { $(".drop", home).appendChild(sel); sel.classList.remove("sel"); sel = null; return; }
        if (sel) sel.classList.remove("sel");
        sel = sel === c ? null : c; if (sel) sel.classList.add("sel");
      });
    });
    $$(".bucket", q).forEach(function (b) {
      b.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); b.click(); } });
      b.addEventListener("click", function () {
        if (!sel || q.classList.contains("done")) return;
        $(".drop", b).appendChild(sel); sel.classList.remove("sel"); sel = null;
      });
    });
    tray.addEventListener("click", function () { if (sel) { tray.appendChild(sel); sel.classList.remove("sel"); sel = null; } });
    function check(silent) {
      if (!silent && $$(".chip-s", tray).length) { cheer("Place every part in a group first 🙂"); return; }
      var ok = true, v = {};
      $$(".bucket", q).forEach(function (b) {
        $$(".chip-s", b).forEach(function (c) {
          v[c.dataset.c] = b.dataset.g;
          if (ans[c.dataset.c] === b.dataset.g) c.classList.add("ok"); else { ok = false; c.classList.add("bad"); }
        });
      });
      st(q.dataset.id).v = v; $(".check-btn", q).disabled = true;
      setResult(q, ok, silent);
    }
    $(".check-btn", q).addEventListener("click", function () { check(false); });
    var s = S[q.dataset.id];
    if (s && s.v) { Object.keys(s.v).forEach(function (k) { var c = chip(k), b = $('.bucket[data-g="' + s.v[k] + '"] .drop', q); if (c && b) b.appendChild(c); }); check(true); }
  }

  /* ---------- Written (model answer + self rating) ---------- */
  function initWritten(q) {
    var ta = $("textarea", q), s = S[q.dataset.id] || {};
    if (s.txt) ta.value = s.txt;
    var t; ta.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { st(q.dataset.id).txt = ta.value; save(); }, 400); });
    var show = $(".show-model", q);
    function reveal() { q.classList.add("revealed"); show.hidden = true; }
    show.addEventListener("click", reveal);
    $$(".self button", q).forEach(function (b) {
      b.addEventListener("click", function () {
        if (q.classList.contains("done")) return;
        st(q.dataset.id).v = b.dataset.self;
        $$(".self button", q).forEach(function (x) { x.disabled = true; x.classList.toggle("picked", x === b); });
        setResult(q, b.dataset.self === "got");
      });
    });
    if (s.v) { reveal(); $$(".self button", q).forEach(function (x) { x.disabled = true; x.classList.toggle("picked", x.dataset.self === s.v); }); setResult(q, s.v === "got", true); }
  }

  /* ---------- flags ---------- */
  function initFlag(q) {
    var f = $(".flag", q);
    function paint() { var on = !!(S[q.dataset.id] && S[q.dataset.id].flag); f.classList.toggle("on", on); f.setAttribute("aria-pressed", on); f.textContent = on ? "🚩 Marked for revision" : "🏳 Mark for revision"; }
    f.addEventListener("click", function () { var s = st(q.dataset.id); s.flag = !s.flag; save(); paint(); refresh(); if (s.flag) { MA.sfx("flag", .5); cheer("Saved to <b>My Revision List</b> 📌", "flag"); } else MA.sfx("pop", .4); });
    paint();
  }

  QS.forEach(function (q) {
    var t = q.dataset.type;
    if (t === "mcq" || t === "tf") initChoice(q);
    else if (t === "fib") initFib(q);
    else if (t === "match") initMatch(q);
    else if (t === "sort") initSort(q);
    else if (t === "written") initWritten(q);
    initFlag(q);
  });

  /* ---------- dashboard / recaps ---------- */
  function stats(sec) {
    var list = QS.filter(function (q) { return !sec || q.dataset.sec === sec; });
    var r = { total: list.length, done: 0, right: 0, flag: 0, wrongTuts: {} , flagged: [] };
    list.forEach(function (q) {
      var s = S[q.dataset.id] || {};
      if (s.st) { r.done++; if (s.st === "right") r.right++; else r.wrongTuts[q.dataset.tut] = 1; }
      if (s.flag) { r.flag++; r.flagged.push(q); }
    });
    return r;
  }
  function pct(a, b) { return b ? Math.round(a * 100 / b) : 0; }
  var C = 2 * Math.PI * 52;
  function ring(el, p) { var c = $(".ring-fg", el); if (c) { c.style.strokeDashoffset = C * (1 - p / 100); c.style.opacity = p ? 1 : 0; } var t = $(".ring-t", el); if (t) t.textContent = p + "%"; }

  function jumpTo(q) {
    show(q.dataset.sec, true);
    setTimeout(function () { q.scrollIntoView({ behavior: "smooth", block: "center" }); q.classList.add("pulse"); setTimeout(function () { q.classList.remove("pulse"); }, 1600); }, 60);
  }
  function flagLink(q) {
    var a = document.createElement("a"); a.href = "#" + q.id;
    a.innerHTML = "<b>" + q.dataset.src + "</b> " + $(".stem", q).textContent.slice(0, 90) + "…";
    a.addEventListener("click", function (e) { e.preventDefault(); drawer.classList.remove("open"); jumpTo(q); });
    return a;
  }

  var drawer = $(".drawer");
  function refresh() {
    var all = stats();
    ring($(".dash-ring"), pct(all.done, all.total));
    $("#d-done").textContent = all.done + " / " + all.total;
    $("#d-right").textContent = all.right;
    $("#d-acc").textContent = all.done ? pct(all.right, all.done) + "%" : "–";
    $("#d-flag").textContent = all.flag;
    $$(".fab-count").forEach(function (x) { x.textContent = all.flag; });
    $$(".secpill").forEach(function (p) {
      var r = stats(p.dataset.go); $(".bar i", p).style.width = pct(r.done, r.total) + "%";
      $(".cnt", p).textContent = r.done + "/" + r.total; p.classList.toggle("complete", r.done === r.total);
    });
    // drawer
    var list = $(".drawer-list"); list.innerHTML = "";
    if (!all.flagged.length) list.innerHTML = '<p class="hint">Nothing flagged yet. Tap “🏳 Mark for revision” on any question you want to come back to.</p>';
    all.flagged.forEach(function (q) { list.appendChild(flagLink(q)); });
    // recaps
    $$(".recap").forEach(function (rc) {
      var sec = rc.dataset.recap, secs = (rc.dataset.cover || sec).split(" ");
      var r = { total: 0, done: 0, right: 0, flag: 0, wrongTuts: {}, flagged: [] };
      secs.forEach(function (s) { var x = stats(s); r.total += x.total; r.done += x.done; r.right += x.right; r.flag += x.flag; r.flagged = r.flagged.concat(x.flagged); Object.keys(x.wrongTuts).forEach(function (k) { r.wrongTuts[k] = 1; }); });
      $(".r-done", rc).textContent = r.done + "/" + r.total;
      $(".r-right", rc).textContent = r.right;
      $(".r-acc", rc).textContent = r.done ? pct(r.right, r.done) + "%" : "–";
      $(".r-flag", rc).textContent = r.flag;
      $(".r-overall i", rc).style.width = pct(all.done, all.total) + "%";
      $(".r-overall-t", rc).textContent = "Whole chapter: " + all.done + " of " + all.total + " questions done (" + pct(all.done, all.total) + "%)";
      var acc = r.done ? r.right / r.done : 0, msg;
      if (r.done < r.total) msg = "You’ve answered " + r.done + " of " + r.total + " here. Finish the rest to unlock your full recap — you’re close!";
      else if (acc >= .9) msg = "Outstanding! " + pct(r.right, r.done) + "% — you’ve truly mastered this set. On to the next one, champion! 🏆";
      else if (acc >= .7) msg = "Great work! " + pct(r.right, r.done) + "% correct. Revisit your flagged questions once and you’ll be unstoppable. 💪";
      else if (acc >= .5) msg = "Good effort! You’re building strong foundations. Read the recap below and retry the ones you missed. 🌱";
      else msg = "Every expert was once a beginner. Revise the tutorials linked below, then come back — I’ll be right here cheering! 🦠💚";
      $(".r-msg", rc).textContent = msg;
      var tl = $(".r-tuts", rc), tuts = Object.keys(r.wrongTuts).sort();
      tl.innerHTML = tuts.length ? "Revisit: " + tuts.map(function (n) { return '<a href="tutorial-' + n + '.html">Tutorial ' + n + "</a>"; }).join(" · ") : "";
      var fl = $(".r-flags", rc); fl.innerHTML = "";
      r.flagged.forEach(function (q) { fl.appendChild(flagLink(q)); });
    });
  }
  var announced = {};
  function sectionDoneCheck(sec) {
    var r = stats(sec);
    if (r.done === r.total && !announced[sec]) { announced[sec] = 1; setTimeout(function () { MA.sfx("fanfare", .55); cheer("🎉 <b>Section complete!</b> Scroll down for your recap.", "section_done"); }, 900); }
  }

  /* ---------- section paging ---------- */
  var labels = {};
  $$(".secpill").forEach(function (p) { labels[p.dataset.go] = p.dataset.label; p.addEventListener("click", function () { show(p.dataset.go); }); });
  $$("[data-next]").forEach(function (b) { b.addEventListener("click", function () { show(b.dataset.next); }); });
  function show(sec, noScroll) {
    if (!labels[sec]) sec = Object.keys(labels)[0];
    $$(".sec").forEach(function (s) { s.hidden = s.dataset.sec !== sec; });
    $$(".secpill").forEach(function (p) { p.classList.toggle("on", p.dataset.go === sec); p.setAttribute("aria-selected", p.dataset.go === sec); });
    if (window.ILWNote) window.ILWNote.setKey("hub-" + sec, "Practice Hub · " + labels[sec]);
    try { history.replaceState(null, "", "#" + sec); } catch (e) {}
    if (!noScroll) { MA.sfx("whoosh", .35); var top = $(".secnav").getBoundingClientRect().top + window.scrollY - 70; window.scrollTo({ top: top, behavior: "smooth" }); }
  }

  /* ---------- drawer + reset ---------- */
  $$(".open-drawer").forEach(function (b) { b.addEventListener("click", function () { drawer.classList.add("open"); }); });
  $(".drawer .close").addEventListener("click", function () { drawer.classList.remove("open"); });
  var rb = $(".reset"), armed = false;
  rb.addEventListener("click", function () {
    if (!armed) { armed = true; rb.textContent = "Tap again to erase all answers"; setTimeout(function () { armed = false; rb.textContent = "↺ Reset practice"; }, 3500); return; }
    S = {}; save(); location.reload();
  });

  /* Helix speaks recaps and mid-section cheers when they scroll into view */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        if (el.classList.contains("cheer-card")) { if (MA.isOn && MA.isOn()) { MA.once(el.dataset.voice, { el: el }); if (MA.wave) MA.wave(el); } io.unobserve(el); return; }
        var secs = (el.dataset.cover || el.dataset.recap).split(" "), d = 0, t = 0, r = 0;
        secs.forEach(function (x) { var k = stats(x); d += k.done; t += k.total; r += k.right; });
        if (d < t) return;
        var acc = r / d, band = acc >= .9 ? "recap_top" : acc >= .7 ? "recap_good" : acc >= .5 ? "recap_ok" : "recap_low";
        MA.say(band, { el: el }); if (MA.wave) MA.wave(el); io.unobserve(el);
      });
    }, { threshold: .55 });
    $$(".cheer-card, .recap").forEach(function (el) { io.observe(el); });
  }

  var h = (location.hash || "").slice(1);
  show(labels[h] ? h : Object.keys(labels)[0], true);
  refresh();
})();
