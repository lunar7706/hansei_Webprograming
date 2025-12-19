// WEB/3_JS/1_calc.js
(function () {
  "use strict";

  function initCalcPage() {
    console.log("[1_calc] initCalcPage called");

    const checkBtn = document.getElementById("checkBtn");
    const studentIdInput = document.getElementById("studentId");
    const majorSelect = document.getElementById("major");
    const resultDiv = document.getElementById("result");

    const elements = { checkBtn, studentIdInput, majorSelect, resultDiv };
    console.log("[1_calc] elements", elements);

    if (!checkBtn || !studentIdInput || !majorSelect || !resultDiv) {
      console.warn("[1_calc] required elements missing. Check IDs and HTML structure.");
      return;
    }

    // ✅ 전공 목록을 4-2_eval_data.js(EVAL_DATA)에서 채우기
    function fillMajorsFromEvalData() {
      if (!window.EVAL_DATA || !Array.isArray(window.EVAL_DATA.allMajor)) {
        console.warn("[1_calc] EVAL_DATA/allMajor missing. Using existing options (if any).");
        return;
      }

      const { allMajor, allSust } = window.EVAL_DATA;

      // sust_cd -> 학부명 매핑(있으면 optgroup 라벨로 사용)
      const sustNameByCd = new Map();
      if (Array.isArray(allSust)) {
        allSust.forEach(s => sustNameByCd.set(s.nvalue, s.description));
      }

      // 기존 옵션 싹 비우고 placeholder만 남김
      majorSelect.innerHTML = "";
      const ph = document.createElement("option");
      ph.value = "";
      ph.textContent = "-- 학과 선택 --";
      majorSelect.appendChild(ph);

      // 학부별로 묶기(없으면 전체 1그룹)
      const groupMap = new Map(); // label -> Set(majorName)
      allMajor.forEach(m => {
        const label = sustNameByCd.get(m.sust_cd) || "전체";
        const name = (m.description || "").trim();
        if (!name) return;

        if (!groupMap.has(label)) groupMap.set(label, new Set());
        groupMap.get(label).add(name);
      });

      // 정렬해서 DOM에 넣기
      const labels = Array.from(groupMap.keys()).sort((a, b) => a.localeCompare(b, "ko"));
      labels.forEach(label => {
        const og = document.createElement("optgroup");
        og.label = label;

        const majors = Array.from(groupMap.get(label)).sort((a, b) => a.localeCompare(b, "ko"));
        majors.forEach(name => {
          const opt = document.createElement("option");
          // ✅ value는 '학과명'으로 저장 (기존 로직과 100% 호환)
          opt.value = name;
          opt.textContent = name;
          og.appendChild(opt);
        });

        majorSelect.appendChild(og);
      });

      console.log("[1_calc] majors filled from EVAL_DATA:", allMajor.length);
    }

    // 페이지 진입 시 전공 채우기 시도
    fillMajorsFromEvalData();

    // ---------------- 기존 로직 그대로 ----------------

    // 학과별 졸업 요구치(샘플)
    const graduationRequirements = {
      "컴퓨터공학과": { liberal: { 필수: 6, 선택: 12 }, major: { 기초: 30, 필수: 40, 선택: 20 }, total: 120 },
      "소프트웨어학과": { liberal: { 필수: 6, 선택: 12 }, major: { 기초: 28, 필수: 42, 선택: 20 }, total: 120 },
      "경영학과": { liberal: { 필수: 6, 선택: 12 }, major: { 기초: 20, 필수: 40, 선택: 34 }, total: 120 }
    };

    function getReq(major) {
      return graduationRequirements[major] || {
        liberal: { 필수: 6, 선택: 12 },
        major: { 기초: 24, 필수: 36, 선택: 30 },
        total: 120
      };
    }

    function storageKey(sid, major) {
      return "calc:" + sid + "|" + major;
    }

    // 학번/학과 기반 난수 이수치 생성(재현 가능)
    function generateEarned(sid, major) {
      const seed = Common.fnv32a(sid + "|" + major);
      const rng = Common.mulberry32(seed);
      const req = getReq(major);
      const earned = {
        liberal: {
          필수: Math.floor(rng() * (req.liberal.필수 + 1)),
          선택: Math.floor(rng() * (req.liberal.선택 + 1))
        },
        major: {
          기초: Math.floor(rng() * (req.major.기초 + 1)),
          필수: Math.floor(rng() * (req.major.필수 + 1)),
          선택: Math.floor(rng() * (req.major.선택 + 1))
        },
        total: 0
      };
      earned.total =
        earned.liberal.필수 +
        earned.liberal.선택 +
        earned.major.기초 +
        earned.major.필수 +
        earned.major.선택;
      return earned;
    }

    function pct(cur, max) {
      return Math.min(100, Math.round((cur / max) * 100) || 0);
    }

    function barHtml(label, cur, max) {
      const P = pct(cur, max);
      return `<div style="margin:10px 0">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <strong>${label}</strong><span class="badge ${P>=100?'badge-ok':''}">${cur}/${max} (${P}%)</span>
        </div>
        <div class="progress"><div class="bar" style="--val:${P}%"></div></div>
      </div>`;
    }

    function showResult(earned, major) {
      const req = getReq(major);
      const totalEarned = earned.total;
      const ok = totalEarned >= req.total;

      resultDiv.innerHTML = `
        <p>학과: <strong>${major}</strong></p>
        <p>총 이수 학점: <strong>${totalEarned}</strong> / ${req.total}</p>
        <p>교양필수: ${earned.liberal.필수}/${req.liberal.필수}, 교양선택: ${earned.liberal.선택}/${req.liberal.선택}</p>
        <p>전공기초: ${earned.major.기초}/${req.major.기초}, 전공필수: ${earned.major.필수}/${req.major.필수}, 전공선택: ${earned.major.선택}/${req.major.선택}</p>
        <p class="${ok ? "ok" : "no"}">${ok ? "졸업 요건 충족" : "졸업 요건 미충족"}</p>
      `;

      resultDiv.innerHTML +=
        barHtml("총 이수 학점", earned.total, req.total) +
        barHtml("교양(필수+선택)", earned.liberal.필수 + earned.liberal.선택, req.liberal.필수 + req.liberal.선택) +
        barHtml("전공(기초+필수+선택)",
          earned.major.기초 + earned.major.필수 + earned.major.선택,
          req.major.기초 + req.major.필수 + req.major.선택);
    }

    checkBtn.addEventListener("click", function () {
      const sid = studentIdInput.value.trim();
      const major = majorSelect.value;

      if (!/^\d{9}$/.test(sid)) {
        Common.showMessage("학번은 숫자 9자리로 입력하세요.", "warn");
        studentIdInput.focus();
        return;
      }
      if (!major) {
        Common.showMessage("학과를 선택하세요.", "warn");
        majorSelect.focus();
        return;
      }

      const key = storageKey(sid, major);
      let earned = Common.storageGet(key, null);
      if (!earned) {
        earned = generateEarned(sid, major);
        Common.storageSet(key, earned);
      }
      showResult(earned, major);
    });

    const form = document.getElementById("calcForm");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        checkBtn.click();
      });
    }
  }

  if (window.Common && typeof Common.register === "function") {
    Common.register("1_calc", initCalcPage);
  } else {
    document.addEventListener("DOMContentLoaded", initCalcPage);
  }
})();
