// menu4 전용 스크립트
document.addEventListener("DOMContentLoaded", () => {
  // 네비게이션 바 활성화 처리
  const currentPage = window.location.pathname.split("/").pop();
  const navLinks = document.querySelectorAll(".navbar a");

  navLinks.forEach(link => {
    if (link.getAttribute("href").includes(currentPage)) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  console.log("Menu4 페이지 로드 완료");
});
