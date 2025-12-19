// 1_calc.html에 요소가 있으면 자동으로 학번->학부/학과 표시 + 전공 셀렉트 채우기
document.addEventListener("DOMContentLoaded", () => {
  const studentIdEl = document.getElementById("studentId");
  const applyBtn = document.getElementById("applyStudentId");
  const facultyOut = document.getElementById("facultyOut");
  const majorOut = document.getElementById("majorOut");
  const majorSelect = document.getElementById("majorSelect");

  // 이 페이지에 해당 UI가 없으면 아무것도 안 함(다른 페이지 오류 방지)
  if (!majorSelect || !window.MAJORS) return;

  // 전공 셀렉트 채우기
  majorSelect.innerHTML = "";
  window.MAJORS.forEach((f) => {
    const og = document.createElement("optgroup");
    og.label = f.faculty;

    f.majors.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = `${f.faculty}||${m}`;
      opt.textContent = m;
      og.appendChild(opt);
    });

    majorSelect.appendChild(og);
  });

  function setOut(faculty, major) {
    if (facultyOut) facultyOut.textContent = faculty || "-";
    if (majorOut) majorOut.textContent = major || "-";
  }

  function applyStudent() {
    if (!studentIdEl || !window.pickMajorFromStudentId) return;
    const { faculty, major } = window.pickMajorFromStudentId(studentIdEl.value);
    setOut(faculty, major);

    // 셀렉트도 맞춰줌(있으면)
    const target = `${faculty}||${major}`;
    const opt = Array.from(majorSelect.options).find(o => o.value === target);
    if (opt) majorSelect.value = target;
  }

  // 수동 선택 시 표시도 업데이트
  majorSelect.addEventListener("change", () => {
    const [faculty, major] = (majorSelect.value || "").split("||");
    setOut(faculty, major);
  });

  applyBtn?.addEventListener("click", applyStudent);
  studentIdEl?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyStudent();
  });

  // 첫 화면 기본 출력
  if (studentIdEl && studentIdEl.value.trim()) applyStudent();
  else {
    // 기본은 첫 옵션으로 표시
    const [faculty, major] = (majorSelect.value || "").split("||");
    setOut(faculty, major);
  }
});
