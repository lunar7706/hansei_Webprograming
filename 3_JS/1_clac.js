// ⑤ WEB/3_JS/1_calc.js
(function () {
  "use strict";

  function initCalcPage() {
    const checkBtn = document.getElementById("checkBtn");
    const studentIdInput = document.getElementById("studentId");
    const majorSelect = document.getElementById("major");
    const resultDiv = document.getElementById("result");
    if (!checkBtn || !studentIdInput || !majorSelect || !resultDiv) return;

    // 학과별 졸업 요구사항 샘플
    const graduationRequirements = {
      "컴퓨터공학과": { liberal: { 필수: 6, 선택: 12 }, major: { 기초: 30, 필수: 40, 선택: 20 }, total: 120 },
      "소프트웨어학과": { liberal: { 필수: 6, 선택: 12 }, major: { 기초: 28, 필수: 42, 선택: 20 }, total: 120 },
      "경영학과": { liberal: { 필수: 6, 선택: 12 }, major: { 기초: 20, 필수: 40, 선택: 34 }, total: 120 }
    };

    function getReq(major) {
      return graduationRequirements[major] || { liberal: { 필수: 6, 선택: 12 }, major: { 기초: 24, 필수: 36, 선택: 30 }, total: 120 };
    }

    // 학번 기반 로컬스토리지 키
    function storageKey(sid, major) {
      return `calc:${sid}|${major}`;
    }

    // 랜덤 학점 생성 (mulberry32 + fnv32a)
    function generateEarned(sid, major) {
      const seed = Common.fnv32a(sid + major);
      const rng = Common.mulberry32(seed);
      const req = getReq(major);
      const earned = {
        liberal: { 필수: Math.floor(rng() * req.liberal.필수), 선택: Math.floor(rng() * req.liberal.선택) },
        major: { 기초: Math.floor(rng() * req.major.기초), 필수: Math.floor(rng() * req.major.필수), 선택: Math.floor(rng() * req.major.선택) },
        total: 0
      };
      earned.total = earned.liberal.필수 + earned.liberal.선택 + earned.major.기초 + earned.major.필수 + earned.major.선택;
      return earned;
    }

    function showResult(earned, major) {
      const req = getReq(major);
      resultDiv.innerHTML = `
        <p>학과: ${major}</p>
        <p>총 이수 학점: ${earned.total}/${req.total}</p>
        <p>교양필수: ${earned.liberal.필수}/${req.liberal.필수}, 교양선택: ${earned.liberal.선택}/${req.liberal.선택}</p>
        <p>전공기초: ${earned.major.기초}/${req.major.기초}, 전공필수: ${earned.major.필수}/${req.major.필수}, 전공선택: ${earned.major.선택}/${req.major.선택}</p>
      `;
    }

    checkBtn.addEventListener("click", () => {
      const sid = studentIdInput.value.trim();
      const major = majorSelect.value;
      if (!/^\d{9}$/.test(sid)) {
        Common.showMessage("학번은 숫자 9자리로 입력하세요.", "no");
        studentIdInput.focus();
        return;
      }
      if (!major) {
        Common.showMessage("학과를 선택하세요.", "no");
        majorSelect.focus();
        return;
      }

      const key = storageKey(sid, major);
      let earned = JSON.parse(localStorage.getItem(key));
      if (!earned) {
        earned = generateEarned(sid, major);
        localStorage.setItem(key, JSON.stringify(earned));
      }
      showResult(earned, major);
    });

    // form submit 방지 및 버튼 클릭 호출
    const form = document.getElementById("calcForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      checkBtn.click();
    });
  }

  document.addEventListener("DOMContentLoaded", initCalcPage);
})();
