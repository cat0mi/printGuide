import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { access } from "node:fs/promises";

const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
const chapterOne = await readFile(new URL("../chapters/chapter-1/index.html", import.meta.url), "utf8");
const chapterTwo = await readFile(new URL("../chapters/chapter-2/index.html", import.meta.url), "utf8");
const chapterThree = await readFile(new URL("../chapters/chapter-3/index.html", import.meta.url), "utf8");
const chapterFour = await readFile(new URL("../chapters/chapter-4/index.html", import.meta.url), "utf8");
const chapterEight = await readFile(new URL("../chapters/chapter-8/index.html", import.meta.url), "utf8");
const chapterNine = await readFile(new URL("../chapters/chapter-9/index.html", import.meta.url), "utf8");
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

test("глава 8 подключена как опубликованная и содержит 27 пунктов", () => {
  assert.match(bootstrap, /"chapter-8"/);
  assert.match(data, /id: "chapter-8"[\s\S]*?published: true/);
  assert.match(chapterEight, /data-page="chapter-8"/);
  assert.match(chapterEight, /data-checklist="chapter-8:quick"/);
  assert.match(chapterEight, /data-checklist="chapter-8:final"/);
  const quick = data.match(/"chapter-8:quick": \[([\s\S]*?)\n      \],/)[1];
  const final = data.match(/"chapter-8:final": \[([\s\S]*?)\n      \]/)[1];
  assert.equal((quick.match(/"[^"]+"/g) || []).length, 10);
  assert.equal((final.match(/"[^"]+"/g) || []).length, 17);
});

test("глава 8 содержит содержание, ошибки и соседнюю навигацию", () => {
  assert.match(chapterEight, /transfer-errors/);
  assert.match(chapterEight, /transfer-final/);
  assert.match(chapterEight, /href="#\/chapter-7"/);
  assert.match(chapterEight, /href="#\/chapter-9"/);
  assert.equal((chapterEight.match(/class="toc-link"/g) || []).length, 9);
  assert.doesNotMatch(chapterEight, /transfer-fonts|transfer-archive|transfer-message/);
  assert.doesNotMatch(chapterEight, /toc-link active/);
});

test("глава 9 опубликована как единый чек-лист из 37 пунктов", () => {
  assert.match(bootstrap, /"chapter-9"/);
  assert.match(data, /id: "chapter-9"[\s\S]*?published: true/);
  assert.match(chapterNine, /data-page="chapter-9"/);
  assert.doesNotMatch(chapterNine, /chapter-9:quick/);
  const final = data.match(/"chapter-9:final": \[([\s\S]*?)\n      \]/)[1];
  assert.equal((final.match(/"[^"]+"/g) || []).length, 37);
  assert.equal((chapterNine.match(/data-checklist="chapter-9:final"/g) || []).length, 6);
  assert.equal((chapterNine.match(/class="toc-link"/g) || []).length, 7);
});

test("группы главы 9 используют диапазоны одного общего состояния", () => {
  assert.match(app, /items\.slice\(start, end\)/);
  assert.match(app, /var index = start \+ localIndex/);
  assert.match(chapterNine, /data-check-start="0" data-check-end="6"/);
  assert.match(chapterNine, /data-check-start="31" data-check-end="37"/);
  assert.match(chapterNine, /Вернуться на главную/);
  assert.match(chapterNine, /Макет проверен и готов к передаче в производство/);
});

test("единая система статусов использует согласованные названия", () => {
  assert.match(app, /"not-started": "Не начато"/);
  assert.match(app, /"in-progress": "В процессе"/);
  assert.match(app, /completed: "Пройдено"/);
  assert.match(app, /development: "В разработке"/);
  assert.doesNotMatch(app, /Изучено/);
  assert.doesNotMatch(app, /Начато/);
});

test("главы в разработке доступны отдельно от статуса публикации", () => {
  for (const number of [5, 6, 7]) {
    assert.match(data, new RegExp('id: "chapter-' + number + '"[\\s\\S]*?isAccessible: true, published: false'));
  }
  assert.doesNotMatch(app, /unavailableCard/);
  assert.match(app, /Глава в разработке/);
});

test("на главной сохранён подробный формат общего прогресса", () => {
  assert.match(index, /<strong>Общий прогресс изучения<\/strong><span data-overall-label>0 из 184 пунктов выполнено \(0%\)<\/span>/);
  assert.match(app, /progress\.completedItems \+ " из " \+ progress\.totalItems \+ " пунктов выполнено \(" \+ progress\.percent \+ "%\)"/);
  assert.match(app, /bar\.style\.width = progress\.exactPercent \+ "%"/);
});

test("боковое и мобильное меню показывают только процент для В процессе", () => {
  assert.match(app, /state\.status === "in-progress" \? state\.progress\.percentage \+ "%" : state\.label/);
  assert.doesNotMatch(app, /nav-status[^\n]*В процессе/);
});

test("номера глав не дублируются в генерируемых меню", () => {
  assert.doesNotMatch(app, /Number\(chapter\.number\) \+ "\. " \+ escapeHtml\(chapter\.shortTitle\)/);
  assert.doesNotMatch(app, /Number\(chapter\.number\) \+ "\. " \+ escapeHtml\(chapter\.title\)/);
});

test("ключи localStorage чек-листов сохраняют совместимость", () => {
  assert.match(app, /"printGuide:v1:" \+ parts\[0\] \+ ":checklist:" \+ parts\[1\]/);
  assert.match(app, /localStorage\.setItem\(storageKey\(listKey\)/);
});

test("звуки темы запускаются только из ручного обработчика", async () => {
  await access(new URL("../assets/audio/light-on.mp3", import.meta.url));
  await access(new URL("../assets/audio/light-off.mp3", import.meta.url));
  assert.match(app, /theme === "light" \? "light-on\.mp3" : "light-off\.mp3"/);
  assert.match(app, /themeAudio\.volume = 0\.25/);
  assert.match(app, /themeAudio\.pause\(\)[\s\S]*?themeAudio\.currentTime = 0/);
  assert.match(app, /setTheme\(nextTheme\);\s*playThemeSound\(nextTheme\)/);
  assert.equal((app.match(/playThemeSound\(nextTheme\)/g) || []).length, 1);
  assert.match(app, /playback\.catch\(function \(\) \{\}\)/);
});
