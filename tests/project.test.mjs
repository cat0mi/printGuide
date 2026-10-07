import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { access } from "node:fs/promises";

const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../styles.css", import.meta.url), "utf8");
const chapterOne = await readFile(new URL("../chapters/chapter-1/index.html", import.meta.url), "utf8");
const chapterTwo = await readFile(new URL("../chapters/chapter-2/index.html", import.meta.url), "utf8");
const chapterThree = await readFile(new URL("../chapters/chapter-3/index.html", import.meta.url), "utf8");
const chapterFour = await readFile(new URL("../chapters/chapter-4/index.html", import.meta.url), "utf8");
const chapterFive = await readFile(new URL("../chapters/chapter-5/index.html", import.meta.url), "utf8");
const chapterSix = await readFile(new URL("../chapters/chapter-6/index.html", import.meta.url), "utf8");
const chapterSeven = await readFile(new URL("../chapters/chapter-7/index.html", import.meta.url), "utf8");
const chapterEight = await readFile(new URL("../chapters/chapter-8/index.html", import.meta.url), "utf8");
const chapterNine = await readFile(new URL("../chapters/chapter-9/index.html", import.meta.url), "utf8");
const chapterTen = await readFile(new URL("../chapters/chapter-10/index.html", import.meta.url), "utf8");
const data = await readFile(new URL("../data.js", import.meta.url), "utf8");
const bootstrap = await readFile(new URL("../bootstrap.js", import.meta.url), "utf8");
const pdfChecklist = await readFile(new URL("../pdf-checklist.js", import.meta.url), "utf8");
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

const chapterSources = [chapterOne, chapterTwo, chapterThree, chapterFour, chapterFive, chapterSix, chapterSeven, chapterEight, chapterNine, chapterTen];

test("нумерация содержания всех глав последовательна и все якоря существуют", () => {
  chapterSources.forEach((source, chapterIndex) => {
    const chapterNumber = chapterIndex + 1;
    const links = Array.from(source.matchAll(/<a class="toc-link" href="#\/chapter-\d+\/([^"]+)">\s*([^<]+)<\/a>/g));

    assert.ok(links.length > 0, `У главы ${chapterNumber} нет пунктов содержания`);
    links.forEach((match) => {
      const sectionId = match[1];
      const escapedId = sectionId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      assert.match(source, new RegExp(`id="${escapedId}"`), `Не найден якорь #${sectionId} в главе ${chapterNumber}`);
    });
  });
  assert.match(app, /function normalizeTocNumbering\(\)/);
  assert.match(app, /link\.textContent = number \+ "\. " \+ label/);
  assert.match(app, /normalizeTocNumbering\(\);\s*initMobileToc\(\)/);
});

test("контент глав центрируется в области справа от бокового меню", () => {
  assert.match(styles, /grid-template-columns: 260px minmax\(0, 1fr\) minmax\(0, 860px\) 48px 240px minmax\(0, 1fr\)/);
  assert.match(styles, /\.guide-content \{ grid-column: 3;[^}]*max-width: 860px/);
  assert.match(styles, /\.chapter-toc \{ grid-column: 5;[^}]*max-width: 240px/);
  assert.match(styles, /@media \(min-width: 1024px\) and \(max-width: 1199px\)[\s\S]*?\.guide-content, \.guide-content\.narrow \{ grid-column: 2/);
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*?\.guide-shell \{ min-height: 100vh; display: block; \}/);
});

test("главы 3–9 имеют маршруты на главной", () => {
  for (let number = 3; number <= 9; number += 1) assert.match(index, new RegExp('href="#/chapter-' + number + '"'));
  assert.match(app, /renderPlaceholderPages/);
});

test("глава 10 подключена как опубликованная практическая глава", () => {
  assert.match(index, /data-chapter-card="chapter-10"[\s\S]*?href="#\/chapter-10"/);
  assert.match(index, /data-chapter-slot="chapter-10"/);
  assert.match(bootstrap, /"chapter-10"/);
  assert.match(data, /id: "chapter-10"[\s\S]*?isAccessible: true, published: true/);
  assert.match(chapterTen, /data-page="chapter-10"/);
  assert.match(chapterTen, /data-checklist="chapter-10:quick"/);
  assert.match(chapterTen, /data-checklist="chapter-10:final"/);
  assert.equal((chapterTen.match(/class="toc-link"/g) || []).length, 12);
  assert.doesNotMatch(chapterTen, /chapter-title"><span>10<\/span><h1>10/);
});

test("чек-листы главы 10 содержат 11 и 14 пунктов", () => {
  const quick = data.match(/"chapter-10:quick": \[([\s\S]*?)\n      \],/)[1];
  const final = data.match(/"chapter-10:final": \[([\s\S]*?)\n      \]/)[1];
  assert.equal((quick.match(/"[^"]+"/g) || []).length, 11);
  assert.equal((final.match(/"[^"]+"/g) || []).length, 14);
  assert.equal((chapterTen.match(/data-download-checklist/g) || []).length, 2);
  assert.match(chapterTen, /Макет корректно перенесён из Figma/);
});

test("полезные функции Illustrator раскрываются в независимых доступных карточках", () => {
  const toolsSection = chapterTen.match(/<section class="guide-section" id="figma-tools">([\s\S]*?)<\/section>/)?.[1] || "";
  assert.equal((toolsSection.match(/class="accordion-item illustrator-tool-card"/g) || []).length, 11);
  assert.equal((toolsSection.match(/aria-expanded="false"/g) || []).length, 11);
  assert.match(toolsSection, /<strong>Pathfinder<\/strong>/);
  assert.match(toolsSection, /<strong>Shape Builder<\/strong>/);
  assert.match(toolsSection, /Для чего нужна:/);
  assert.match(toolsSection, /Как сделать:/);
  assert.match(toolsSection, /Важно:/);
  assert.match(toolsSection, /Window → Links/);
  assert.match(toolsSection, /File → Package/);
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

test("табы фальцовки доступны и переключаются через делегирование событий", () => {
  assert.match(chapterTwo, /role="tablist"/);
  assert.equal((chapterTwo.match(/role="tab"/g) || []).length, 3);
  assert.equal((chapterTwo.match(/role="tabpanel"/g) || []).length, 3);
  assert.match(chapterTwo, /fold-panel-euro[\s\S]*?100 мм[\s\S]*?100 мм[\s\S]*?98 мм/);
  assert.match(chapterTwo, /fold-panel-accordion[\s\S]*?Равная панель/);
  assert.match(chapterTwo, /fold-panel-window[\s\S]*?Центральная область/);
  assert.match(app, /function activateFoldTab\(/);
  assert.match(app, /event\.target\.closest\("\[data-fold-tab\]"\)/);
  assert.match(app, /ArrowRight[\s\S]*?ArrowLeft[\s\S]*?Home[\s\S]*?End/);
});

test("глава 2 содержит пример флаера на базе карточек мерча", async () => {
  assert.match(chapterTwo, /id="print-examples"/);
  assert.match(chapterTwo, /href="#\/chapter-2\/print-examples">14\. Примеры/);
  assert.match(chapterTwo, /data-print-examples/);
  assert.match(chapterTwo, /data-example-lightbox/);
  assert.match(data, /printExamples:/);
  assert.match(data, /title: "Флаер"/);
  assert.match(data, /chapter-02-flyer\.jpg/);
  assert.match(data, /files\/209546/);
  assert.match(app, /selector: "\[data-print-examples\]", collection: "printExamples"/);
  assert.match(styles, /\.packaging-example-grid, \.single-example-grid \{ max-width: calc\(\(100% - 18px\) \/ 2\)/);
  await access(new URL("../assets/examples/chapter-02-flyer.jpg", import.meta.url));
});

test("превью примеров адаптируются без обрезки на планшетах и мобильных", () => {
  assert.match(styles, /\.merch-example-preview \{[^}]*height: 430px;[^}]*overflow: hidden/);
  assert.match(styles, /\.merch-example-preview img \{[^}]*width: auto;[^}]*height: auto;[^}]*max-width: calc\(100% - var\(--example-preview-gutter\)\);[^}]*max-height: calc\(100% - var\(--example-preview-gutter\)\);[^}]*object-fit: contain/);
  assert.match(styles, /@media \(max-width: 1199px\)[\s\S]*?\.wide-example-preview, \.merch-example-preview \{[\s\S]*?height: clamp\(220px, 36vw, 380px\)[\s\S]*?overflow: hidden/);
  assert.match(styles, /\.wide-example-preview img, \.merch-example-preview img \{[\s\S]*?width: auto;[\s\S]*?height: auto;[\s\S]*?max-width: calc\(100% - var\(--example-preview-gutter\)\);[\s\S]*?max-height: calc\(100% - var\(--example-preview-gutter\)\);[\s\S]*?object-fit: contain/);
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*?\.wide-example-preview \{[^}]*height: clamp\(240px, 92vw, 400px\)/);
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*?\.merch-example-preview \{[^}]*height: clamp\(240px, 92vw, 400px\)/);
});

test("разделы главы 1 пронумерованы последовательно и ссылки содержания совпадают", () => {
  const headingNumbers = [...chapterOne.matchAll(/<h2 class="section-title"><span>(\d+)\.<\/span>/g)].map((match) => Number(match[1]));
  const sectionIds = [...chapterOne.matchAll(/<section class="guide-section" id="section-(\d+)">/g)].map((match) => Number(match[1]));
  const tocNumbers = [...chapterOne.matchAll(/href="#\/chapter-1\/section-(\d+)">(\d+)\./g)].map((match) => [Number(match[1]), Number(match[2])]);
  assert.deepEqual(headingNumbers, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.deepEqual(sectionIds, headingNumbers);
  assert.deepEqual(tocNumbers, headingNumbers.map((number) => [number, number]));
});

test("раздел о шрифтах содержит практическую инструкцию перевода текста в кривые", () => {
  const fontSection = chapterOne.match(/<section class="guide-section" id="section-8">([\s\S]*?)<\/section>/)?.[1] || "";
  assert.match(fontSection, /Как перевести текст в кривые в Illustrator/);
  assert.equal((fontSection.match(/<li(?: class="outline-shortcuts")?>/g) || []).length, 5);
  assert.match(fontSection, /Type → Create Outlines/);
  assert.match(fontSection, /Shift<\/kbd> \+ <kbd>Ctrl/);
  assert.match(fontSection, /Shift<\/kbd> \+ <kbd>Cmd/);
  assert.match(fontSection, /Select → Object → Text Objects/);
  assert.match(fontSection, /не исправляет отсутствующий или подменённый шрифт/);
});

test("раздел о вылетах содержит практическую инструкцию для Illustrator", () => {
  const bleedSection = chapterOne.match(/<section class="guide-section" id="section-3">([\s\S]*?)<\/section>\s*<section class="guide-section" id="section-4">/)?.[1] || "";
  assert.match(bleedSection, /Как задать и изменить вылеты в Illustrator/);
  assert.match(bleedSection, /File → New/);
  assert.match(bleedSection, /File → Document Setup/);
  assert.match(bleedSection, /210 × 297 мм/);
  assert.match(bleedSection, /3 мм[\s\S]*только если это соответствует требованиям типографии/);
  assert.match(bleedSection, /Само указание вылетов не растягивает объекты автоматически/);
  assert.match(bleedSection, /Use Document Bleed Settings/);
  assert.match(bleedSection, /Установите 0 мм/);
  assert.match(styles, /\.bleed-layout-rules \.bullet-list li \{ display: list-item; width: 100%; min-width: 0; \}/);
});

test("схема RGB и CMYK видима в обеих темах и содержит отдельный канал K", () => {
  const colorSection = chapterOne.match(/<section class="guide-section" id="section-4">([\s\S]*?)<\/section>/)?.[1] || "";
  assert.equal((colorSection.match(/class="color-venn"/g) || []).length, 2);
  assert.match(colorSection, /<title id="rgb-title">RGB — экран<\/title>/);
  assert.match(colorSection, /R — Red · G — Green · B — Blue/);
  assert.match(colorSection, /<title id="cmyk-title">CMYK — печать<\/title>/);
  assert.match(colorSection, /C — Cyan · M — Magenta · Y — Yellow · K — Black/);
  assert.match(colorSection, /class="k-sample"/);
  assert.match(colorSection, /Схемы условные: RGB показывает смешение света, CMYK — печатные краски\. Чёрная краска K используется отдельно/);
  ["#ff2028", "#00d92f", "#164cff", "#ffe600", "#ff00d4", "#00e5ef", "#ffffff", "#00dcea", "#f000c8", "#2447e8", "#00b83f", "#f1262d", "#20242b", "#050505"].forEach((color) => assert.match(colorSection, new RegExp(`fill="${color}"`)));
  assert.equal((colorSection.match(/clipPathUnits="userSpaceOnUse"/g) || []).length, 4);
  assert.equal((colorSection.match(/<path\b/g) || []).length, 0);
  assert.match(colorSection, /<g clip-path="url\(#rgb-new-r-clip\)"><g clip-path="url\(#rgb-new-g-clip\)"><circle[^>]+fill="#ffffff"/);
  assert.match(colorSection, /<g clip-path="url\(#cmyk-new-c-clip\)"><g clip-path="url\(#cmyk-new-m-clip\)"><circle[^>]+fill="#20242b"/);
  assert.doesNotMatch(styles, /mix-blend-mode/);
  assert.match(styles, /\.color-venn \.k-sample \{ stroke: #94a3b8; stroke-width: 2px; \}/);
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*?\.color-models \{[^}]*grid-template-columns: 1fr/);
});

test("глава 3 загружается как опубликованная полноценная глава", () => {
  assert.match(bootstrap, /"chapter-3"/);
  assert.match(data, /id: "chapter-3"[\s\S]*?published: true/);
  assert.match(chapterThree, /data-page="chapter-3"/);
  assert.match(chapterThree, /data-checklist="chapter-3:quick"/);
  assert.match(chapterThree, /data-checklist="chapter-3:final"/);
});

test("содержание главы 3 включает 18 разделов и служебные блоки", () => {
  for (let number = 1; number <= 18; number += 1) {
    assert.match(chapterThree, new RegExp('<span>' + number + '\\.<\\/span>'));
  }
  assert.match(chapterThree, /quick-check-three/);
  assert.match(chapterThree, /wide-errors/);
  assert.match(chapterThree, /wide-final/);
  assert.doesNotMatch(chapterThree, /toc-link active/);
});

test("глава 3 содержит два оптимизированных практических примера", async () => {
  assert.match(chapterThree, /id="examples"/);
  assert.match(chapterThree, /<span>18\.<\/span>ПРАКТИЧЕСКИЕ ПРИМЕРЫ/);
  assert.match(chapterThree, /data-wide-examples/);
  assert.match(data, /wideFormatExamples:/);
  const wideExamples = data.match(/wideFormatExamples: \[([\s\S]*?)\n    \],\n    printExamples:/)[1];
  assert.equal((wideExamples.match(/nextcloudUrl: "https:\/\/nccl\.opservicegrid\.com\/index\.php\/apps\/files\/files\//g) || []).length, 2);
  assert.match(app, /renderWideFormatExamples/);
  assert.match(app, /loading="lazy"/);
  assert.match(app, /target="_blank" rel="noopener noreferrer"/);
  await access(new URL("../assets/examples/chapter-03-rollup.webp", import.meta.url));
  await access(new URL("../assets/examples/chapter-03-backdrop.webp", import.meta.url));
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

test("глава 5 опубликована и содержит оба чек-листа", () => {
  assert.match(bootstrap, /"chapter-5"/);
  assert.match(data, /id: "chapter-5"[\s\S]*?published: true/);
  assert.match(chapterFive, /data-page="chapter-5"/);
  assert.match(chapterFive, /data-checklist="chapter-5:quick"/);
  assert.match(chapterFive, /data-checklist="chapter-5:final"/);
  const quick = data.match(/"chapter-5:quick": \[([\s\S]*?)\n      \],/)[1];
  const final = data.match(/"chapter-5:final": \[([\s\S]*?)\n      \],/)[1];
  assert.equal((quick.match(/"[^"]+"/g) || []).length, 11);
  assert.equal((final.match(/"[^"]+"/g) || []).length, 16);
});

test("глава 5 содержит полный набор разделов и соседнюю навигацию", () => {
  assert.equal((chapterFive.match(/class="toc-link"/g) || []).length, 13);
  assert.match(chapterFive, /merch-method/);
  assert.match(chapterFive, /merch-errors/);
  assert.match(chapterFive, /href="#\/chapter-4"/);
  assert.match(chapterFive, /href="#\/chapter-6"/);
  assert.doesNotMatch(chapterFive, /Глава в разработке/);
});

test("глава 5 содержит переключаемые примеры футболки и кепки", async () => {
  assert.match(chapterFive, /id="merch-examples"/);
  assert.match(chapterFive, /11\. Примеры/);
  assert.match(data, /merchExamples:/);
  assert.match(data, /title: "Футболка"/);
  assert.match(data, /title: "Кепка"/);
  assert.equal((data.match(/assets\/examples\/chapter-05-[^"]+\.webp/g) || []).length, 4);
  assert.match(app, /renderMerchExamples/);
  assert.match(app, /data-merch-variant/);
  assert.match(app, /aria-pressed/);
  for (const file of ["tshirt-front", "tshirt-back", "cap-dark", "cap-light"]) {
    await access(new URL("../assets/examples/chapter-05-" + file + ".webp", import.meta.url));
  }
});

test("главы 6 и 7 опубликованы и содержат отдельные чек-листы", () => {
  for (const [number, source, quickCount, finalCount] of [[6, chapterSix, 12, 18], [7, chapterSeven, 11, 18]]) {
    assert.match(bootstrap, new RegExp('"chapter-' + number + '"'));
    assert.match(data, new RegExp('id: "chapter-' + number + '"[\\s\\S]*?published: true'));
    assert.match(source, new RegExp('data-page="chapter-' + number + '"'));
    assert.match(source, new RegExp('data-checklist="chapter-' + number + ':quick"'));
    assert.match(source, new RegExp('data-checklist="chapter-' + number + ':final"'));
    const quick = data.match(new RegExp('"chapter-' + number + ':quick": \\[([\\s\\S]*?)\\n      \\],'))[1];
    const final = data.match(new RegExp('"chapter-' + number + ':final": \\[([\\s\\S]*?)\\n      \\],'))[1];
    assert.equal((quick.match(/"[^"]+"/g) || []).length, quickCount);
    assert.equal((final.match(/"[^"]+"/g) || []).length, finalCount);
  }
});

test("глава 6 содержит пример коробки на базе карточек мерча", async () => {
  assert.match(chapterSix, /id="packaging-examples"/);
  assert.match(chapterSix, /12\. Примеры/);
  assert.match(chapterSix, /data-packaging-examples/);
  assert.match(data, /packagingExamples:/);
  assert.match(data, /title: "Коробка для визиток"/);
  assert.match(data, /chapter-06-business-card-box\.webp/);
  assert.match(app, /data-example-collection/);
  assert.match(styles, /\.packaging-example-grid, \.single-example-grid \{ max-width: calc\(\(100% - 18px\) \/ 2\); grid-template-columns: minmax\(0, 1fr\); \}/);
  await access(new URL("../assets/examples/chapter-06-business-card-box.webp", import.meta.url));
});

test("содержание глав 3, 5 и 6 содержит по одной корректной ссылке на примеры", () => {
  const configs = [
    { source: chapterThree, href: "#/chapter-3/examples", number: 18, previous: "#/chapter-3/wide-export", next: "#/chapter-3/wide-errors" },
    { source: chapterFive, href: "#/chapter-5/merch-examples", number: 11, previous: "#/chapter-5/merch-folders", next: "#/chapter-5/merch-errors" },
    { source: chapterSix, href: "#/chapter-6/packaging-examples", number: 12, previous: "#/chapter-6/packaging-errors", next: "#/chapter-6/packaging-final" }
  ];
  configs.forEach(({ source, href, number, previous, next }) => {
    const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.equal((source.match(new RegExp('class="toc-link" href="' + escapedHref + '"', "g")) || []).length, 1);
    assert.match(source, new RegExp('href="' + escapedHref + '">' + number + '\\. Примеры<'));
    assert.ok(source.indexOf('href="' + previous + '"') < source.indexOf('href="' + href + '"'));
    assert.ok(source.indexOf('href="' + href + '"') < source.indexOf('href="' + next + '"'));
  });
  assert.match(app, /desktopToc\.querySelectorAll\("\.toc-link"\)/);
  assert.match(app, /mobile-toc-panel/);
});

test("главы 6 и 7 содержат полную навигацию без заглушек", () => {
  assert.equal((chapterSix.match(/class="toc-link"/g) || []).length, 14);
  assert.equal((chapterSeven.match(/class="toc-link"/g) || []).length, 14);
  assert.match(chapterSix, /href="#\/chapter-5"/);
  assert.match(chapterSix, /href="#\/chapter-7"/);
  assert.match(chapterSeven, /href="#\/chapter-6"/);
  assert.match(chapterSeven, /href="#\/chapter-8"/);
  assert.doesNotMatch(chapterSix + chapterSeven, /Глава в разработке/);
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
  assert.match(chapterNine, /href="#\/chapter-10"/);
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

test("все десять глав опубликованы и доступны", () => {
  for (let number = 1; number <= 10; number += 1) {
    assert.match(data, new RegExp('id: "chapter-' + number + '"[\\s\\S]*?isAccessible: true, published: true'));
  }
  assert.doesNotMatch(app, /unavailableCard/);
});

test("на главной общий прогресс отображается только процентом", () => {
  assert.match(index, /<strong>Общий прогресс<\/strong><span data-overall-label>0%<\/span>/);
  assert.match(app, /label\.textContent = progress\.percent \+ "%"/);
  assert.doesNotMatch(index, /пунктов выполнено|Общий прогресс изучения/);
  assert.doesNotMatch(app, /пунктов выполнено/);
  assert.match(app, /bar\.style\.width = progress\.exactPercent \+ "%"/);
});

test("футер главной остаётся видимым в мобильной версии", () => {
  assert.match(index, /<footer class="home-footer">[\s\S]*?Внутренний гайд для дизайнеров[\s\S]*?Последнее обновление: 1 октября 2026/);
  assert.doesNotMatch(styles, /\.recommended-section,\s*\.home-footer\s*\{\s*display:\s*none/);
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*?\.home-footer\s*\{[\s\S]*?display:\s*flex[\s\S]*?flex-direction:\s*column/);
});

test("боковое и мобильное меню показывают только процент для В процессе", () => {
  assert.match(app, /state\.status === "in-progress" \? state\.progress\.percentage \+ "%" : state\.label/);
  assert.doesNotMatch(app, /nav-status[^\n]*В процессе/);
});

test("мобильные главы используют независимые колонки для названия и статуса", () => {
  assert.match(app, /class="mobile-chapter-link /);
  assert.match(app, /<span><i class="mobile-chapter-number">[\s\S]*?<small class="nav-status">/);
  assert.match(styles, /\.mobile-menu \.mobile-chapter-link\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) auto/);
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
  assert.match(app, /themeAudio\.volume = 0\.15/);
  assert.match(app, /themeAudio\.pause\(\)[\s\S]*?themeAudio\.currentTime = 0/);
  assert.match(app, /setTheme\(nextTheme\);\s*playThemeSound\(nextTheme\)/);
  assert.equal((app.match(/playThemeSound\(nextTheme\)/g) || []).length, 1);
  assert.match(app, /playback\.catch\(function \(\) \{\}\)/);
});

test("переключатель темы в хедере содержит динамическую подпись и доступные состояния", () => {
  assert.match(index, /class="theme-control"[\s\S]*?data-theme-label[\s\S]*?class="theme-switch"/);
  assert.match(app, /label\.textContent = dark \? "Тёмная тема" : "Светлая тема"/);
  assert.match(app, /button\.setAttribute\("aria-label", dark \? "Включить светлую тему" : "Включить тёмную тему"\)/);
  assert.match(app, /button\.setAttribute\("aria-pressed", String\(dark\)\)/);
  [chapterOne, chapterTwo, chapterThree, chapterFour, chapterFive, chapterSix, chapterSeven, chapterEight, chapterNine].forEach((chapter) => {
    assert.match(chapter, /chapter-mobile-header[\s\S]*?class="theme-control"[\s\S]*?data-theme-label/);
  });
});

test("чек-листы скачиваются как текстовый PDF с локальными кириллическими шрифтами", async () => {
  assert.equal(typeof packageJson.dependencies.jspdf, "string");
  await access(new URL("../assets/vendor/jspdf.umd.min.js", import.meta.url));
  await access(new URL("../assets/fonts/geist-400.ttf", import.meta.url));
  await access(new URL("../assets/fonts/geist-700.ttf", import.meta.url));
  assert.match(index, /assets\/vendor\/jspdf\.umd\.min\.js[\s\S]*?pdf-checklist\.js/);
  assert.match(pdfChecklist, /addFileToVFS\("Geist-Regular\.ttf"/);
  assert.match(pdfChecklist, /splitTextToSize\(item, textWidth\)/);
  assert.match(pdfChecklist, /if \(y \+ itemHeight > bottomLimit\)[\s\S]*?doc\.addPage\(\)/);
  assert.match(pdfChecklist, /doc\.rect\(margin, y - 3\.2, checkboxSize, checkboxSize\)/);
  assert.match(app, /print-guide-final-checklist\.pdf/);
  assert.match(app, /print-guide-chapter-" \+ chapter\.number \+ "-" \+ checklistType \+ "-checklist\.pdf/);
  assert.match(app, /button\.closest\("\.checklist-card, \.final-card"\)/);
  assert.doesNotMatch(app, /print-guide-checklist\.txt|text\/plain|new Blob/);
});

test("PDF-экспорт доступен у быстрых и финальных чек-листов всех глав", () => {
  [chapterOne, chapterTwo, chapterThree, chapterFour, chapterFive, chapterSix, chapterSeven, chapterEight, chapterTen].forEach((chapter) => {
    assert.equal((chapter.match(/data-download-checklist/g) || []).length, 2);
    assert.match(chapter, /data-checklist="chapter-\d+:quick"[\s\S]*?data-download-checklist/);
    assert.match(chapter, /data-checklist="chapter-\d+:final"[\s\S]*?data-download-checklist/);
  });
  assert.equal((chapterNine.match(/data-download-checklist/g) || []).length, 1);
  assert.match(chapterNine, /data-checklist="chapter-9:final"[\s\S]*?data-download-checklist/);
});
