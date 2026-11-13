/* Assessment Hub — timed tests (60 s / question), Helix time-coach, detailed results */
(function () {
  "use strict";
  var DATA = JSON.parse(document.getElementById("assess-data").textContent);
  var KEY = "her-b10-assess", TICKKEY = "ilw-tick";
  var PER_Q = 60;
  var MA = window.MikoAudio || { say: function (i, o) { if (o && o.onend) o.onend(false); return Promise.resolve(false); }, sfx: function () {}, wave: function () {}, stop: function () {}, isOn: function () { return false; } };
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; } }
  function store(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  var tickOn = (function () { try { return localStorage.getItem(TICKKEY) !== "off"; } catch (e) { return true; } })();
  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function fmt(sec) { sec = Math.round(sec); var m = Math.floor(sec / 60), s = sec % 60; return m ? m + "m " + (s < 10 ? "0" : "") + s + "s" : s + "s"; }

  var LINES = {
    a_start1: "Level 1! Ready, set, go! Read carefully and trust what you’ve learned.",
    a_start2: "Level 2, the challenge round! Take a deep breath — you’ve totally got this!",
    a_fast1: "Wow, super speedy! ⚡", a_fast2: "Quick thinking! 🧠", a_fast3: "Great pace! Keep it up!",
    a_half: "30 seconds left. Plenty of time — stay calm!", a_hurry: "10 seconds! Pick your best answer!",
    a_timeup: "Time’s up! No worries — let’s keep moving.", a_q5: "5 down, 15 to go. You’re doing great!",
    a_q10: "Halfway there! Keep up the pace!", a_q15: "Only 5 questions left. Finish strong!",
    a_last: "Last question! Give it your very best!", a_done: "Test complete! Let’s see how you did."
  };
  var hubV = $("#v-hub"), testV = $("#v-test"), resV = $("#v-result");
  var L, i, ans, timer, qStart, lastSec, cheeredThisQ;
  var bubble = $(".coach-bubble"), coachM = $$(".coach .mascot");

  function coach(id, opts) {
    opts = opts || {};
    if (LINES[id]) { bubble.textContent = LINES[id]; bubble.classList.remove("pop"); void bubble.offsetWidth; bubble.classList.add("pop"); }
    if (opts.voice !== false) MA.say(id, { mascots: coachM });
    if (opts.wave) MA.wave($(".coach"));
  }

  /* ---------- hub ---------- */
  function paintHub() {
    var S = load();
    DATA.levels.forEach(function (lv) {
      var c = $('.lvl-card[data-level="' + lv.id + '"]'), r = S[lv.id];
      if (!c) return;
      $(".best", c).textContent = r ? r.best + " / 20" : "–";
      $(".tries", c).textContent = r ? r.attempts : 0;
      $(".last", c).textContent = r && r.last ? r.last.score + " / 20 · " + new Date(r.last.at).toLocaleDateString() : "Not attempted";
      $(".lvl-meter i", c).style.width = r ? (r.best * 5) + "%" : "0";
    });
  }
  $$(".start-level").forEach(function (b) { b.addEventListener("click", function () { start(b.dataset.level); }); });

  function show(v) {
    [hubV, testV, resV].forEach(function (x) { x.hidden = x !== v; });
    document.body.classList.toggle("in-test", v === testV);
    window.scrollTo(0, 0);
  }

  /* ---------- test ---------- */
  function start(id) {
    L = DATA.levels.filter(function (x) { return x.id === id; })[0];
    i = 0; ans = L.qs.map(function () { return { sel: null, t: 0, timeout: false }; });
    show(testV);
    testV.style.setProperty("--c", L.color);
    $(".t-level").textContent = L.name + " · " + L.sub;
    var dots = $(".qdots"); dots.innerHTML = "";
    L.qs.forEach(function (q, k) { var d = document.createElement("span"); d.title = "Q" + (k + 1); dots.appendChild(d); });
    $(".qcard").innerHTML = ""; $(".t-controls").hidden = true;
    // 3-2-1 countdown
    var cd = $(".countdown"), n = 3; cd.hidden = false; cd.textContent = n;
    coach(L.start_voice, { wave: true });
    var iv = setInterval(function () {
      n--; MA.sfx("tick_urgent", .5);
      if (n > 0) { cd.textContent = n; cd.classList.remove("bump"); void cd.offsetWidth; cd.classList.add("bump"); }
      else { clearInterval(iv); cd.textContent = "Go!"; setTimeout(function () { cd.hidden = true; render(); }, 600); }
    }, 1000);
    MA.sfx("tick_urgent", .5);
  }

  function render() {
    var q = L.qs[i];
    $(".t-count").textContent = "Question " + (i + 1) + " of " + L.qs.length;
    $$(".qdots span").forEach(function (d, k) { d.className = k === i ? "now" : (k < i ? (ans[k].sel == null ? "skip" : "done") : ""); });
    var dl = { E: "Easy", M: "Medium", H: "Hard" }[q.d];
    var html = '<div class="q-meta"><span class="diff d-' + q.d + '">' + dl + '</span><span class="concept">' + esc(q.concept) + '</span><span class="src">' + esc(q.src) + "</span></div>";
    html += '<div class="q-stem">' + q.stem + "</div>";
    if (q.fig) html += '<figure class="fig"><div class="pane"><img src="' + q.fig.src + '" width="' + q.fig.w + '" height="' + q.fig.h + '" alt="' + esc(q.fig.alt) + '"></div></figure>';
    if (q.table) html += q.table;
    html += '<div class="a-opts" role="radiogroup" aria-label="Answer options">';
    q.opts.forEach(function (o, k) { html += '<button type="button" role="radio" aria-checked="false" data-k="' + k + '"><b>' + "abcd"[k] + "</b><span>" + esc(o) + "</span></button>"; });
    html += "</div>";
    var card = $(".qcard"); card.innerHTML = html; card.classList.remove("enter"); void card.offsetWidth; card.classList.add("enter");
    $$(".a-opts button", card).forEach(function (b) {
      b.addEventListener("click", function () {
        $$(".a-opts button", card).forEach(function (x) { x.classList.remove("sel"); x.setAttribute("aria-checked", "false"); });
        b.classList.add("sel"); b.setAttribute("aria-checked", "true");
        ans[i].sel = +b.dataset.k; $(".next").disabled = false; MA.sfx("pop", .35);
      });
    });
    $(".t-controls").hidden = false; $(".next").disabled = true;
    $(".next").textContent = i === L.qs.length - 1 ? "Submit test ✓" : "Save & Next →";
    cheeredThisQ = false; startTimer();
  }

  var C = 2 * Math.PI * 34;
  function startTimer() {
    clearInterval(timer); qStart = Date.now(); lastSec = PER_Q; paintTimer(PER_Q);
    timer = setInterval(function () {
      var left = PER_Q - Math.floor((Date.now() - qStart) / 1000);
      if (left === lastSec) return;
      lastSec = left; paintTimer(left);
      if (left <= 0) { clearInterval(timer); timeUp(); return; }
      if (left <= 10) MA.sfx("tick_urgent", .45); else if (tickOn) MA.sfx("tick", .22);
      if (left === 30 && ans[i].sel == null && !cheeredThisQ && Math.random() < .5) { cheeredThisQ = true; coach("a_half"); }
      if (left === 10 && ans[i].sel == null) { cheeredThisQ = true; coach("a_hurry"); }
    }, 200);
  }
  function paintTimer(left) {
    var t = $(".timer"); left = Math.max(0, left);
    $(".timer-t", t).textContent = left;
    $(".timer-fg", t).style.strokeDashoffset = C * (1 - left / PER_Q);
    t.classList.toggle("warn", left <= 30 && left > 10); t.classList.toggle("danger", left <= 10);
  }
  function timeUp() {
    ans[i].t = PER_Q; ans[i].timeout = true;
    MA.sfx("timeup", .5); coach("a_timeup", { voice: Math.random() < .6 });
    $$(".a-opts button").forEach(function (b) { b.disabled = true; });
    $(".next").disabled = true; $(".skip-btn").disabled = true;
    setTimeout(function () { $(".skip-btn").disabled = false; advance(true); }, 1300);
  }
  function advance(fromTimeout) {
    clearInterval(timer);
    if (!fromTimeout) ans[i].t = Math.min(PER_Q, (Date.now() - qStart) / 1000);
    var took = ans[i].t, answered = ans[i].sel != null;
    i++;
    if (i >= L.qs.length) return finish();
    // Helix’s time-coaching: milestones first, then speed praise
    if (i === 5) coach("a_q5", { wave: true });
    else if (i === 10) coach("a_q10", { wave: true });
    else if (i === 15) coach("a_q15", { wave: true });
    else if (i === L.qs.length - 1) coach("a_last", { wave: true });
    else if (!fromTimeout && answered && took < 15 && Math.random() < .45) coach("a_fast" + (1 + Math.floor(Math.random() * 3)));
    render();
  }
  $(".next").addEventListener("click", function () { if (ans[i].sel != null) advance(false); });
  $(".skip-btn").addEventListener("click", function () { ans[i].sel = null; advance(false); });
  var quit = $(".quit"), armed = false;
  quit.addEventListener("click", function () {
    if (!armed) { armed = true; quit.textContent = "Tap again to quit (progress lost)"; setTimeout(function () { armed = false; quit.textContent = "✕ Quit test"; }, 3500); return; }
    clearInterval(timer); MA.stop(); armed = false; quit.textContent = "✕ Quit test"; show(hubV); paintHub();
  });
  var tk = $(".tick-toggle");
  function paintTick() { tk.textContent = tickOn ? "⏱ Tick on" : "⏱ Tick off"; tk.classList.toggle("off", !tickOn); }
  tk.addEventListener("click", function () { tickOn = !tickOn; try { localStorage.setItem(TICKKEY, tickOn ? "on" : "off"); } catch (e) {} paintTick(); });
  paintTick();
  document.addEventListener("keydown", function (e) {
    if (testV.hidden || !L) return;
    var k = "abcd".indexOf(e.key.toLowerCase()); if (k < 0) k = "1234".indexOf(e.key);
    if (k > -1) { var b = $$(".a-opts button")[k]; if (b && !b.disabled) b.click(); }
    if (e.key === "Enter" && !$(".next").disabled) $(".next").click();
  });

  /* ---------- results ---------- */
  function finish() {
    clearInterval(timer);
    var R = { right: 0, wrong: 0, skip: 0, time: 0, concepts: {}, diff: { E: [0, 0], M: [0, 0], H: [0, 0] }, fastest: null };
    L.qs.forEach(function (q, k) {
      var a = ans[k], ok = a.sel === q.ans; R.time += a.t;
      if (a.sel == null) R.skip++; else if (ok) R.right++; else R.wrong++;
      var c = R.concepts[q.concept] || (R.concepts[q.concept] = { r: 0, n: 0, tut: q.tut }); c.n++; if (ok) c.r++;
      R.diff[q.d][1]++; if (ok) R.diff[q.d][0]++;
      if (ok && (R.fastest == null || a.t < R.fastest)) R.fastest = a.t;
    });
    var S = load(), rec = S[L.id] || { best: 0, attempts: 0, history: [] };
    var prevBest = rec.attempts ? rec.best : null;
    rec.attempts++; rec.best = Math.max(rec.best, R.right);
    rec.last = { score: R.right, time: Math.round(R.time), at: Date.now() };
    rec.history = (rec.history || []).concat([{ s: R.right, at: Date.now() }]).slice(-10);
    S[L.id] = rec; store(S);
    renderResult(R, rec, prevBest);
  }

  function renderResult(R, rec, prevBest) {
    show(resV); resV.style.setProperty("--c", L.color);
    var n = L.qs.length, pct = Math.round(R.right * 100 / n), attempted = R.right + R.wrong;
    var stars = pct >= 85 ? 3 : pct >= 60 ? 2 : pct >= 35 ? 1 : 0;
    var band = pct >= 85 ? "a_res_top" : pct >= 60 ? "a_res_good" : pct >= 35 ? "a_res_ok" : "a_res_low";
    var msg = {
      a_res_top: "Incredible! You’re a true geneticist! I’m bursting with pride!",
      a_res_good: "Great job! You really understand how traits are inherited. Check the review to make it perfect!",
      a_res_ok: "Good effort! Look at the concepts marked for revision and try again — you’ll beat this score!",
      a_res_low: "Don’t worry, every scientist starts somewhere! Revise the tutorials I’ve suggested and come back. I believe in you!"
    }[band];
    var badge = stars ? L.badge[stars - 1] : "Brave Beginner";
    var newBest = prevBest != null && R.right > prevBest;
    var avg = R.time / n;
    var html = "";
    html += '<section class="res-hero"><div class="res-m">' + $("#miko-big").innerHTML + "</div><div>";
    html += '<div class="kicker">' + esc(L.name + " · " + L.sub) + " · Result</div>";
    html += '<div class="res-score"><span class="big">' + R.right + "</span><span>/ " + n + "</span></div>";
    html += '<div class="stars" aria-label="' + stars + ' of 3 stars">' + [0, 1, 2].map(function (k) { return '<span class="' + (k < stars ? "on" : "") + '">★</span>'; }).join("") + "</div>";
    html += '<div class="badge">🏅 ' + esc(badge) + (newBest ? ' <span class="nb">New personal best!</span>' : "") + "</div>";
    html += '<p class="res-bubble">' + "You scored " + R.right + " out of " + n + ". " + esc(msg) + "</p>";
    html += '<button type="button" class="btn ghost replay">🔊 Hear Helix again</button></div></section>';

    html += '<div class="res-stats">' +
      tile(R.right, "Correct", "var(--lime)") + tile(R.wrong, "Wrong", "var(--red)") + tile(R.skip, "Unattempted", "var(--muted)") +
      tile((attempted ? Math.round(R.right * 100 / attempted) : 0) + "%", "Accuracy", "var(--cyan)") +
      tile(fmt(R.time), "Total time", "var(--amber)") + tile(fmt(avg), "Avg per question", "var(--violet)") + "</div>";

    // time per question
    html += '<h3 class="res-h">⏱ Time per question <small>(60 s limit)</small></h3><div class="tbars">';
    L.qs.forEach(function (q, k) {
      var a = ans[k], cls = a.sel == null ? "skip" : a.sel === q.ans ? "ok" : "bad";
      html += '<a href="#rv-' + k + '" class="tb ' + cls + '" title="Q' + (k + 1) + ": " + Math.round(a.t) + 's"><i style="height:' + Math.max(4, a.t / PER_Q * 100) + '%"></i><span>' + (k + 1) + "</span></a>";
    });
    html += '</div><p class="hint legend-row"><span class="lg ok"></span>Correct <span class="lg bad"></span>Wrong <span class="lg skip"></span>Unattempted' + (R.fastest != null ? " · Fastest correct answer: <b>" + Math.round(R.fastest) + " s</b>" : "") + "</p>";

    // concepts
    html += '<div class="cols res-cols"><div><h3 class="res-h">🧠 Concept mastery</h3>';
    var keys = Object.keys(R.concepts).sort(function (a, b) { return R.concepts[a].r / R.concepts[a].n - R.concepts[b].r / R.concepts[b].n; });
    var mastered = [];
    keys.forEach(function (c) {
      var x = R.concepts[c], p = Math.round(x.r * 100 / x.n), st = p >= 75 ? "strong" : p >= 50 ? "ok" : "weak";
      if (st === "strong") { mastered.push(c); return; }
      html += '<div class="cm ' + st + '"><div class="cm-h"><span>' + esc(c) + "</span><b>" + x.r + "/" + x.n + "</b></div><div class=\"cm-bar\"><i style=\"width:" + p + '%"></i></div>' +
        '<a href="tutorial-' + x.tut + '.html">Revise in Tutorial ' + x.tut + " →</a></div>";
    });
    if (mastered.length === keys.length) html += '<p class="hint">Every concept answered correctly — nothing to revise! 🎉</p>';
    if (mastered.length) html += '<p class="mastered-h">✓ Mastered (' + mastered.length + ")</p><div class=\"mastered\">" + mastered.map(function (c) { return "<span>" + esc(c) + "</span>"; }).join("") + "</div>";
    html += '</div><div><h3 class="res-h">📈 By difficulty</h3>';
    [["E", "Easy"], ["M", "Medium"], ["H", "Hard"]].forEach(function (d) {
      var v = R.diff[d[0]]; if (!v[1]) return;
      var p = Math.round(v[0] * 100 / v[1]);
      html += '<div class="cm d-' + d[0] + '"><div class="cm-h"><span>' + d[1] + "</span><b>" + v[0] + "/" + v[1] + "</b></div><div class=\"cm-bar\"><i style=\"width:" + p + '%"></i></div></div>';
    });
    html += '<h3 class="res-h">🏆 Your progress</h3><p class="hint" style="margin:0">Best: <b>' + rec.best + "/20</b> · Attempts: <b>" + rec.attempts + '</b></p><div class="hist">' +
      rec.history.map(function (h) { return '<span title="' + new Date(h.at).toLocaleString() + '"><i style="height:' + Math.max(6, h.s * 5) + '%"></i><b>' + h.s + "</b></span>"; }).join("") + "</div></div></div>";

    // review
    html += '<h3 class="res-h">🔍 Question review</h3><div class="rv-filter" role="tablist"><button type="button" class="on" data-f="all">All</button><button type="button" data-f="bad">Wrong (' + R.wrong + ')</button><button type="button" data-f="skip">Unattempted (' + R.skip + ')</button><button type="button" data-f="ok">Correct (' + R.right + ")</button></div>";
    L.qs.forEach(function (q, k) {
      var a = ans[k], cls = a.sel == null ? "skip" : a.sel === q.ans ? "ok" : "bad";
      var tag = cls === "ok" ? "✓ Correct" : cls === "bad" ? "✗ Wrong" : (a.timeout ? "⏱ Time ran out" : "↷ Skipped");
      html += '<details class="rv ' + cls + '" id="rv-' + k + '" data-c="' + cls + '"' + (cls !== "ok" ? " open" : "") + "><summary><b>Q" + (k + 1) + "</b> <span class=\"rv-tag\">" + tag + "</span> <span class=\"rv-t\">" + Math.round(a.t) + "s</span> <span class=\"rv-c\">" + esc(q.concept) + "</span></summary>";
      html += '<div class="rv-body"><div class="q-stem">' + q.stem + "</div>" + (q.table || "") + "<ul class=\"rv-opts\">";
      q.opts.forEach(function (o, j) {
        var c = j === q.ans ? "right" : j === a.sel ? "mine" : "";
        html += '<li class="' + c + '"><b>(' + "abcd"[j] + ")</b> " + esc(o) + (j === q.ans ? " <em>✓ correct</em>" : "") + (j === a.sel && j !== q.ans ? " <em>your answer</em>" : "") + "</li>";
      });
      html += '</ul><p class="rv-why"><b>Why:</b> ' + esc(q.why) + '</p><a class="revlink" href="tutorial-' + q.tut + '.html">📖 Revise · Tutorial ' + q.tut + "</a></div></details>";
    });
    var other = DATA.levels.filter(function (x) { return x.id !== L.id; })[0];
    html += '<div class="endnav"><button type="button" class="btn ghost back-hub">← Assessment Hub</button><button type="button" class="btn retake" style="--c:' + L.color + '">↻ Retake ' + esc(L.name) + "</button>" +
      (L.id === "L1" ? '<button type="button" class="btn go-l2" style="--c:' + other.color + '">Try ' + esc(other.name) + " →</button>" : '<a class="btn" style="--c:var(--violet)" href="practice-hub.html">Practise weak areas →</a>') + "</div>";
    resV.innerHTML = html;

    $$(".rv-filter button", resV).forEach(function (b) {
      b.addEventListener("click", function () {
        $$(".rv-filter button", resV).forEach(function (x) { x.classList.toggle("on", x === b); });
        $$(".rv", resV).forEach(function (d) { d.hidden = b.dataset.f !== "all" && d.dataset.c !== b.dataset.f; });
      });
    });
    $(".back-hub", resV).addEventListener("click", function () { MA.stop(); show(hubV); paintHub(); });
    $(".retake", resV).addEventListener("click", function () { MA.stop(); start(L.id); });
    var g2 = $(".go-l2", resV); if (g2) g2.addEventListener("click", function () { MA.stop(); start(other.id); });
    var heroM = $$(".res-m .mascot", resV);
    function speak() {
      MA.wave($(".res-hero", resV));
      MA.say("score_" + R.right, { mascots: heroM, onend: function (ok) { if (ok) setTimeout(function () { MA.say(band, { mascots: heroM }); }, 250); } });
    }
    $(".replay", resV).addEventListener("click", speak);
    MA.sfx(stars >= 2 ? "fanfare" : "pop", .55);
    setTimeout(function () { MA.say("a_done", { mascots: heroM, onend: function () { setTimeout(speak, 200); } }); }, 700);
  }
  function tile(v, l, c) { return '<div style="--tc:' + c + '"><b>' + v + "</b><span>" + l + "</span></div>"; }

  paintHub();
})();
