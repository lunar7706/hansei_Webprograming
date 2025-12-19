// WEB/3_JS/0_common.js — 공통 JS
(function (global) {
  "use strict";

  var Common = {
    pageKey: null,
    registry: {},
    domReady: false
  };

  // 문자열을 페이지 키 형태로 정규화
  function normalizeKey(raw) {
    if (!raw) return null;
    return raw.toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/\.[a-z0-9]+$/i, "");
  }

  // 현재 페이지 키 감지 (index.html, 1_calc.html 등)
  function detectPageKey() {
    try {
      var b = document && document.body;
      if (b && b.dataset && b.dataset.page) {
        return normalizeKey(b.dataset.page);
      }
      var parts = (location.pathname || "").split("/").filter(Boolean);
      if (parts.length === 0) return null;
      var last = parts[parts.length - 1];
      if (/^index(\.html?)?$/i.test(last) && parts.length >= 2) {
        return normalizeKey(parts[parts.length - 2]);
      }
      return normalizeKey(last.replace(/\.[^/.]+$/, ""));
    } catch (e) {
      return null;
    }
  }

  // 해시 / 난수 유틸
  Common.fnv32a = function (str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  };

  Common.mulberry32 = function (a) {
    return function () {
      var t = (a += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // localStorage 래퍼
  Common.storageSet = function (key, obj) {
    try {
      localStorage.setItem(key, JSON.stringify(obj));
      return true;
    } catch (e) {
      console.error("storageSet", e);
      return false;
    }
  };

  Common.storageGet = function (key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return (typeof fallback !== "undefined" ? fallback : null);
      return JSON.parse(raw);
    } catch (e) {
      console.error("storageGet parse err", e);
      return (typeof fallback !== "undefined" ? fallback : null);
    }
  };

  Common.storageRemove = function (key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  };

  // 네임스페이스 키
  Common.nsKey = function (space, sid) {
    return "hsuk:v1:" + space + (sid ? ":" + sid : "");
  };

  // 간단 토스트 메시지
  Common.showMessage = function (msg, type, ms) {
    try {
      var container = document.getElementById("common_msg_box");
      if (!container) {
        container = document.createElement("div");
        container.id = "common_msg_box";
        container.style.position = "fixed";
        container.style.right = "16px";
        container.style.bottom = "16px";
        container.style.zIndex = 9999;
        document.body.appendChild(container);
      }
      var el = document.createElement("div");
      el.textContent = msg;
      el.style.padding = "10px 12px";
      el.style.borderRadius = "8px";
      el.style.marginTop = "8px";
      el.style.fontWeight = "600";
      el.style.boxShadow = "0 6px 18px rgba(0,0,0,0.08)";
      if (type === "ok") {
        el.style.background = "#e6ffed";
        el.style.color = "#0b7a3d";
      } else if (type === "warn") {
        el.style.background = "#fff7e6";
        el.style.color = "#8a6b00";
      } else {
        el.style.background = "#fff0f0";
        el.style.color = "#882020";
      }
      container.appendChild(el);
      setTimeout(function () {
        el.style.transition = "opacity .3s";
        el.style.opacity = 0;
        setTimeout(function () { el.remove(); }, 300);
      }, ms || 2500);
    } catch (e) {}
  };

  // 네비게이션 active 처리
  Common.setupNavActive = function () {
    try {
      var page = Common.pageKey || detectPageKey();
      if (!page) return;
      var items = document.querySelectorAll(".nav-item, .navbtn, .topnav a");
      items.forEach(function (a) {
        a.classList.remove("active");
        var target = (a.getAttribute("data-target") || "").toString().trim().toLowerCase();
        if (target && normalizeKey(target) === page) {
          a.classList.add("active");
          return;
        }
        try {
          var u = new URL(a.href, location.origin);
          var last = u.pathname.split("/").filter(Boolean).pop() || "";
          if (normalizeKey(last) === page) {
            a.classList.add("active");
            return;
          }
        } catch (_) {}
        var href = (a.getAttribute("href") || "").toString().toLowerCase();
        if (href && href.indexOf("/" + page) !== -1) {
          a.classList.add("active");
          return;
        }
      });
    } catch (e) {
      console.error("setupNavActive", e);
    }
  };

  // 테마 관련 (선택사항: 다크/라이트 전환)
  Common.applyTheme = function (theme) {
    var t = (theme === "dark") ? "dark" : "light";
    document.body.setAttribute("data-theme", t);
    Common.storageSet(Common.nsKey("pref", "theme"), t);
  };

  Common.initTheme = function () {
    var t = Common.storageGet(Common.nsKey("pref", "theme"), "light");
    Common.applyTheme(t);
  };

  // 페이지별 init 등록
  Common.register = function (pageKey, initFn) {
    try {
      var k = normalizeKey(pageKey);
      if (!k || typeof initFn !== "function") return;
      Common.registry[k] = initFn;
      if (Common.domReady && Common.pageKey === k) {
        try { initFn(); } catch (e) { console.error("page init error", e); }
      }
    } catch (e) {
      console.error("register err", e);
    }
  };

  function onReady() {
    Common.domReady = true;
    Common.pageKey = detectPageKey();
    Common.initTheme();
    Common.setupNavActive();
    if (Common.pageKey && Common.registry[Common.pageKey]) {
      try {
        Common.registry[Common.pageKey]();
      } catch (e) {
        console.error("registered init err", e);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    setTimeout(onReady, 0);
  }

  global.Common = Common;
})(window);
