// WEB/3_JS/4-1_rate.js
(function () {
  "use strict";

  const PAGE_ID = "4-1_rate";

  // ✅ 표시 이름 고정 요구사항
  const FIXED_USER_LABEL = "한세대 학생OOO";
  const FIXED_TERM_LABEL = "2025년도 2학기";

  // ✅ localStorage 키
  const STORAGE_KEY = "Hansei_Lecture_Reviews_v1";

  function initRatePage() {
    console.log("[4-1_rate] initRatePage called");

    // 1) 데이터 객체 확인
    if (!window.EVAL_DATA) {
      console.warn("[4-1_rate] EVAL_DATA is missing. Check 4-2_eval_data.js load order.");
      return;
    }
    const { allSust, allMajor, allLecture, allDiv, allArea } = window.EVAL_DATA;

    // 2) DOM 요소
    const facultySelect = document.getElementById("facultySelect");
    const majorSelect   = document.getElementById("majorSelect");
    const lectureSelect = document.getElementById("lectureSelect");
    const evalResult    = document.getElementById("evalResult");
    const newEvalBtn    = document.getElementById("newEvalBtn"); // 있으면 활용(없어도 OK)

    const elements = { facultySelect, majorSelect, lectureSelect, evalResult, newEvalBtn };
    console.log("[4-1_rate] elements", elements);

    if (!facultySelect || !majorSelect || !lectureSelect || !evalResult) {
      console.warn("[4-1_rate] required elements missing. Check IDs and HTML structure.");
      return;
    }

    // ---------- 공통 유틸 ----------
    function resetSelect(select, placeholder, disabled) {
      select.innerHTML = "";
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = placeholder;
      select.appendChild(opt);
      select.disabled = !!disabled;
    }

    function escapeHtml(str) {
      return String(str ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function readStore() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        return {};
      }
    }

    function writeStore(storeObj) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storeObj));
    }

    function getReviews(lectureCode) {
      const store = readStore();
      const list = store[lectureCode];
      return Array.isArray(list) ? list : [];
    }

    function addReview(lectureCode, review) {
      const store = readStore();
      const list = Array.isArray(store[lectureCode]) ? store[lectureCode] : [];
      list.unshift(review); // 최신순
      store[lectureCode] = list;
      writeStore(store);
    }

    function deleteReview(lectureCode, reviewId) {
      const store = readStore();
      const list = Array.isArray(store[lectureCode]) ? store[lectureCode] : [];
      store[lectureCode] = list.filter(r => r.id !== reviewId);
      writeStore(store);
    }

    function avgRating(list) {
      if (!list.length) return null;
      const sum = list.reduce((a, r) => a + (Number(r.rating) || 0), 0);
      return sum / list.length;
    }

    function stars(n) {
      const v = Math.max(0, Math.min(5, Math.round(n)));
      return "★★★★★".slice(0, v) + "☆☆☆☆☆".slice(0, 5 - v);
    }

    // ---------- 셀렉트 채우기 ----------
    function fillFacultySelect() {
      resetSelect(facultySelect, "전체 학부", false);
      allSust.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.nvalue;
        opt.textContent = s.description;
        facultySelect.appendChild(opt);
      });
    }

    function fillMajorSelect(selectedSustCd) {
      resetSelect(
        majorSelect,
        selectedSustCd ? "전체 전공" : "학부를 먼저 선택하세요",
        !selectedSustCd
      );
      resetSelect(lectureSelect, "전공을 먼저 선택하세요", true);

      if (!selectedSustCd) return;

      const majors = allMajor.filter(m => m.sust_cd === selectedSustCd);
      majors.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.nvalue;
        opt.textContent = m.description;
        majorSelect.appendChild(opt);
      });

      majorSelect.disabled = false;
    }

    function fillLectureSelect(selectedMajorCd) {
      resetSelect(
        lectureSelect,
        selectedMajorCd ? "과목 선택" : "전공을 먼저 선택하세요",
        !selectedMajorCd
      );

      if (!selectedMajorCd) return;

      const lectures = allLecture.filter(l => l.major_cd === selectedMajorCd);
      lectures.forEach(l => {
        const opt = document.createElement("option");
        opt.value = l.nvalue;
        opt.textContent = l.description;
        lectureSelect.appendChild(opt);
      });

      lectureSelect.disabled = false;
    }

    // ---------- 강의평 UI 렌더 ----------
    function renderReviewSection(lectureCode) {
      const wrapper = document.createElement("section");
      wrapper.className = "review-section";

      const list = getReviews(lectureCode);
      const avg = avgRating(list);

      // 헤더(평균/개수)
      const head = document.createElement("div");
      head.className = "review-head";
      head.innerHTML = `
        <h3 class="review-title">강의평 남기기</h3>
        <div class="review-meta">
          <span>총 <b>${list.length}</b>개</span>
          <span style="margin-left:10px">평균 <b>${avg == null ? "-" : avg.toFixed(1)}</b> (${avg == null ? "☆☆☆☆☆" : stars(avg)})</span>
        </div>
      `;

      // 작성 폼
      const form = document.createElement("form");
      form.className = "review-form";
      form.innerHTML = `
        <div class="review-row">
          <label class="review-label">표시 방식</label>
          <div class="review-choice">
            <label><input type="radio" name="displayMode" value="anon" checked> 익명</label>
            <label style="margin-left:12px">
              <input type="radio" name="displayMode" value="id">
              <span>${escapeHtml(FIXED_USER_LABEL)}</span>
              <span style="opacity:.7; margin-left:6px">${escapeHtml(FIXED_TERM_LABEL)}</span>
            </label>
          </div>
        </div>

        <div class="review-row">
          <label class="review-label" for="ratingSel">별점</label>
          <select id="ratingSel" class="review-input">
            <option value="5">5 (최고)</option>
            <option value="4">4</option>
            <option value="3">3</option>
            <option value="2">2</option>
            <option value="1">1 (별로)</option>
          </select>
        </div>

        <div class="review-row">
          <label class="review-label" for="commentTa">한줄평</label>
          <textarea id="commentTa" class="review-textarea" rows="3" placeholder="예) 과제 적고 설명 깔끔해서 좋았어요!"></textarea>
        </div>

        <div class="review-actions">
          <button type="submit" class="review-btn">등록</button>
          <button type="button" class="review-btn ghost" id="clearMyFormBtn">비우기</button>
        </div>
      `;

      // 리스트
      const listBox = document.createElement("div");
      listBox.className = "review-list";

      function renderList() {
        const cur = getReviews(lectureCode);
        listBox.innerHTML = "";

        if (!cur.length) {
          const p = document.createElement("p");
          p.className = "placeholder";
          p.textContent = "아직 등록된 강의평이 없습니다. 첫 리뷰를 남겨보세요!";
          listBox.appendChild(p);
          return;
        }

        cur.forEach((r) => {
          const who = (r.mode === "id")
            ? `${FIXED_USER_LABEL} · ${FIXED_TERM_LABEL}`
            : "익명";

          const item = document.createElement("article");
          item.className = "review-item";
          item.innerHTML = `
            <div class="review-item-top">
              <div class="review-who">
                <b>${escapeHtml(who)}</b>
                <span class="review-date">${escapeHtml(new Date(r.createdAt).toLocaleString())}</span>
              </div>
              <div class="review-rating">${stars(r.rating)} <span class="review-rating-num">${Number(r.rating).toFixed(1)}</span></div>
            </div>
            <p class="review-comment">${escapeHtml(r.comment)}</p>
            <div class="review-item-actions">
              <button type="button" class="review-del" data-id="${escapeHtml(r.id)}">삭제</button>
            </div>
          `;
          listBox.appendChild(item);
        });

        // 삭제 이벤트(위임)
        listBox.querySelectorAll(".review-del").forEach(btn => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            deleteReview(lectureCode, id);
            // 헤더 숫자 갱신까지 위해 전체 섹션 다시 렌더
            rerenderReviewOnly();
          });
        });
      }

      function rerenderReviewOnly() {
        // wrapper 내 내용 갱신: meta + list 다시
        const newList = getReviews(lectureCode);
        const newAvg = avgRating(newList);
        head.querySelector(".review-meta").innerHTML = `
          <span>총 <b>${newList.length}</b>개</span>
          <span style="margin-left:10px">평균 <b>${newAvg == null ? "-" : newAvg.toFixed(1)}</b> (${newAvg == null ? "☆☆☆☆☆" : stars(newAvg)})</span>
        `;
        renderList();
      }

      // 폼 이벤트
      form.addEventListener("submit", (e) => {
        e.preventDefault();

        const mode = form.querySelector('input[name="displayMode"]:checked')?.value || "anon";
        const rating = Number(form.querySelector("#ratingSel")?.value || 5);
        const comment = (form.querySelector("#commentTa")?.value || "").trim();

        if (!comment) {
          alert("한줄평을 입력해 주세요!");
          form.querySelector("#commentTa")?.focus();
          return;
        }

        const safeRating = Math.max(1, Math.min(5, rating));

        addReview(lectureCode, {
          id: String(Date.now()) + "_" + Math.random().toString(16).slice(2),
          mode,
          rating: safeRating,
          comment,
          createdAt: new Date().toISOString()
        });

        form.querySelector("#commentTa").value = "";
        form.querySelector("#ratingSel").value = "5";
        form.querySelector('input[value="anon"]').checked = true;

        rerenderReviewOnly();
      });

      form.querySelector("#clearMyFormBtn")?.addEventListener("click", () => {
        form.querySelector("#commentTa").value = "";
        form.querySelector("#ratingSel").value = "5";
        form.querySelector('input[value="anon"]').checked = true;
      });

      wrapper.appendChild(head);
      wrapper.appendChild(form);
      wrapper.appendChild(listBox);

      renderList();
      return wrapper;
    }

    // ---------- 상단 카드(강의 정보) + 리뷰 섹션 ----------
    function renderLectureInfo(lectureCode) {
      evalResult.innerHTML = "";

      if (!lectureCode) {
        const p = document.createElement("p");
        p.className = "placeholder";
        p.textContent = "과목을 선택하면 강의 정보와 강의평 작성 영역이 나타납니다.";
        evalResult.appendChild(p);
        return;
      }

      const lec = allLecture.find(l => l.nvalue === lectureCode);
      if (!lec) {
        const p = document.createElement("p");
        p.className = "placeholder";
        p.textContent = "선택한 과목 정보를 찾을 수 없습니다.";
        evalResult.appendChild(p);
        return;
      }

      const divInfo  = allDiv.find(d => d.nvalue === lec.div_cd);
      const areaInfo = allArea.find(a => a.nvalue === lec.area_cd);

      // 평균 별점은 실제 저장된 리뷰로 계산(없으면 5.0 데모)
      const list = getReviews(lectureCode);
      const avg = avgRating(list);
      const shownAvg = avg == null ? 5.0 : avg;

      const card = document.createElement("article");
      card.className = "eval-card";

      card.innerHTML = `
        <header class="eval-card-header">
          <div>
            <h2 class="lecture-title">${lec.description}</h2>
            <p class="lecture-meta">
              과목 코드 ${lec.nvalue} ·
              이수구분 ${divInfo ? divInfo.description : "정보 없음"} ·
              영역 ${areaInfo ? areaInfo.description : "해당 없음"}
            </p>
          </div>
          <div class="eval-score">
            <span class="stars">${stars(shownAvg)}</span>
            <span class="score-value">${shownAvg.toFixed(1)}</span>
          </div>
        </header>

        <p class="eval-comment">
          아래에서 강의평을 작성하고 저장할 수 있어요. (저장 위치: 브라우저 localStorage)
        </p>
      `;

      evalResult.appendChild(card);

      // ✅ 강의평 작성/리스트 섹션 추가
      const reviewSection = renderReviewSection(lectureCode);
      evalResult.appendChild(reviewSection);

      // (옵션) newEvalBtn이 있으면 작성칸으로 포커스
      if (newEvalBtn) {
        newEvalBtn.onclick = () => {
          const ta = evalResult.querySelector("#commentTa");
          ta?.focus();
          ta?.scrollIntoView({ behavior: "smooth", block: "center" });
        };
      }
    }

    // ---------- 이벤트 ----------
    facultySelect.addEventListener("change", function () {
      const sustCd = this.value;
      fillMajorSelect(sustCd);
      renderLectureInfo("");
    });

    majorSelect.addEventListener("change", function () {
      const majorCd = this.value;
      fillLectureSelect(majorCd);
      renderLectureInfo("");
    });

    lectureSelect.addEventListener("change", function () {
      const lecCode = this.value;
      renderLectureInfo(lecCode);
    });

    // ---------- 초기 ----------
    fillFacultySelect();
    renderLectureInfo("");

    console.log("[4-1_rate] init complete");
  }

  // Common.register 또는 DOMContentLoaded
  if (window.Common && typeof window.Common.register === "function") {
    window.Common.register(PAGE_ID, initRatePage);
  } else {
    document.addEventListener("DOMContentLoaded", initRatePage);
  }
})();
