/* Printable worksheets */
(function () {
  "use strict";
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  var MA = window.MikoAudio || { sfx: function () {} };
  var cur = "ws1";
  function show() { $$(".ws").forEach(function (w) { w.classList.toggle("cur", w.id === cur); }); }
  $$(".ws-pick button").forEach(function (b) { b.addEventListener("click", function () { $$(".ws-pick button").forEach(function (x) { x.classList.toggle("on", x === b); }); cur = b.dataset.ws; show(); MA.sfx("pop", .3); }); });
  $(".ws-key").addEventListener("change", function () { document.body.classList.toggle("show-key", this.checked); MA.sfx("flag", .3); });
  $(".ws-print").addEventListener("click", function () { window.print(); });
  // make blanks and answer lines editable on screen (saved per device)
  var KEY = "her-b10-ws"; var S = {}; try { S = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) {}
  $$(".ws-blank, .ws-lines").forEach(function (el, i) {
    var inp = document.createElement(el.classList.contains("ws-lines") ? "textarea" : "input");
    inp.className = "ws-input"; inp.setAttribute("aria-label", "Your answer"); inp.value = S[i] || "";
    inp.addEventListener("input", function () { S[i] = inp.value; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} });
    el.insertBefore(inp, el.firstChild);
  });
  show();
})();
