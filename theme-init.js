(function () {
  var key = "printGuide:v1:theme";
  var saved = null;
  try { saved = localStorage.getItem(key); } catch (error) {}
  var systemTheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  document.documentElement.dataset.theme = saved === "light" || saved === "dark" ? saved : systemTheme;
})();
