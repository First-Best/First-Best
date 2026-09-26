/* =========================================================
   화면 그리기 스크립트
   - data/clinic.js, data/treatments.js 의 내용을 읽어 화면에 채웁니다.
   - 내용 수정은 이 파일이 아니라 data 폴더의 파일에서 합니다.
   ========================================================= */
(function () {
  var C = window.CLINIC || {};
  var T = window.TREATMENTS || [];
  var CATS = window.CATEGORIES || [];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  // 값이 비어 있으면 [빈칸: 라벨] 표시
  function val(v, label) {
    return v ? esc(v) : '<span class="blank">[빈칸: ' + esc(label) + "]</span>";
  }
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function linkBtn(url, label, cls) {
    if (url) {
      return '<a class="btn ' + cls + '" href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(label) + "</a>";
    }
    return '<span class="btn ' + cls + ' is-empty" aria-disabled="true" title="링크 준비 중">' +
      esc(label) + '<small>[링크 준비 중]</small></span>';
  }

  /* ---------- 단순 텍스트 ---------- */
  var labels = { hoursNote: "휴진 안내", directions: "찾아오는 방법", parking: "주차 안내" };
  $all("[data-clinic]").forEach(function (el) {
    var key = el.getAttribute("data-clinic");
    if (C[key]) el.textContent = C[key];
    else if (labels[key]) el.innerHTML = val("", labels[key]);
  });

  /* ---------- 예약 버튼 ---------- */
  var reserveHtml =
    linkBtn(C.naverReservationUrl, "네이버 예약", "btn-primary") +
    linkBtn(C.kakaoChannelUrl, "카카오톡 상담", "btn-ghost");
  $all("[data-reserve-buttons]").forEach(function (el) { el.innerHTML = reserveHtml; });

  var bar = $("[data-mobile-bar]");
  if (bar) {
    var tel = C.phone ? '<a href="tel:' + esc(C.phone.replace(/[^0-9+]/g, "")) + '">전화</a>' : '<a href="#contact">전화</a>';
    bar.innerHTML =
      tel +
      (C.kakaoChannelUrl ? '<a href="' + esc(C.kakaoChannelUrl) + '" target="_blank" rel="noopener">카카오톡</a>' : '<a href="#contact">카카오톡</a>') +
      (C.naverReservationUrl ? '<a class="is-main" href="' + esc(C.naverReservationUrl) + '" target="_blank" rel="noopener">네이버 예약</a>' : '<a class="is-main" href="#contact">네이버 예약</a>');
  }

  /* ---------- 원장 소개 ---------- */
  var d = C.doctor || {};
  var docEl = $("[data-doctor]");
  if (docEl) {
    var list = function (arr, label) {
      arr = arr && arr.length ? arr : [""];
      return arr.map(function (x) { return "<li>" + val(x, label) + "</li>"; }).join("");
    };
    docEl.innerHTML =
      '<figure class="doctor-photo"><img src="' + esc(d.photo || "images/placeholder-doctor.svg") + '" alt="원장 사진" /></figure>' +
      '<div class="doctor-body">' +
        '<p class="doctor-role">' + esc(d.title || "대표원장") + "</p>" +
        '<h3 class="doctor-name">' + val(d.name, "원장 이름") + "</h3>" +
        (d.greeting ? '<p class="doctor-greeting">' + esc(d.greeting) + "</p>" : "") +
        '<div class="doctor-lists">' +
          "<div><h4>학력</h4><ul>" + list(d.education, "학력") + "</ul></div>" +
          "<div><h4>경력</h4><ul>" + list(d.career, "경력") + "</ul></div>" +
        "</div>" +
      "</div>";
  }

  /* ---------- 시술 안내 (탭 + 카드) ---------- */
  var tabsEl = $("[data-tabs]");
  var cardsEl = $("[data-cards]");
  var usedCats = CATS.filter(function (c) {
    return T.some(function (t) { return t.category === c.id; });
  });

  function renderCards(catId) {
    cardsEl.innerHTML = T.filter(function (t) { return t.category === catId; }).map(function (t) {
      var chips = (t.items || []).length > 1
        ? '<ul class="chips">' + t.items.map(function (i) { return "<li>" + esc(i.name) + "</li>"; }).join("") + "</ul>"
        : "";
      var badge = t.reviewed ? "" : '<span class="review">[원장 검토 필요]</span>';
      return '<article class="card">' +
        "<h3>" + esc(t.name) + "</h3>" + chips +
        "<p>" + esc(t.description) + " " + badge + "</p>" +
        "</article>";
    }).join("");
  }

  if (tabsEl && cardsEl && usedCats.length) {
    tabsEl.innerHTML = usedCats.map(function (c, i) {
      return '<button role="tab" class="tab" data-cat="' + esc(c.id) + '" aria-selected="' + (i === 0) + '">' + esc(c.label) + "</button>";
    }).join("");
    tabsEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".tab");
      if (!btn) return;
      $all(".tab").forEach(function (b) { b.setAttribute("aria-selected", String(b === btn)); });
      renderCards(btn.getAttribute("data-cat"));
    });
    renderCards(usedCats[0].id);
  }

  /* ---------- 비급여 진료비 표 (시술 목록에서 자동 생성) ---------- */
  var priceEl = $("[data-prices]");
  if (priceEl) {
    priceEl.innerHTML = usedCats.map(function (c) {
      var rows = T.filter(function (t) { return t.category === c.id; }).map(function (t) {
        var items = t.items && t.items.length ? t.items : [{ name: t.name, price: "" }];
        return items.map(function (it, idx) {
          return "<tr>" +
            (idx === 0 ? '<th scope="rowgroup" rowspan="' + items.length + '">' + esc(t.name) + "</th>" : "") +
            "<td>" + esc(it.name) + "</td>" +
            '<td class="price">' + esc(it.price || "[가격 확정 예정]") + "</td>" +
            "</tr>";
        }).join("");
      }).join("");
      return '<div class="price-group">' +
        "<h3>" + esc(c.label) + "</h3>" +
        '<div class="table-wrap"><table class="price-table">' +
        '<thead><tr><th scope="col">구분</th><th scope="col">항목</th><th scope="col">비용</th></tr></thead>' +
        "<tbody>" + rows + "</tbody></table></div></div>";
    }).join("");
  }
  var upd = $("[data-updated]");
  if (upd && C.pricesUpdated) upd.textContent = C.pricesUpdated;

  /* ---------- 진료 시간 · 연락처 ---------- */
  var hoursEl = $("[data-hours]");
  if (hoursEl) {
    hoursEl.innerHTML = (C.hours || []).map(function (h) {
      return "<div><dt>" + esc(h.day) + "</dt><dd>" + val(h.time, "시간") + "</dd></div>";
    }).join("");
  }
  var phoneEl = $("[data-phone]");
  if (phoneEl) {
    phoneEl.innerHTML = C.phone
      ? '<a href="tel:' + esc(C.phone.replace(/[^0-9+]/g, "")) + '">' + esc(C.phone) + "</a>"
      : val("", "전화번호");
  }
  var addrEl = $("[data-address]");
  if (addrEl) addrEl.innerHTML = val(C.address, "주소") + (C.addressDetail ? "<br />" + esc(C.addressDetail) : "");

  var blogEl = $("[data-blog-button]");
  if (blogEl) blogEl.innerHTML = linkBtn(C.naverBlogUrl, "네이버 블로그 바로가기", "btn-ghost");

  var foot = $("[data-footer-info]");
  if (foot) {
    foot.innerHTML = "대표원장 " + val((C.doctor || {}).name, "원장 이름") +
      " · 주소 " + val(C.address, "주소") +
      " · 전화 " + val(C.phone, "전화번호");
  }

  /* ---------- 모바일 메뉴 ---------- */
  var menuBtn = $("#menuBtn");
  var nav = $("#nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        document.body.classList.remove("nav-open");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- 스크롤 시 상단 바 / 은은한 등장 ---------- */
  var topbar = $("#topbar");
  function onScroll() { topbar.classList.toggle("is-scrolled", window.scrollY > 10); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    $all(".section .container").forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
  }
})();
