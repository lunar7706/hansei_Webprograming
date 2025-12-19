(function(){
  const KEY = "theme";
  const root = document.documentElement;

  function apply(t){
    root.setAttribute("data-theme", t);
    localStorage.setItem(KEY, t);
  }

  const saved = localStorage.getItem(KEY);
  if (saved) apply(saved);

  window.toggleTheme = function(){
    const cur = root.getAttribute("data-theme") || "dark";
    apply(cur === "dark" ? "light" : "dark");
  };
})();
