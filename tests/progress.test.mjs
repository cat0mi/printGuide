import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const logic = require("../logic.js");
const chapters = [
  { id: "chapter-1", published: true },
  { id: "chapter-2", published: true },
  { id: "chapter-3", published: false },
  { id: "chapter-4", published: false },
  { id: "chapter-5", published: false },
  { id: "chapter-6", published: false },
  { id: "chapter-7", published: false },
  { id: "chapter-8", published: false },
  { id: "chapter-9", published: false }
];
const definitions = {
  "chapter-1:quick": ["a", "b"], "chapter-1:final": ["c", "d"],
  "chapter-2:quick": ["a"], "chapter-2:final": ["b"]
};

test("первый запуск начинается с нулевого прогресса", () => {
  assert.deepEqual(logic.normalizeChecklist(null, 3), [false, false, false]);
  assert.deepEqual(logic.chapterProgress("chapter-1", {}, definitions), { completed: 0, total: 4, percentage: 0 });
  assert.equal(logic.chapterStatus(chapters[0], {}, definitions), "not-started");
});

test("один пункт обновляет счётчик, но не завершает главу", () => {
  assert.deepEqual(logic.checklistStats([true, false]), { checked: 1, total: 2, percent: 50, complete: false });
});

test("частичный прогресс даёт статус В процессе", () => {
  var state = { "chapter-1:quick": [true, false], "chapter-1:final": [false, false] };
  assert.deepEqual(logic.chapterProgress("chapter-1", state, definitions), { completed: 1, total: 4, percentage: 25 });
  assert.equal(logic.chapterStatus(chapters[0], state, definitions), "in-progress");
});

test("одного полного чек-листа недостаточно для завершения главы", () => {
  var state = { "chapter-1:quick": [true, true], "chapter-1:final": [false, false] };
  assert.equal(logic.chapterStatus(chapters[0], state, definitions), "in-progress");
});

test("все чек-листы дают статус Пройдено", () => {
  var state = { "chapter-1:quick": [true, true], "chapter-1:final": [true, true] };
  assert.equal(logic.chapterStatus(chapters[0], state, definitions), "completed");
  state["chapter-1:final"][0] = false;
  assert.equal(logic.chapterStatus(chapters[0], state, definitions), "in-progress");
});

test("главы в разработке всегда сохраняют свой статус", () => {
  assert.equal(logic.chapterStatus(chapters[2], { "chapter-3:final": [true] }, { "chapter-3:final": ["a"] }), "development");
});

test("общий прогресс считается по пунктам только опубликованных глав", () => {
  var state = {
    "chapter-1:quick": [true, true], "chapter-1:final": [true, true],
    "chapter-2:quick": [true], "chapter-2:final": [false],
    "chapter-3:final": [true]
  };
  assert.deepEqual(logic.overallProgress(chapters, state, definitions), {
    completed: 1, total: 2, completedItems: 5, totalItems: 6, exactPercent: 83.33333333333334, percent: 83
  });
});

test("повреждённые и устаревшие данные безопасно нормализуются", () => {
  assert.deepEqual(logic.normalizeChecklist("broken", 2), [false, false]);
  assert.deepEqual(logic.normalizeChecklist([true, "true", true], 2), [true, false]);
});

test("сохранённая тема важнее системной", () => {
  assert.equal(logic.resolveTheme("dark", "light"), "dark");
  assert.equal(logic.resolveTheme(null, "light"), "light");
  assert.equal(logic.resolveTheme("unknown", "dark"), "dark");
});
