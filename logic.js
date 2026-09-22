(function (global) {
  function normalizeChecklist(value, length) {
    if (!Array.isArray(value)) return Array(length).fill(false);
    return Array.from({ length: length }, function (_, index) { return value[index] === true; });
  }

  function checklistStats(value) {
    var total = value.length;
    var checked = value.filter(Boolean).length;
    return { total: total, checked: checked, percent: total ? Math.round(checked / total * 100) : 0, complete: total > 0 && checked === total };
  }

  function overallProgress(chapters, states, checklistDefinitions) {
    var completed = chapters.filter(function (chapter) {
      if (!chapter.published) return false;
      var key = chapter.id + ":final";
      var items = checklistDefinitions[key];
      if (!items || !items.length) return false;
      return checklistStats(normalizeChecklist(states[key], items.length)).complete;
    }).length;
    return { completed: completed, total: chapters.length, percent: Math.round(completed / chapters.length * 100) };
  }

  function resolveTheme(saved, systemTheme) {
    return saved === "light" || saved === "dark" ? saved : (systemTheme === "light" ? "light" : "dark");
  }

  var api = { normalizeChecklist: normalizeChecklist, checklistStats: checklistStats, overallProgress: overallProgress, resolveTheme: resolveTheme };
  global.PrintGuideLogic = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
