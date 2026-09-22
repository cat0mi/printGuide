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
const definitions = { "chapter-1:final": ["a", "b"], "chapter-2:final": ["a", "b"] };

test("первый запуск начинается с нулевого прогресса", () => {
  assert.deepEqual(logic.normalizeChecklist(null, 3), [false, false, false]);
  assert.deepEqual(logic.overallProgress(chapters, {}, definitions), { completed: 0, total: 9, percent: 0 });
});

test("один пункт обновляет счётчик, но не завершает главу", () => {
  assert.deepEqual(logic.checklistStats([true, false]), { checked: 1, total: 2, percent: 50, complete: false });
});

test("полный финальный чек-лист завершает только опубликованную главу", () => {
  var state = { "chapter-1:final": [true, true], "chapter-2:final": [false, false] };
  assert.deepEqual(logic.overallProgress(chapters, state, definitions), { completed: 1, total: 9, percent: 11 });
  state["chapter-1:final"][0] = false;
  assert.equal(logic.overallProgress(chapters, state, definitions).completed, 0);
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
