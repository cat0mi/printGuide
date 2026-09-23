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

  function chapterProgress(chapterId, states, checklistDefinitions) {
    var keys = Object.keys(checklistDefinitions).filter(function (key) { return key.indexOf(chapterId + ":") === 0; });
    var completed = 0;
    var total = 0;
    keys.forEach(function (key) {
      var length = checklistDefinitions[key].length;
      var stats = checklistStats(normalizeChecklist(states[key], length));
      completed += stats.checked;
      total += stats.total;
    });
    return { completed: completed, total: total, percentage: total ? Math.round(completed / total * 100) : 0 };
  }

  function chapterStatus(chapter, states, checklistDefinitions) {
    if (!chapter || !chapter.published) return "development";
    var progress = chapterProgress(chapter.id, states, checklistDefinitions);
    if (progress.completed === 0) return "not-started";
    if (progress.total > 0 && progress.completed === progress.total) return "completed";
    return "in-progress";
  }

  function overallProgress(chapters, states, checklistDefinitions) {
    var available = chapters.filter(function (chapter) { return chapter.published; });
    var completedChapters = 0;
    var completedItems = 0;
    var totalItems = 0;
    available.forEach(function (chapter) {
      var progress = chapterProgress(chapter.id, states, checklistDefinitions);
      completedItems += progress.completed;
      totalItems += progress.total;
      if (progress.total > 0 && progress.completed === progress.total) completedChapters += 1;
    });
    return {
      completed: completedChapters,
      total: available.length,
      completedItems: completedItems,
      totalItems: totalItems,
      exactPercent: totalItems ? completedItems / totalItems * 100 : 0,
      percent: totalItems ? Math.round(completedItems / totalItems * 100) : 0
    };
  }

  function resolveTheme(saved, systemTheme) {
    return saved === "light" || saved === "dark" ? saved : (systemTheme === "light" ? "light" : "dark");
  }

  var api = { normalizeChecklist: normalizeChecklist, checklistStats: checklistStats, chapterProgress: chapterProgress, chapterStatus: chapterStatus, overallProgress: overallProgress, resolveTheme: resolveTheme };
  global.PrintGuideLogic = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
