import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
const chapterOne = await readFile(new URL("../chapters/chapter-1/index.html", import.meta.url), "utf8");
const chapterTwo = await readFile(new URL("../chapters/chapter-2/index.html", import.meta.url), "utf8");
const chapterThree = await readFile(new URL("../chapters/chapter-3/index.html", import.meta.url), "utf8");
const chapterFour = await readFile(new URL("../chapters/chapter-4/index.html", import.meta.url), "utf8");
const data = await readFile(new URL("../data.js", import.meta.url), "utf8");
const bootstrap = await readFile(new URL("../bootstrap.js", import.meta.url), "utf8");

test("главы 3–9 имеют маршруты на главной", () => {
  for (let number = 3; number <= 9; number += 1) assert.match(index, new RegExp('href="#/chapter-' + number + '"'));
  assert.match(app, /renderPlaceholderPages/);
});

test("Nextcloud присутствует в главах 1, 2 и безопасно открывается", () => {
  for (const source of [chapterOne, chapterTwo]) {
    assert.match(source, /nccl\.opservicegrid\.com/);
    assert.match(source, /target="_blank"/);
    assert.match(source, /rel="noopener noreferrer"/);
  }
});

test("несуществующий переключатель языка удалён", () => {
  assert.doesNotMatch(index, /Ru\s*\/\s*En|class="lang"/);
});

test("финальные чек-листы не дублируют пункты в HTML", () => {
  assert.match(chapterOne, /data-checklist="chapter-1:final"><\/div>/);
  assert.match(chapterTwo, /data-checklist="chapter-2:final"><\/div>/);
});

test("содержание главы использует IntersectionObserver и доступное активное состояние", () => {
  assert.match(app, /new IntersectionObserver/);
  assert.match(app, /history\.replaceState/);
  assert.match(app, /setAttribute\("aria-current", "location"\)/);
  assert.doesNotMatch(app, /addEventListener\("scroll"/);
});

test("у глав 1 и 2 нет статически активного первого пункта", () => {
  assert.doesNotMatch(chapterOne, /toc-link active/);
  assert.doesNotMatch(chapterTwo, /toc-link active/);
});

test("глава 3 загружается как опубликованная полноценная глава", () => {
  assert.match(bootstrap, /"chapter-3"/);
  assert.match(data, /id: "chapter-3"[\s\S]*?published: true/);
  assert.match(chapterThree, /data-page="chapter-3"/);
  assert.match(chapterThree, /data-checklist="chapter-3:quick"/);
  assert.match(chapterThree, /data-checklist="chapter-3:final"/);
});

test("содержание главы 3 включает 17 разделов и служебные блоки", () => {
  for (let number = 1; number <= 17; number += 1) {
    assert.match(chapterThree, new RegExp('<span>' + number + '\\.<\\/span>'));
  }
  assert.match(chapterThree, /quick-check-three/);
  assert.match(chapterThree, /wide-errors/);
  assert.match(chapterThree, /wide-final/);
  assert.doesNotMatch(chapterThree, /toc-link active/);
});

test("глава 4 подключена как опубликованная и содержит два чек-листа", () => {
  assert.match(bootstrap, /"chapter-4"/);
  assert.match(data, /id: "chapter-4"[\s\S]*?published: true/);
  assert.match(chapterFour, /data-page="chapter-4"/);
  assert.match(chapterFour, /data-checklist="chapter-4:quick"/);
  assert.match(chapterFour, /data-checklist="chapter-4:final"/);
});

test("глава 4 содержит 13 разделов, ошибки и финальную проверку", () => {
  for (let number = 1; number <= 13; number += 1) {
    assert.match(chapterFour, new RegExp('<span>' + number + '\\.<\\/span>'));
  }
  assert.match(chapterFour, /construction-errors/);
  assert.match(chapterFour, /construction-final/);
  assert.doesNotMatch(chapterFour, /toc-link active/);
});
