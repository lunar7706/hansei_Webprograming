// WEB/3_JS/2_list.js
(function () {
  "use strict";

  const PAGE_ID = "2_list";

  // ----- 유틸: 문자열 기반 시드 난수 -----
  function seededRandomIndex(seed, length) {
    if (length <= 0) return 0;
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return h % length;
  }

  // 배열에서 "seed" 기반으로 중복 없이 여러 개 뽑기
  function pickSome(arr, count, seed) {
    const result = [];
    if (!arr || arr.length === 0 || count <= 0) return result;

    const used = new Set();
    const len = arr.length;
    let i = 0;

    while (result.length < count && result.length < len && i < len * 2) {
      const idx = seededRandomIndex(seed + "#" + i, len);
      if (!used.has(idx)) {
        used.add(idx);
        result.push(arr[idx]);
      }
      i++;
    }
    return result;
  }

  // 과목별 학점 가정
  function getCredit(lec) {
    if (!lec) return 0;
    if (lec.div_cd === "COC019013") return 1; // 채플
    return 3;
  }

  // ✅ 표시용 학부명 보정 (원하는 규칙 반영)
  function normalizeFacultyName(name) {
    const n = (name || "").trim();
    // 신학과가 학부처럼 뜨는 경우만 확실하게 보정
    if (n === "신학과") return "신학부";
    return n || "-";
  }

  function isITorDesignFaculty(facultyName) {
    const n = (facultyName || "");
    return n.includes("IT학부") || n.includes("디자인학부");
  }

  // ----- 핵심 로직: 학번 → 학부/전공/학년 + 수강 내역 생성 -----
  function buildFakeRecord(studentId, allSust, allMajor, allLecture, allDiv, allArea) {
    // 1) 학부 선택
    const sustIndex = seededRandomIndex(studentId, allSust.length);
    const sust = allSust[sustIndex];

    // 2) 해당 학부 전공 중 하나 선택(필터 결과 없으면 전체에서)
    const majorsOfSust = allMajor.filter(m => m.sust_cd === sust.nvalue);
    const majorCandidateList = majorsOfSust.length ? majorsOfSust : allMajor;
    const majorIndex = seededRandomIndex(studentId + "M", majorCandidateList.length);
    const major = majorCandidateList[majorIndex];

    // 3) 학년 (1~4학년)
    const year = 1 + seededRandomIndex(studentId + "Y", 4);

    // ✅ 표시용 학부/전공 이름 결정 (여기가 핵심)
    const facultyDisplay = normalizeFacultyName(sust.description);

    // 1학년 + (IT학부 or 디자인학부)면: 학부=전공=학부명
    // 그 외는: 전공=데이터의 major.description
    const majorDisplay =
      (year === 1 && isITorDesignFaculty(facultyDisplay))
        ? facultyDisplay
        : ((major && major.description) ? major.description : "-");

    // 4) 전공 과목 후보 (우선 전공 코드 기준, 없으면 학부 코드 기준)
    const majorLecturesAll = allLecture.filter(l => l.major_cd === major.nvalue);
    const fallbackMajorLectures = allLecture.filter(l => l.sust_cd === sust.nvalue);
    const poolMajors = majorLecturesAll.length ? majorLecturesAll : fallbackMajorLectures;

    // 학년별 기본 전공 과목 수
    let desiredMajorCount;
    if (year === 1) desiredMajorCount = 3;
    else if (year === 2) desiredMajorCount = 4;
    else if (year === 3) desiredMajorCount = 5;
    else desiredMajorCount = 6;

    let majorLectures = pickSome(poolMajors, desiredMajorCount, studentId + "MJ");

    // ----- IT학부 1학년 특수 규칙 -----
    const isIT =
      (facultyDisplay && facultyDisplay.includes("IT")) ||
      (majorDisplay && majorDisplay.includes("IT")) ||
      (major.description && major.description.includes("IT"));

    if (year === 1 && isIT && poolMajors.length > 0) {
      const mustNames = ["융합보안개론", "컴퓨터개론", "웹프로그래밍"];
      const extra = [];

      mustNames.forEach(name => {
        const found = poolMajors.find(l => l.description === name);
        if (found && !majorLectures.includes(found)) extra.push(found);
      });

      if (extra.length > 0) majorLectures = extra.concat(majorLectures);

      const maxMajor = Math.max(desiredMajorCount, extra.length + 1);
      if (majorLectures.length > maxMajor) majorLectures = majorLectures.slice(0, maxMajor);
    }

    // 5) 교양 / 채플 후보
    const geRequired = allLecture.filter(l => l.div_cd === "COC019001"); // 교양필수
    const geSelect   = allLecture.filter(l => l.div_cd === "COC019002"); // 교양선택
    const chapel     = allLecture.filter(l => l.div_cd === "COC019013"); // 채플

    let geReqCount = 0, geSelCount = 0, chapelCount = 0;

    if (year === 1 || year === 2) {
      geReqCount = Math.min(3, geRequired.length);
      geSelCount = 2;
      chapelCount = Math.min(1, chapel.length);
    } else if (year === 3) {
      geReqCount = Math.min(1, geRequired.length);
      geSelCount = 2;
      chapelCount = Math.min(1, chapel.length);
    } else {
      geReqCount = 0;
      geSelCount = 2;
      chapelCount = 0;
    }

    const geReqLectures  = pickSome(geRequired, geReqCount, studentId + "GR");
    const geSelLectures  = pickSome(geSelect, geSelCount, studentId + "GS");
    const chapelLectures = pickSome(chapel, chapelCount, studentId + "CH");

    // 6) 전체 수강 리스트
    const taken = [];
    majorLectures.forEach(l => taken.push({ type: "전공", lecture: l }));
    geReqLectures.forEach(l => taken.push({ type: "교양필수", lecture: l }));
    geSelLectures.forEach(l => taken.push({ type: "교양선택", lecture: l }));
    chapelLectures.forEach(l => taken.push({ type: "채플", lecture: l }));

    // 7) 학점 합계
    const summary = taken.reduce(
      (acc, item) => {
        const c = getCredit(item.lecture);
        acc[item.type] = (acc[item.type] || 0) + c;
        acc.total = (acc.total || 0) + c;
        return acc;
      },
      { total: 0 }
    );

    return {
      studentId,
      year,
      sust,
      major,
      taken,
      summary,

      // ✅ 화면 표시 전용 (여기만 쓰면 됨)
      facultyDisplay,
      majorDisplay
    };
  }

  // ----- 렌더링 -----
  function renderRecord(record, allDiv, allArea, dom) {
    const { infoBox, tableBody, summaryBox } = dom;

    infoBox.innerHTML = `
      <h2>학생 정보 (시뮬레이션)</h2>
      <p><strong>학번</strong> : ${record.studentId}</p>
      <p><strong>학년</strong> : ${record.year}학년</p>
      <p><strong>학부</strong> : ${record.facultyDisplay}</p>
      <p><strong>전공</strong> : ${record.majorDisplay}</p>
      <p class="info-note">
        ※ 실제 학교 데이터가 아니라, 랜덤 시뮬레이션입니다.
      </p>
    `;

    if (!record.taken.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="empty">생성된 수강 내역이 없습니다.</td>
        </tr>
      `;
    } else {
      const rows = record.taken.map((item) => {
        const lec  = item.lecture;
        const div  = allDiv.find(d => d.nvalue === lec.div_cd);
        const area = allArea.find(a => a.nvalue === lec.area_cd);
        const credit = getCredit(lec);

        return `
          <tr>
            <td>${item.type}</td>
            <td>${div ? div.description : "-"}</td>
            <td>${area ? area.description : "-"}</td>
            <td>${lec.nvalue}</td>
            <td class="text-left">${lec.description}</td>
            <td>${credit}</td>
          </tr>
        `;
      });

      tableBody.innerHTML = rows.join("");
    }

    summaryBox.innerHTML = `
      <h3>이수 학점 합계 (2025학년도 2학기 기준)</h3>
      <ul>
        <li>전공: ${record.summary["전공"] || 0} 학점</li>
        <li>교양필수: ${record.summary["교양필수"] || 0} 학점</li>
        <li>교양선택: ${record.summary["교양선택"] || 0} 학점</li>
        <li>채플: ${record.summary["채플"] || 0} 학점</li>
        <li><strong>총합: ${record.summary.total || 0} 학점</strong></li>
      </ul>
    `;
  }

  // ----- 페이지 초기화 -----
  function init2ListPage() {
    console.log("[2_list] init2ListPage called");

    if (!window.EVAL_DATA) {
      console.warn("[2_list] EVAL_DATA is missing. Check 4-2_eval_data.js load order.");
      return;
    }

    const { allSust, allMajor, allLecture, allDiv, allArea } = window.EVAL_DATA;

    const studentForm    = document.getElementById("studentForm");
    const studentIdInput = document.getElementById("studentIdInput");
    const infoBox        = document.getElementById("studentInfo");
    const tableBody      = document.getElementById("takenListBody");
    const summaryBox     = document.getElementById("takenSummary");

    if (!studentForm || !studentIdInput || !infoBox || !tableBody || !summaryBox) {
      console.warn("[2_list] required elements missing. Check 2_list.html structure.");
      return;
    }

    studentForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const sid = (studentIdInput.value || "").trim();

      if (!sid) {
        alert("학번을 입력해 주세요.");
        studentIdInput.focus();
        return;
      }

      const record = buildFakeRecord(sid, allSust, allMajor, allLecture, allDiv, allArea);
      renderRecord(record, allDiv, allArea, { infoBox, tableBody, summaryBox });
    });

    console.log("[2_list] init complete");
  }

  if (window.Common && typeof Common.register === "function") {
    Common.register(PAGE_ID, init2ListPage);
  } else {
    document.addEventListener("DOMContentLoaded", init2ListPage);
  }
})();
