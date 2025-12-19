// WEB/3_JS/5_chatbot.js
(function(){
  "use strict";

  // ===== 데이터 수집 유틸 =====

  // 1_calc 저장 포맷 가져오기 (calc:학번|학과)
  function loadCalcAny(){
    const out = [];
    for (let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if (!k || !k.startsWith("calc:")) continue;
      try{
        out.push({
          key: k,
          val: JSON.parse(localStorage.getItem(k)),
          sidMajor: k.slice(5)
        });
      }catch(_){}
    }
    return out;
  }

  // converter 데이터: hsuk:v1:converter:학번
  function loadConvBySid(sid){
    return Common.storageGet(Common.nsKey("converter", sid), []);
  }

  // list 데이터: hsuk:v1:list:학번
  function loadListBySid(sid){
    return Common.storageGet(Common.nsKey("list", sid), []);
  }

  const GRADE = {
    "A+":4.5, "A0":4.0,
    "B+":3.5, "B0":3.0,
    "C+":2.5, "C0":2.0,
    "D+":1.5, "D0":1.0,
    "F":0.0
  };

  function calcGpa(rows){
    let cr=0, pt=0;
    rows.forEach(r=>{
      const gp = GRADE[r.grade] ?? 0;
      const c  = r.credit || 0;
      cr += c;
      pt += c * gp;
    });
    return { credits: cr, gpa: cr ? +(pt/cr).toFixed(2) : 0 };
  }

  function pct(cur,max){ return Math.min(100, Math.round((cur/max)*100) || 0); }
  function barHtml(label, cur, max){
    const P = pct(cur,max);
    return `<div style="margin:10px 0">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <strong>${label}</strong><span class="badge ${P>=100?'badge-ok':''}">${cur}/${max} (${P}%)</span>
      </div>
      <div class="progress"><div class="bar" style="--val:${P}%"></div></div>
    </div>`;
  }

  // ===== 리포트 렌더링 =====
  function renderReport(){
    const elGpa = document.getElementById("m5AllGpa");
    const elCr  = document.getElementById("m5AllCredits");
    const elPct = document.getElementById("m5GradPct");
    const m5Bars = document.getElementById("m5Bars");
    const m5MajorName = document.getElementById("m5MajorName");

    if (!elGpa || !elCr || !elPct || !m5Bars || !m5MajorName) {
      console.warn("[5_chatbot] report elements missing");
      return;
    }

    // converter 데이터에서 대표 sid 선택
    let chosenSid = null;
    for (let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if (k && k.startsWith("hsuk:v1:converter:")) {
        chosenSid = k.split(":").pop();
        break;
      }
    }
    const convRows = chosenSid ? loadConvBySid(chosenSid) : [];
    const convStat = calcGpa(convRows);

    elGpa.textContent = convStat.credits ? convStat.gpa.toFixed(2) : "-";
    elCr.textContent  = convStat.credits || "-";

    // calc 데이터 중 대표 하나
    const calcAll = loadCalcAny();
    const calcOne = calcAll[0];
    const totalReq = 120;

    let earned = { total: convStat.credits, liberal:{필수:0,선택:0}, major:{기초:0,필수:0,선택:0} };
    let majorName = "-";

    if (calcOne && calcOne.val) {
      const parts = calcOne.sidMajor.split("|");
      const sid = parts[0] || "";
      const major = parts[1] || "";
      majorName = major ? `${major} (${sid})` : sid || "-";
      earned = calcOne.val;
    }

    m5MajorName.textContent = majorName;

    const gradPct = pct(earned.total || 0, totalReq);
    elPct.textContent = gradPct + "%";

    const libEarn = (earned.liberal?.필수 || 0) + (earned.liberal?.선택 || 0);
    const majEarn = (earned.major?.기초 || 0) + (earned.major?.필수 || 0) + (earned.major?.선택 || 0);

    // 요구치는 샘플로 고정
    const libReq = { 필수:6, 선택:12 };
    const majReq = { 기초:24, 필수:36, 선택:30 };

    m5Bars.innerHTML =
      barHtml("총 이수 학점", earned.total || 0, totalReq) +
      barHtml("교양 (필수+선택)", libEarn, libReq.필수 + libReq.선택) +
      barHtml("전공 (기초+필수+선택)", majEarn, majReq.기초 + majReq.필수 + majReq.선택);
  }

  // ===== 챗봇 =====
  function appendMsg(who, text){
    const box = document.getElementById("chatBox");
    if (!box) return;
    const wrap = document.createElement("div");
    wrap.style.margin = "6px 0";
    wrap.innerHTML =
      `<div style="font-weight:600;color:${who==='me'?'#2b86c6':'#0d6b3e'}">${who==='me'?'나':'도우미'}</div>` +
      `<div>${text}</div>`;
    box.appendChild(wrap);
    box.scrollTop = box.scrollHeight;
  }

  function norm(s){ return (s||"").toString().trim().toLowerCase(); }

  function detectIntent(q){
    const s = norm(q);
    if (/(졸업|진행|남았|얼마)/.test(s)) return "grad_progress";
    if (/(평균|gpa|학점|몇 점)/.test(s)) return "overall_gpa";
    if (/(전공|교양|부족|필수|선택)/.test(s)) return "req_breakdown";
    if (/(과목|리스트|목록)/.test(s)) return "list_courses";
    return "fallback";
  }

  function answer(intent){
    // 대표 sid
    let sid = null;
    for (let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if (k && k.startsWith("hsuk:v1:converter:")) {
        sid = k.split(":").pop();
        break;
      }
    }
    const rows = sid ? loadConvBySid(sid) : [];
    const stat = calcGpa(rows);

    const calcAll = loadCalcAny();
    const calcOne = calcAll[0];
    const earned = calcOne?.val || {total:0,liberal:{필수:0,선택:0},major:{기초:0,필수:0,선택:0}};
    const totalReq = 120;

    switch(intent){
      case "grad_progress": {
        const remain = Math.max(0, totalReq - (earned.total || 0));
        if (remain === 0) return "축하해요! 총 이수 120학점을 충족했습니다. 🎓";
        return `총 이수 ${earned.total || 0}/${totalReq} 입니다. 졸업까지 ${remain}학점 남았어요.`;
      }
      case "overall_gpa": {
        if (!stat.credits) return "아직 성적 변환(3_converter)에 과목이 없어서 평균을 계산할 수 없어요.";
        return `현재 누적 평균은 약 ${stat.gpa.toFixed(2)}점이며, 총 ${stat.credits}학점을 이수했어요.`;
      }
      case "req_breakdown": {
        const lib = (earned.liberal?.필수 || 0) + (earned.liberal?.선택 || 0);
        const maj = (earned.major?.기초 || 0) + (earned.major?.필수 || 0) + (earned.major?.선택 || 0);
        return `교양 이수 ${lib}학점, 전공 이수 ${maj}학점으로 확인돼요. 세부는 교양(필수 ${earned.liberal?.필수 || 0} / 선택 ${earned.liberal?.선택 || 0}), 전공(기초 ${earned.major?.기초 || 0} / 필수 ${earned.major?.필수 || 0} / 선택 ${earned.major?.선택 || 0}) 입니다.`;
      }
      case "list_courses": {
        if (!rows.length) return "과목 데이터가 없어요. 3_converter에서 과목을 추가해보세요!";
        const head = `총 ${rows.length}과목:<br>`;
        const body = rows.slice(0, 6).map(r =>
          `- ${r.term} ${r.name} (${r.credit}학점, ${r.grade || "성적없음"})`
        ).join("<br>");
        const tail = rows.length > 6 ? `<br>...외 ${rows.length - 6}과목` : "";
        return head + body + tail;
      }
      default:
        return "다음처럼 물어보세요: “졸업까지 얼마나 남았어?”, “내 평균 몇 점이야?”, “전공·교양은 얼마나 채웠어?”, “과목 목록 보여줘”.";
    }
  }

  function initChat(){
    const input = document.getElementById("chatInput");
    const btn   = document.getElementById("chatSend");
    if (!input || !btn) return;

    function send(){
      const q = input.value.trim();
      if (!q) return;
      appendMsg("me", q);
      const intent = detectIntent(q);
      const a = answer(intent);
      appendMsg("bot", a);
      input.value = "";
      input.focus();
    }

    btn.addEventListener("click", send);
    input.addEventListener("keydown", (e)=>{ if(e.key === "Enter") send(); });

    appendMsg("bot", "안녕하세요! 한세대 학점 도우미입니다. “졸업까지 얼마나 남았어?”, “내 평균 몇 점이야?”처럼 물어보세요.");
  }

  function initMenu5(){
    console.log("[5_chatbot] initMenu5"); // ✅ 디버깅용
    renderReport();
    initChat();
  }

  // ✅ 핵심 수정: data-page="5_chatbot" 과 동일해야 Common이 이 페이지에서 init 호출함
  if (window.Common && typeof Common.register === "function") {
    Common.register("5_chatbot", initMenu5);
  } else {
    document.addEventListener("DOMContentLoaded", initMenu5);
  }
})();
