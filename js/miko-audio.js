/* Helix's voice + sound effects, sound toggle, and the index-page intro */
(function () {
  "use strict";
  var KEY = "ilw-sound", VKEY = "ilw-voice";
  var PACKS = { in: { dir: "voice-in", label: "Indian English" }, hi: { dir: "voice-hi", label: "Hinglish" }, us: { dir: "voice", label: "American English" } };
  var pack = (function () { try { var v = localStorage.getItem(VKEY); return PACKS[v] ? v : "in"; } catch (e) { return "in"; } })();
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var on = get(KEY) !== "off";
  var voice = null, voiceEl = null, played = {}, repaint = function () {};

  function stopVoice() {
    if (voice) { try { voice.pause(); } catch (e) {} voice = null; }
    document.querySelectorAll(".mascot.talking").forEach(function (m) { m.classList.remove("talking"); });
    document.querySelectorAll(".hear.playing").forEach(function (b) { b.classList.remove("playing"); });
  }

  /* say(id, {el, onend, onstart}) → Promise<boolean played> */
  function say(id, o) {
    o = o || {};
    if (!on) { if (o.onend) o.onend(false); return Promise.resolve(false); }
    stopVoice();
    var a = new Audio("audio/" + PACKS[pack].dir + "/" + id + ".mp3"); voice = a; voiceEl = o.el || null;
    var ms = o.el ? o.el.querySelectorAll(".mascot") : [];
    if (o.mascots) ms = o.mascots;
    var btn = o.el ? o.el.querySelector(".hear") : null;
    function end(ok) {
      Array.prototype.forEach.call(ms, function (m) { m.classList.remove("talking"); });
      if (btn) btn.classList.remove("playing");
      if (voice === a) voice = null;
      if (o.onend) { var f = o.onend; o.onend = null; f(ok); }
    }
    a.addEventListener("ended", function () { end(true); });
    a.addEventListener("error", function () { end(false); });
    a.addEventListener("loadedmetadata", function () { if (o.onmeta) o.onmeta(a.duration); });
    return a.play().then(function () {
      Array.prototype.forEach.call(ms, function (m) { m.classList.add("talking"); });
      if (btn) btn.classList.add("playing");
      if (o.onstart) o.onstart(a);
      return true;
    }).catch(function () { end(false); return false; });
  }
  function sfx(name, vol) {
    if (!on) return;
    var a = new Audio("audio/sfx/" + name + ".mp3"); a.volume = vol == null ? .6 : vol;
    a.play().catch(function () {});
  }
  function once(id, o) { if (played[id]) return Promise.resolve(false); played[id] = 1; return say(id, o); }
  window.MikoAudio = { setPack: function (v) { setPack(v); }, pack: function () { return pack; }, say: say, sfx: sfx, once: once, stop: stopVoice, isOn: function () { return on; } };

  /* ---------- sound toggle in the top bar ---------- */
  var bar = document.querySelector(".topbar .wrap");
  if (bar) {
    var tg = document.createElement("button");
    tg.type = "button"; tg.className = "sound-toggle";
    function paint() { tg.textContent = on ? "🔊" : "🔇"; tg.setAttribute("aria-label", on ? "Mute Helix’s voice and sounds" : "Turn on Helix’s voice and sounds"); tg.title = on ? "Sound on — tap to mute" : "Muted — tap for sound"; tg.classList.toggle("off", !on); }
    tg.addEventListener("click", function () { on = !on; set(KEY, on ? "on" : "off"); if (!on) stopVoice(); else sfx("pop"); paint(); });
    paint(); repaint = paint; bar.insertBefore(tg, bar.querySelector(".tabs"));
    var vs = document.createElement("select");
    vs.className = "voice-pick"; vs.setAttribute("aria-label", "Choose Helix’s voice"); vs.title = "Helix’s voice";
    Object.keys(PACKS).forEach(function (k) { var o = document.createElement("option"); o.value = k; o.textContent = "🗣 " + PACKS[k].label; vs.appendChild(o); });
    vs.value = pack;
    vs.addEventListener("change", function () { setPack(vs.value, true); });
    bar.insertBefore(vs, tg.nextSibling);
  }
  function setPack(v, preview) {
    if (!PACKS[v]) return; pack = v; set(VKEY, v);
    document.querySelectorAll(".voice-pick").forEach(function (x) { x.value = v; });
    document.querySelectorAll(".vchoice button").forEach(function (b) { b.classList.toggle("on", b.dataset.pack === v); b.setAttribute("aria-pressed", b.dataset.pack === v); });
    if (preview) { if (!on) { on = true; set(KEY, "on"); repaint(); } say("poke2"); }
  }
  document.querySelectorAll(".vchoice button").forEach(function (b) {
    b.addEventListener("click", function () { setPack(b.dataset.pack, true); });
  });
  setPack(pack, false);
  if (false) {
  }

  /* ---------- “Hear Helix” buttons on anything with data-voice ---------- */
  document.querySelectorAll("[data-voice]").forEach(function (el) {
    if (el.classList.contains("intro")) return;
    var b = document.createElement("button");
    b.type = "button"; b.className = "hear"; b.innerHTML = "🔊 <span>Hear Helix</span>";
    b.setAttribute("aria-label", "Hear Helix say this");
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      if (!on) { on = true; set(KEY, "on"); repaint(); }
      if (b.classList.contains("playing")) { stopVoice(); return; }
      wave(el); say(el.dataset.voice, { el: el });
    });
    var slot = el.querySelector(".hear-slot") || el.querySelector("p") || el;
    slot.appendChild(b);
    el.querySelectorAll(".mascot").forEach(function (m) {
      m.style.cursor = "pointer";
      m.addEventListener("click", function (e) { e.stopPropagation(); wave(el); sfx("boing", .45); say(el.dataset.voice, { el: el }); });
    });
  });
  function wave(scope) {
    (scope ? scope.querySelectorAll(".mascot") : []).forEach(function (m) {
      m.classList.remove("waving"); void m.getBoundingClientRect(); m.classList.add("waving");
      setTimeout(function () { m.classList.remove("waving"); }, 2000);
    });
  }
  window.MikoAudio.wave = wave;

  /* other mascots: a playful poke */
  var pokes = ["poke1", "poke2"], pi = 0;
  document.querySelectorAll(".mascot").forEach(function (m) {
    if (m.closest("[data-voice]") || m.closest(".intro") || m.closest("#miko-mini") || m.closest(".toast")) return;
    m.style.cursor = "pointer";
    m.addEventListener("click", function () { var p = m.parentNode; wave(p); sfx("boing", .45); say(pokes[pi++ % 2], { mascots: [m] }); });
  });

  /* ---------- page-intro voice (tutorials, hub) ---------- */
  var head = document.querySelector("[data-voice].auto-voice");
  if (head && on) {
    setTimeout(function () {
      say(head.dataset.voice, { el: head }).then(function (ok) {
        if (ok) wave(head); else head.classList.add("tap-me");
      });
    }, 700);
    head.addEventListener("click", function () { head.classList.remove("tap-me"); }, true);
  }

  /* ---------- index intro: tap → Helix waves + greets → roadmap ---------- */
  var intro = document.querySelector(".intro");
  if (intro) {
    document.body.classList.add("intro-on");
    var start = intro.querySelector(".intro-start"), skip = intro.querySelector(".intro-skip");
    var bubble = intro.querySelector(".intro-bubble"), text = bubble.dataset.text, timer = null, finished = false;
    function type(total) {
      var i = 0, step = Math.max(18, (total * 1000) / text.length);
      bubble.hidden = false; bubble.textContent = "";
      (function next() {
        if (finished) return;
        bubble.textContent = text.slice(0, ++i);
        if (i < text.length) timer = setTimeout(next, step);
      })();
    }
    function finish() {
      if (finished) return; finished = true; clearTimeout(timer); stopVoice();
      intro.classList.add("leaving"); sfx("whoosh", .5);
      document.body.classList.remove("intro-on"); document.body.classList.add("road-anim");
      setTimeout(function () {
        intro.remove();
        var road = document.getElementById("roadmap");
        if (road) road.scrollIntoView({ behavior: "smooth", block: "start" });
        var hero = document.querySelector(".hero");
        setTimeout(function () { say("roadmap", { el: hero }); wave(hero); }, 700);
      }, 600);
    }
    start.addEventListener("click", function () {
      start.style.display = "none"; intro.classList.add("talking-stage");
      wave(intro); sfx("boing", .5);
      var ms = intro.querySelectorAll(".mascot");
      setTimeout(function () {
        var typed = false;
        say("greet", {
          mascots: ms,
          onmeta: function (d) { if (!typed) { typed = true; type(d * .92); } },
          onend: function () { if (!typed) { typed = true; type(text.length * 0.045); setTimeout(finish, text.length * 45 + 1500); } else setTimeout(finish, 900); }
        });
        // keep waving while greeting
        var w = setInterval(function () { if (finished) return clearInterval(w); wave(intro); }, 2200);
      }, 450);
    });
    skip.addEventListener("click", finish);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && document.body.contains(intro)) finish(); });
  }
})();
