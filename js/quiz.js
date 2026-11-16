/* =========================================================
   피부 나이 퀴즈 화면 스크립트 (quiz.html 전용)
   - 문구·질문·점수는 data/quiz.js 에서 읽습니다. 문구만 바꿀 때는 이 파일을 고치지 않습니다.
   - 답은 이 브라우저 안의 변수에만 담기며, 저장(localStorage 등)하거나 서버로 보내지 않습니다.
   - 결과는 두 단계: ① 짧은 요약 → '자세한 결과 확인하기' → ② 자세한 결과 (진료 안내·진료비·예약)
   - 예약 버튼과 가격표 모양은 js/main.js 가 만든 것(window.SITE)을 그대로 씁니다.
   ========================================================= */
(function () {
  var Q = window.QUIZ;
  var T = window.TREATMENTS || [];
  var C = window.CLINIC || {};
  var SITE = window.SITE || {};
  var root = document.querySelector("[data-quiz]");
  if (!Q || !root) return;

  var habits = Q.habits || [];
  var concern = Q.concern || { options: [] };
  var TOTAL = habits.length + 1;           // 습관 질문 + 마지막 고민 질문
  var STEP_INTRO = -1;
  var STEP_CONCERN = habits.length;
  var STEP_SUMMARY = habits.length + 1;    // 결과 1단계: 짧은 요약
  var STEP_DETAIL = habits.length + 2;     // 결과 2단계: 자세한 결과

  var state = { step: STEP_INTRO, answers: {}, concerns: [] };
  var busy = false;
  // '자세한 결과'로 갈 때 브라우저 기록을 하나 남깁니다. 휴대폰의 뒤로 가기를 누르면 요약으로 돌아옵니다.
  var detailPushed = false;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 작은 도구 ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function reviewBadge() {
    return Q.reviewed ? "" : ' <span class="review">[원장 검토 필요]</span>';
  }
  function findTreatment(name) {
    for (var i = 0; i < T.length; i++) if (T[i].name === name) return T[i];
    if (window.console) console.warn("[피부 나이 퀴즈] data/treatments.js 에 없는 시술 이름:", name);
    return null;
  }
  function answeredAll() {
    for (var i = 0; i < habits.length; i++) if (state.answers[habits[i].id] == null) return false;
    return true;
  }
  function firstUnanswered() {
    for (var i = 0; i < habits.length; i++) if (state.answers[habits[i].id] == null) return i;
    return STEP_CONCERN;
  }

  /* ---------- 점수 계산 (습관 8가지, 100점 만점) ---------- */
  function scoreOf() {
    var got = 0, max = 0;
    habits.forEach(function (h) {
      var opt = h.options[state.answers[h.id]];
      max += h.weight * 2;
      got += h.weight * (opt ? opt.score : 0);
    });
    return max ? Math.round((got / max) * 100) : 0;
  }
  function tierOf(score) {
    var tiers = (Q.tiers || []).slice().sort(function (a, b) { return b.min - a.min; });
    for (var i = 0; i < tiers.length; i++) if (score >= tiers[i].min) return tiers[i];
    return tiers[tiers.length - 1] || { name: "", text: "" };
  }

  /* ---------- 결과 계산 (요약과 자세한 결과가 함께 씀) ---------- */
  // 잘하고 있는 습관 / 먼저 챙길 습관 (점수를 많이 잃은 순서)
  function habitResult() {
    var goods = [], tips = [];
    habits.forEach(function (h, idx) {
      var opt = h.options[state.answers[h.id]] || { score: 0 };
      if (opt.score >= 2) goods.push(opt.good || h.good);
      else tips.push({ h: h, lost: h.weight * (2 - opt.score), idx: idx });
    });
    tips.sort(function (a, b) { return b.lost - a.lost || a.idx - b.idx; });
    return { goods: goods, tips: tips.slice(0, Q.maxTips || 3) };
  }
  // 고른 고민마다 보여 줄 시술 (같은 시술은 처음 나온 고민에서 한 번만)
  function concernGroups() {
    var shown = {};
    return concern.options.filter(function (o) { return state.concerns.indexOf(o.id) !== -1; }).map(function (o) {
      var list = [];
      (o.related || []).forEach(function (name) {
        if (shown[name]) return;
        var t = findTreatment(name);
        if (!t) return;
        shown[name] = true;
        list.push(t);
      });
      return { option: o, treatments: list };
    });
  }
  function treatmentsOf(groups) {
    return groups.reduce(function (acc, g) { return acc.concat(g.treatments); }, []);
  }

  /* ---------- 화면 전환 ---------- */
  function go(step) {
    state.step = step;
    render();
  }

  function render() {
    var s = state.step;
    // 질문과 짧은 요약에서는 하단 예약 바를 숨깁니다 (요약에서는 '자세한 결과 확인하기'에 집중)
    document.body.classList.toggle("quiz-asking", s >= 0 && s < STEP_DETAIL);

    if (s === STEP_INTRO) root.innerHTML = introHtml();
    else if (s < STEP_CONCERN) root.innerHTML = habitHtml(s);
    else if (s === STEP_CONCERN) root.innerHTML = concernHtml();
    else if (s === STEP_SUMMARY) root.innerHTML = summaryHtml();
    else root.innerHTML = detailHtml();

    root.firstElementChild && root.firstElementChild.classList.add("quiz-screen");
    if (s === STEP_SUMMARY) afterSummary();

    window.scrollTo(0, 0);
    var focusEl = root.querySelector("[data-focus]");
    if (focusEl) {
      try { focusEl.focus({ preventScroll: true }); } catch (e) { focusEl.focus(); }
    }
  }

  function toDetail() {
    if (window.history && history.pushState) {
      try { history.pushState({ fbQuiz: "detail" }, ""); detailPushed = true; } catch (e) { detailPushed = false; }
    }
    go(STEP_DETAIL);
  }
  function toSummary() {
    if (detailPushed) {
      // 남겨 둔 기록을 되돌리면 아래 popstate 에서 요약으로 바뀝니다. (안 바뀌는 브라우저를 위해 한 번 더 확인)
      detailPushed = false;
      history.back();
      setTimeout(function () { if (state.step === STEP_DETAIL) go(STEP_SUMMARY); }, 400);
      return;
    }
    go(STEP_SUMMARY);
  }
  window.addEventListener("popstate", function (e) {
    var mark = e.state && e.state.fbQuiz;
    if (state.step === STEP_DETAIL && mark !== "detail") { detailPushed = false; go(STEP_SUMMARY); }
    else if (state.step === STEP_SUMMARY && mark === "detail") { detailPushed = true; go(STEP_DETAIL); }
  });

  /* ---------- 시작 화면 ---------- */
  function introHtml() {
    return '<div class="quiz-intro">' +
      '<p class="eyebrow">' + esc(Q.eyebrow) + "</p>" +
      '<h1 class="quiz-title" tabindex="-1" data-focus>' + esc(Q.title) + reviewBadge() + "</h1>" +
      '<p class="quiz-lead">' + esc(Q.lead) + "</p>" +
      '<div class="rule"></div>' +
      '<ul class="quiz-points">' +
        (Q.introPoints || []).map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") +
      "</ul>" +
      '<button type="button" class="btn btn-primary quiz-start" data-action="start">' + esc(Q.startLabel) + "</button>" +
    "</div>";
  }

  /* ---------- 공통: 위쪽 진행 표시 ---------- */
  function progressHtml(n) {
    var pct = Math.round((n / TOTAL) * 100);
    return '<div class="quiz-top">' +
      '<button type="button" class="quiz-back" data-action="back"><span aria-hidden="true">←</span> 이전</button>' +
      '<p class="quiz-count">질문 <strong>' + n + "</strong> / " + TOTAL + "</p>" +
    "</div>" +
    '<div class="quiz-progress" role="progressbar" aria-label="퀴즈 진행" aria-valuemin="0" aria-valuemax="' + TOTAL +
      '" aria-valuenow="' + n + '"><span style="width:' + pct + '%"></span></div>';
  }

  /* ---------- 습관 질문 ---------- */
  function habitHtml(i) {
    var h = habits[i];
    var chosen = state.answers[h.id];
    return '<div class="quiz-question">' +
      progressHtml(i + 1) +
      '<h1 class="quiz-q" id="q-title" tabindex="-1" data-focus>' + esc(h.question) + "</h1>" +
      '<div class="quiz-options" role="group" aria-labelledby="q-title">' +
        h.options.map(function (o, k) {
          var on = chosen === k;
          return '<button type="button" class="quiz-option' + (on ? " is-on" : "") + '" aria-pressed="' + on +
            '" data-action="answer" data-k="' + k + '"><span>' + esc(o.label) + '</span><i aria-hidden="true"></i></button>';
        }).join("") +
      "</div>" +
    "</div>";
  }

  /* ---------- 마지막 질문: 피부 고민 ---------- */
  function concernHtml() {
    var max = concern.max || 2;
    var picked = state.concerns;
    var full = picked.length >= max;
    return '<div class="quiz-question">' +
      progressHtml(TOTAL) +
      '<h1 class="quiz-q" id="q-title" tabindex="-1" data-focus>' + esc(concern.question) + "</h1>" +
      '<p class="quiz-help" id="q-help">' + esc(concern.help) + "</p>" +
      '<div class="quiz-options is-grid" role="group" aria-labelledby="q-title" aria-describedby="q-help">' +
        concern.options.map(function (o) {
          var on = picked.indexOf(o.id) !== -1;
          var off = !on && full && !o.exclusive;
          return '<button type="button" class="quiz-option' + (on ? " is-on" : "") + (o.exclusive ? " is-wide" : "") +
            '" aria-pressed="' + on + '"' + (off ? ' aria-disabled="true"' : "") +
            ' data-action="concern" data-id="' + esc(o.id) + '"><span>' + esc(o.label) + '</span><i aria-hidden="true"></i></button>';
        }).join("") +
      "</div>" +
      '<p class="quiz-limit" aria-live="polite" data-limit></p>' +
      '<button type="button" class="btn btn-primary quiz-next" data-action="result"' + (picked.length ? "" : " disabled") + ">" +
        esc(concern.nextLabel || "결과 보기") + "</button>" +
    "</div>";
  }

  /* ---------- 결과 1단계: 짧은 요약 ---------- */
  var RING_R = 52;
  var RING_LEN = 2 * Math.PI * RING_R;

  function ringSvg() {
    var ticks = "";
    for (var t = 0; t < 12; t++) {
      var a = (t / 12) * 2 * Math.PI;
      var x1 = 60 + Math.sin(a) * 41, y1 = 60 - Math.cos(a) * 41;
      var x2 = 60 + Math.sin(a) * (t % 3 === 0 ? 36 : 38.5), y2 = 60 - Math.cos(a) * (t % 3 === 0 ? 36 : 38.5);
      ticks += '<line x1="' + x1.toFixed(2) + '" y1="' + y1.toFixed(2) + '" x2="' + x2.toFixed(2) + '" y2="' + y2.toFixed(2) + '" />';
    }
    return '<svg class="quiz-ring" viewBox="0 0 120 120" aria-hidden="true" focusable="false">' +
      '<circle class="ring-track" cx="60" cy="60" r="' + RING_R + '" />' +
      '<circle class="ring-value" cx="60" cy="60" r="' + RING_R + '" transform="rotate(-90 60 60)"' +
        ' stroke-dasharray="' + RING_LEN.toFixed(2) + '" stroke-dashoffset="' + RING_LEN.toFixed(2) + '" data-ring />' +
      '<g class="ring-ticks">' + ticks + "</g>" +
    "</svg>";
  }

  function summaryHtml() {
    var score = scoreOf();
    var tier = tierOf(score);
    var r = habitResult();
    var groups = concernGroups();
    var nTreat = treatmentsOf(groups).length;
    // 이름 하나가 두 줄로 갈라지지 않게 묶어 둡니다
    var nb = function (s) { return '<span class="quiz-nb">' + esc(s) + "</span>"; };
    var tipNames = r.tips.map(function (t) { return nb(t.h.name); }).join(" · ");
    var concernNames = groups.map(function (g) { return nb(g.option.label); }).join(" · ");
    var countText = nTreat
      ? '<span class="quiz-brief-sub">' + esc(String(Q.briefTreatCount || "관련 진료 {n}가지").replace("{n}", nTreat)) + "</span>"
      : "";

    return '<div class="quiz-result quiz-summary">' +
      '<header class="quiz-result-head">' +
        '<p class="eyebrow">Result</p>' +
        '<h1 class="quiz-title" tabindex="-1" data-focus>' + esc(tier.name) + reviewBadge() + "</h1>" +
        '<div class="quiz-score">' + ringSvg() +
          '<p class="quiz-score-num"><span class="sr-only">' + esc(Q.scoreLabel) + " </span><strong>" + score + "</strong><small>점</small></p>" +
        "</div>" +
        '<p class="quiz-score-label">' + esc(Q.scoreLabel) + " · 100점 만점</p>" +
        '<p class="quiz-tier-text">' + esc(tier.text) + "</p>" +
      "</header>" +
      '<dl class="quiz-brief">' +
        "<div><dt>" + esc(Q.briefTipLabel) + "</dt><dd>" + (tipNames || esc(Q.briefNoTip)) + "</dd></div>" +
        "<div><dt>" + esc(Q.briefConcernLabel) + "</dt><dd>" + concernNames + countText + "</dd></div>" +
      "</dl>" +
      '<div class="quiz-detail-cta">' +
        '<button type="button" class="btn btn-primary quiz-detail-btn" data-action="detail">' + esc(Q.detailLabel) + "</button>" +
        '<p class="quiz-detail-hint">' + esc(Q.detailHint) + "</p>" +
        '<button type="button" class="quiz-link-btn" data-action="retry">' + esc(Q.retryLabel) + "</button>" +
      "</div>" +
      '<p class="quiz-disclaimer">' + esc(Q.scoreNote) + " " + esc(Q.disclaimer) + "</p>" +
    "</div>";
  }

  function afterSummary() {
    var ring = root.querySelector("[data-ring]");
    if (!ring) return;
    var target = RING_LEN * (1 - scoreOf() / 100);
    if (reduceMotion) { ring.style.strokeDashoffset = target.toFixed(2); return; }
    // 다음 그림 단계에서 값을 바꿔야 부드럽게 채워집니다.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { ring.style.strokeDashoffset = target.toFixed(2); });
    });
  }

  /* ---------- 결과 2단계: 자세한 결과 ---------- */
  function sourceTags(ids) {
    var S = Q.sources || {};
    return (ids || []).filter(function (id) { return S[id]; }).map(function (id) {
      return '<a href="#src-' + esc(id) + '" data-action="source" data-id="' + esc(id) + '">' + esc(S[id].tag) + "</a>";
    }).join("");
  }

  function detailHtml() {
    var score = scoreOf();
    var tier = tierOf(score);
    var r = habitResult();
    var groups = concernGroups();

    var tipsHtml = r.tips.length
      ? '<ol class="quiz-tips">' + r.tips.map(function (t) {
          return "<li><h3>" + esc(t.h.name) + "</h3><p>" + esc(t.h.tip) + "</p>" +
            '<p class="quiz-tags"><span>근거</span>' + sourceTags(t.h.sources) + "</p></li>";
        }).join("") + "</ol>"
      : '<p class="quiz-empty">' + esc(Q.allGoodText) + "</p>";

    var goodsHtml = r.goods.length
      ? '<ul class="quiz-goods">' + r.goods.map(function (g) { return "<li>" + esc(g) + "</li>"; }).join("") + "</ul>"
      : "";

    return '<div class="quiz-result quiz-detail">' +
      '<div class="quiz-top"><button type="button" class="quiz-back" data-action="summary"><span aria-hidden="true">←</span> ' +
        esc(Q.backLabel || "요약 보기") + "</button></div>" +
      '<header class="quiz-detail-head">' +
        '<p class="eyebrow">' + esc(Q.detailEyebrow || "Detail") + "</p>" +
        '<h1 class="quiz-title" tabindex="-1" data-focus>' + esc(Q.detailTitle) + reviewBadge() + "</h1>" +
        '<p class="quiz-detail-sub">' + esc(tier.name) + " · " + esc(Q.scoreLabel) + " <strong>" + score + "</strong>점</p>" +
        '<p class="quiz-score-note">' + esc(Q.scoreNote) + "</p>" +
      "</header>" +

      '<section class="quiz-block" aria-labelledby="r-tips"><h2 id="r-tips">' + esc(Q.tipTitle) + "</h2>" + tipsHtml + "</section>" +
      (goodsHtml ? '<section class="quiz-block" aria-labelledby="r-goods"><h2 id="r-goods">' + esc(Q.goodTitle) + "</h2>" + goodsHtml + "</section>" : "") +
      concernResultHtml(groups) +
      priceHtml(groups) +
      ctaHtml() +

      '<div class="quiz-actions">' +
        '<button type="button" class="btn btn-ghost" data-action="retry">' + esc(Q.retryLabel) + "</button>" +
        '<a class="btn btn-ghost" href="index.html">' + esc(Q.homeLabel) + "</a>" +
      "</div>" +
      '<p class="quiz-disclaimer">' + esc(Q.disclaimer) + "</p>" +
      sourcesHtml() +
    "</div>";
  }

  function treatCardHtml(t) {
    var chips = (t.items || []).map(function (it) { return "<span>" + esc(it.name) + "</span>"; }).join("");
    var badge = t.reviewed ? "" : ' <span class="review">[원장 검토 필요]</span>';
    return '<details class="quiz-treat"><summary><span class="quiz-treat-name">' + esc(t.name) + "</span>" +
      (chips ? '<span class="quiz-chips">' + chips + "</span>" : "") + "</summary>" +
      "<p>" + esc(t.description) + badge + "</p></details>";
  }

  function concernResultHtml(groups) {
    var anyTreatment = treatmentsOf(groups).length > 0;
    var body = groups.map(function (g) {
      var o = g.option;
      if (o.exclusive || !(o.related || []).length) return '<p class="quiz-empty">' + esc(Q.concernNoneText) + "</p>";
      if (!g.treatments.length) return "";
      return '<div class="quiz-concern"><h3>' + esc(o.label) + "</h3>" + g.treatments.map(treatCardHtml).join("") + "</div>";
    }).join("");

    return '<section class="quiz-block" aria-labelledby="r-concern"><h2 id="r-concern">' + esc(Q.concernTitle) + "</h2>" +
      (anyTreatment ? '<p class="quiz-block-lead">' + esc(Q.concernLead) + "</p>" : "") +
      body +
      // 시술을 보여 줄 때는 부작용 안내를 바로 아래에 보통 글씨 크기로 둡니다 (의료법 시행령 제23조 제1항 제7호)
      (anyTreatment
        ? '<p class="quiz-notice">' + esc(Q.sideEffectNotice) + "</p>" +
          '<p class="quiz-more"><a href="index.html#treatments">' + esc(Q.treatmentsLink) + ' <span aria-hidden="true">→</span></a></p>'
        : "") +
    "</section>";
  }

  // 진료비 안내: 위에 나온 시술의 가격만 홈페이지 비급여 진료비 표와 같은 모양으로 보여 줍니다.
  function priceHtml(groups) {
    var list = treatmentsOf(groups);
    if (!list.length || typeof SITE.priceTableHtml !== "function") return "";
    return '<section class="quiz-block" aria-labelledby="r-price"><h2 id="r-price">' + esc(Q.priceTitle) + "</h2>" +
      '<p class="quiz-block-lead">' + esc(Q.priceLead) + "</p>" +
      '<div class="quiz-price">' + SITE.priceTableHtml(list) + "</div>" +
      '<p class="quiz-price-note">' + (C.pricesUpdated ? "최종 업데이트 " + esc(C.pricesUpdated) + " · " : "") + esc(Q.priceNote) + "</p>" +
      '<p class="quiz-more"><a href="index.html#prices">' + esc(Q.priceAllLink) + ' <span aria-hidden="true">→</span></a></p>' +
    "</section>";
  }

  function ctaHtml() {
    var buttons = SITE.reserveButtonsHtml || "";
    return '<section class="quiz-cta" aria-labelledby="r-cta">' +
      '<h2 id="r-cta">' + esc(Q.ctaTitle) + "</h2>" +
      "<p>" + esc(Q.ctaText) + "</p>" +
      (buttons ? '<div class="btn-row">' + buttons + "</div>" : "") +
    "</section>";
  }

  function sourcesHtml() {
    var S = Q.sources || {};
    var ids = Object.keys(S);
    if (!ids.length) return "";
    return '<details class="quiz-sources" data-sources><summary>' + esc(Q.sourcesTitle) + "</summary><ol>" +
      ids.map(function (id) {
        return '<li id="src-' + esc(id) + '"><a href="' + esc(S[id].url) + '" target="_blank" rel="noopener">' + esc(S[id].title) + "</a></li>";
      }).join("") +
    "</ol></details>";
  }

  /* ---------- 고민 질문: 다시 그리지 않고 선택 표시만 바꿈 (화면이 위로 튀지 않게) ---------- */
  function updateConcernUI() {
    var max = concern.max || 2;
    var picked = state.concerns;
    var full = picked.length >= max;
    Array.prototype.slice.call(root.querySelectorAll('[data-action="concern"]')).forEach(function (b) {
      var id = b.getAttribute("data-id");
      var o = optionById(id) || {};
      var on = picked.indexOf(id) !== -1;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
      if (!on && full && !o.exclusive) b.setAttribute("aria-disabled", "true");
      else b.removeAttribute("aria-disabled");
    });
    var next = root.querySelector('[data-action="result"]');
    if (next) next.disabled = !picked.length;
  }
  function optionById(id) {
    for (var i = 0; i < concern.options.length; i++) if (concern.options[i].id === id) return concern.options[i];
    return null;
  }

  /* ---------- 누르기 처리 ---------- */
  root.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-action]");
    if (!btn || !root.contains(btn)) return;
    var action = btn.getAttribute("data-action");

    if (action === "start") return go(0);
    if (action === "back") { busy = false; return go(Math.max(STEP_INTRO, state.step - 1)); }
    if (action === "detail") return toDetail();
    if (action === "summary") return toSummary();
    if (action === "retry") {
      if (detailPushed) {
        // 남겨 둔 '자세한 결과' 기록을 지워, 뒤로 가기가 예전 결과로 가지 않게 합니다.
        detailPushed = false;
        try { history.replaceState(null, ""); } catch (err) { /* 무시 */ }
      }
      state.answers = {};
      state.concerns = [];
      return go(0);
    }

    if (action === "answer") {
      if (busy) return;
      var from = state.step;
      var h = habits[from];
      var k = Number(btn.getAttribute("data-k"));
      state.answers[h.id] = k;
      Array.prototype.slice.call(root.querySelectorAll(".quiz-option")).forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", String(on));
      });
      busy = true;
      // 고른 답이 잠깐 보인 뒤 다음 질문으로 (그사이 '이전'을 누르면 넘어가지 않음)
      setTimeout(function () {
        if (!busy || state.step !== from) return;
        busy = false;
        go(from + 1);
      }, reduceMotion ? 120 : 260);
      return;
    }

    if (action === "concern") {
      var id = btn.getAttribute("data-id");
      var opt = optionById(id);
      var list = state.concerns.slice();
      var at = list.indexOf(id);
      var max = concern.max || 2;
      var msg = root.querySelector("[data-limit]");
      if (msg) msg.textContent = "";
      if (at !== -1) list.splice(at, 1);
      else if (opt && opt.exclusive) list = [id];
      else {
        list = list.filter(function (x) { var o = optionById(x); return !(o && o.exclusive); });
        if (list.length >= max) {
          if (msg) msg.textContent = max + "개까지만 고를 수 있어요. 바꾸려면 고른 것을 한 번 더 눌러 빼 주세요.";
          return;
        }
        list.push(id);
      }
      state.concerns = list;
      updateConcernUI();
      return;
    }

    if (action === "result") {
      if (!state.concerns.length) return;
      if (!answeredAll()) return go(firstUnanswered());
      return go(STEP_SUMMARY);
    }

    if (action === "source") {
      // 주소(#)를 바꾸지 않고 근거 목록을 펼쳐 해당 줄로 이동합니다. (뒤로 가기 기록이 생기지 않게)
      e.preventDefault();
      var box = root.querySelector("[data-sources]");
      if (box) box.open = true;
      var li = document.getElementById("src-" + btn.getAttribute("data-id"));
      if (li) {
        li.classList.add("is-target");
        try { li.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" }); } catch (err) { li.scrollIntoView(); }
        setTimeout(function () { li.classList.remove("is-target"); }, 2400);
      }
    }
  });

  render();
})();
