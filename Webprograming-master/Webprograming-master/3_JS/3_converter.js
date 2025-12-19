// WEB/3_JS/3_converter.js
(function () {
  "use strict";

<<<<<<< HEAD
  function initConverterPage1() {
    const gradePoints = { "A+": 4.5, "A0": 4.0, "B+": 3.5, "B0": 3.0, "C+": 2.5, "C0": 2.0, "D+": 1.5, "D0": 1.0, "F": 0.0 };
    const addCourseBtn = document.getElementById("addCourseBtn");
    const tbody = document.querySelector("#convTable tbody");
    const gpaResult = document.getElementById("gpaResult");
    const clearAll = document.getElementById("clearAll");
    const saveBtn = document.getElementById("saveBtn");
    const loadBtn = document.getElementById("loadBtn");
    const sidInput = document.getElementById("studentId");
    if (!addCourseBtn || !tbody || !gpaResult || !clearAll || !saveBtn || !loadBtn || !sidInput) return;
=======
  function initConverterPage() {
    console.log("[3_converter] initConverterPage called");

    const gradePoints = {
      "A+": 4.5, "A0": 4.0,
      "B+": 3.5, "B0": 3.0,
      "C+": 2.5, "C0": 2.0,
      "D+": 1.5, "D0": 1.0,
      "F": 0.0
    };

    const addCourseBtn   = document.getElementById("addCourseBtn");
    const tbody          = document.querySelector("#convTable tbody");
    const gpaResult      = document.getElementById("gpaResult");
    const clearAll       = document.getElementById("clearAll");
    const saveBtn        = document.getElementById("saveBtn");
    const loadBtn        = document.getElementById("loadBtn");
    const sidInput       = document.getElementById("studentId");
    const nameInput      = document.getElementById("courseName");
    const creditInput    = document.getElementById("courseCredit");
    const gradeSelect    = document.getElementById("courseGrade");
    const termInput      = document.getElementById("courseTerm");
    const elSubjectCount = document.getElementById("convSubjectCount");
    const elTotalCredits = document.getElementById("convTotalCredits");
    const elGpa          = document.getElementById("convGpa");

    if (!addCourseBtn || !tbody || !gpaResult || !clearAll || !saveBtn || !loadBtn || !sidInput ||
        !nameInput || !creditInput || !gradeSelect || !termInput ||
        !elSubjectCount || !elTotalCredits || !elGpa) {
      console.warn("[3_converter] required elements missing");
      return;
    }
>>>>>>> 09fb237 (Upload)

    let convCourses = [];

    function clearInputs() {
      nameInput.value = "";
      creditInput.value = "";
      gradeSelect.value = "";
      termInput.value = "";
      nameInput.focus();
    }

    function render() {
      tbody.innerHTML = "";
      convCourses.forEach((c, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML =
          `<td>${c.name}</td>` +
          `<td>${c.credit}</td>` +
          `<td>${c.grade}</td>` +
          `<td>${c.term}</td>` +
          `<td><button class="del" data-i="${i}" type="button">삭제</button></td>`;
        tbody.appendChild(tr);
      });
      updateSummary();
    }

    tbody.addEventListener("click", (e) => {
      const btn = e.target.closest(".del");
      if (!btn) return;
      const i = Number(btn.dataset.i);
      if (!Number.isInteger(i)) return;
      convCourses.splice(i, 1);
      render();
      calcGPA();
    });

    function calcGPA() {
      let totalCredits = 0, totalPoints = 0;
      convCourses.forEach(c => {
        totalCredits += c.credit;
        totalPoints  += c.credit * (gradePoints[c.grade] ?? 0);
      });
      const gpa = totalCredits ? (totalPoints / totalCredits).toFixed(2) : "-";
      gpaResult.innerText = `평균 평점: ${gpa}`;
      elGpa.textContent = gpa;
    }

    function updateSummary() {
      const count = convCourses.length;
      const totalCredits = convCourses.reduce((sum, c) => sum + (c.credit || 0), 0);
      elSubjectCount.textContent = count || "-";
      elTotalCredits.textContent = totalCredits || "-";
    }

    function validCredit(v) {
      const n = Number(v);
      return Number.isInteger(n) && n > 0;
    }

    addCourseBtn.addEventListener("click", () => {
      const name  = (nameInput.value || "").trim();
      const credit = Number(creditInput.value);
      const grade  = (gradeSelect.value || "").trim();
      const term   = (termInput.value || "").trim();
      if (!name || !validCredit(credit) || !(grade in gradePoints) || !term) {
        Common.showMessage("모든 필드를 올바르게 입력해주세요.", "warn");
        return;
      }
      convCourses.push({ name, credit, grade, term });
      clearInputs();
      render();
      calcGPA();
    });

    saveBtn.addEventListener("click", () => {
      const sid = (sidInput.value || "").trim();
      if (!/^\d{9}$/.test(sid)) {
        Common.showMessage("학번은 9자리 숫자여야 합니다.", "warn");
        return;
      }
      Common.storageSet(Common.nsKey("converter", sid), convCourses);
      Common.showMessage("저장 완료", "ok");
    });

    loadBtn.addEventListener("click", () => {
      const sid = (sidInput.value || "").trim();
      if (!/^\d{9}$/.test(sid)) {
        Common.showMessage("학번은 9자리 숫자여야 합니다.", "warn");
        return;
      }
      const data = Common.storageGet(Common.nsKey("converter", sid), []);
      convCourses = Array.isArray(data) ? data : [];
      render();
      calcGPA();
      Common.showMessage("불러오기 완료", "ok");
    });

    clearAll.addEventListener("click", () => {
      convCourses = [];
      render();
      calcGPA();
    });
  }

  if (window.Common && typeof Common.register === "function") {
    Common.register("3_converter", initConverterPage);
  } else {
    document.addEventListener("DOMContentLoaded", initConverterPage);
  }
})();
