(function () {
  "use strict";

  var data = window.PRINT_GUIDE_DATA;
  var logic = window.PrintGuideLogic;
  var root = document.documentElement;
  var toast = document.getElementById("toast");
  var checklistState = {};
  var themeKey = "printGuide:v1:theme";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var scrollSpyObserver = null;
  var activeSectionByPage = {};

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character];
    });
  }

  function storageKey(listKey) {
    var parts = listKey.split(":");
    return "printGuide:v1:" + parts[0] + ":checklist:" + parts[1];
  }

  function readStoredList(listKey, length) {
    try { return logic.normalizeChecklist(JSON.parse(localStorage.getItem(storageKey(listKey)) || "null"), length); }
    catch (error) { return logic.normalizeChecklist(null, length); }
  }

  function writeStoredList(listKey) {
    try { localStorage.setItem(storageKey(listKey), JSON.stringify(checklistState[listKey])); } catch (error) {}
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () { toast.classList.remove("visible"); }, 1800);
  }

  function chapterById(id) { return data.chapters.find(function (chapter) { return chapter.id === id; }); }

  function chapterState(chapter) {
    var progress = logic.chapterProgress(chapter.id, checklistState, data.checklists);
    var status = logic.chapterStatus(chapter, checklistState, data.checklists);
    var labels = { "not-started": "Не начато", "in-progress": "В процессе", completed: "Пройдено", development: "В разработке" };
    return { status: status, label: labels[status], progress: progress };
  }

  function getRoute() {
    var parts = window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    return { page: parts[0] || "home", anchor: parts[1] || "" };
  }

  function isChapterComplete(chapterId) {
    var chapter = chapterById(chapterId);
    return Boolean(chapter && logic.chapterStatus(chapter, checklistState, data.checklists) === "completed");
  }

  function navMarkup(currentId) {
    return data.chapters.map(function (chapter) {
      var state = chapterState(chapter);
      var completed = state.status === "completed";
      var marker = completed ? "✓" : chapter.number;
      var classes = [chapter.id === currentId ? "active" : "", state.status, completed ? "completed" : ""].filter(Boolean).join(" ");
      var compactStatus = state.status === "in-progress" ? state.progress.percentage + "%" : state.label;
      var content = '<i class="' + (completed ? "done" : "") + '">' + marker + '</i><span>' + escapeHtml(chapter.shortTitle) + '</span><small class="nav-status">' + escapeHtml(compactStatus) + "</small>";
      return chapter.isAccessible === false ? '<span class="' + classes + '">' + content + "</span>" : '<a class="' + classes + '" href="#/' + chapter.id + '"' + (chapter.id === currentId ? ' aria-current="page"' : "") + ">" + content + "</a>";
    }).join("");
  }

  function mobileMenuMarkup() {
    return '<a href="#/home">Главная</a>' + data.chapters.map(function (chapter) {
      var state = chapterState(chapter);
      var compactStatus = state.status === "in-progress" ? state.progress.percentage + "%" : state.label;
      var content = '<span><i class="mobile-chapter-number">' + chapter.number + "</i>" + escapeHtml(chapter.title) + '</span><small class="nav-status">' + escapeHtml(compactStatus) + "</small>";
      return chapter.isAccessible === false ? '<span class="development">' + content + "</span>" : '<a class="' + state.status + '" href="#/' + chapter.id + '">' + content + "</a>";
    }).join("") + '<button data-theme-toggle type="button" aria-label="Переключить цветовую тему" aria-pressed="false"><span data-theme-label></span></button>';
  }

  function placeholderExtra(chapter) {
    if (chapter.id !== "chapter-8") return "";
    return '<section class="guide-section transfer-panel" id="transfer-process"><h2 class="section-title"><span>1.</span>ОБЯЗАТЕЛЬНЫЕ КАНАЛЫ ПЕРЕДАЧИ</h2><p>После финальной проверки обязательно сохраните материалы во всех предусмотренных каналах: прикрепите их к задаче в Jira, передайте ответственному менеджеру и загрузите финальную версию в Nextcloud. Nextcloud используется как централизованное хранилище, поэтому загрузка файлов туда обязательна и не заменяется отправкой в мессенджере или только прикреплением к задаче.</p><ol><li>Прикрепить финальные файлы к соответствующей задаче в Jira.</li><li>Передать файлы или ссылку ответственному менеджеру.</li><li>Загрузить финальные файлы в Nextcloud.</li></ol><a class="button secondary external-link" href="' + data.nextcloudUrl + '" target="_blank" rel="noopener noreferrer">Открыть Nextcloud ↗</a></section>';
  }

  function placeholderChecklist(chapter) {
    var items = chapter.id === "chapter-8" || chapter.id === "chapter-9" ? data.transferChecklist : ["Чек-лист станет доступен после публикации главы."];
    return '<section class="checklist-card disabled-checklist" aria-labelledby="' + chapter.id + '-check-title"><div class="checklist-head"><h2 id="' + chapter.id + '-check-title">ЧЕК-ЛИСТ РАЗДЕЛА</h2><strong>Недоступен</strong></div><p>Чек-лист станет доступен после публикации материалов главы.</p><div class="check-list">' + items.map(function (item) { return '<button class="check-row" type="button" disabled aria-disabled="true"><span></span>' + escapeHtml(item) + "</button>"; }).join("") + "</div></section>";
  }

  function createPlaceholderPage(chapter, index) {
    var previous = data.chapters[index - 1];
    var next = data.chapters[index + 1];
    var previousHref = previous ? "#/" + previous.id : "#/home";
    var nextHref = next ? "#/" + next.id : "#/home";
    var previousLabel = previous ? "Глава " + Number(previous.number) + ". " + previous.title : "Главная";
    var nextLabel = next ? "Глава " + Number(next.number) + ". " + next.title : "Главная";
    var topicsId = "planned-topics-" + chapter.id;
    return '<section class="page" data-page="' + chapter.id + '" hidden><header class="chapter-mobile-header mobile-only"><a class="brand" href="#/home"><img src="assets/icons/brand.svg" alt="" width="24" height="24"><strong>' + chapter.number + " · " + escapeHtml(chapter.title.toUpperCase()) + '</strong></a><div class="header-controls"><button class="icon-button" data-theme-toggle type="button" aria-label="Переключить цветовую тему" aria-pressed="false"><img src="assets/icons/moon.svg" alt="" width="16" height="16"></button><button class="icon-button" data-menu-toggle type="button" aria-label="Открыть меню" aria-expanded="false"><img src="assets/icons/menu.svg" alt="" width="18" height="18"></button></div></header><nav class="mobile-menu" data-mobile-menu aria-label="Мобильное меню"></nav><div class="guide-shell placeholder-shell"><aside class="guide-sidebar"><div><a class="sidebar-brand" href="#/home"><span><img src="assets/icons/brand.svg" alt="" width="24" height="24"><strong>PRINT GUIDE</strong></span><small>Подготовка макетов к печати</small></a><label class="sidebar-search"><img src="assets/icons/search.svg" alt="" width="14" height="14"><input data-guide-search type="search" placeholder="Поиск по главам…" aria-label="Поиск по главам"></label><nav class="chapter-nav" aria-label="Главы"></nav></div><div class="sidebar-bottom"><button data-theme-toggle type="button" aria-label="Переключить цветовую тему" aria-pressed="false"><img src="assets/icons/moon.svg" alt="" width="16" height="16"><span data-theme-label></span><span class="theme-switch"><span></span></span></button><a href="#/home">← На главную</a></div></aside><article class="guide-content narrow"><header class="chapter-intro"><div class="chapter-title"><span>' + chapter.number + "</span><h1>" + escapeHtml(chapter.title) + '</h1></div><span class="development-badge">Глава в разработке</span><p>Материалы этой главы ещё дополняются. Уже опубликованную информацию можно просматривать, но содержание и структура могут измениться.</p><p class="lead">' + escapeHtml(chapter.description) + '</p></header><section class="guide-section" id="' + topicsId + '"><h2 class="section-title"><span>•</span>ПЛАНИРУЕМЫЕ ТЕМЫ</h2><ul class="bullet-list">' + chapter.topics.map(function (topic) { return "<li>" + escapeHtml(topic) + "</li>"; }).join("") + "</ul></section>" + placeholderExtra(chapter) + placeholderChecklist(chapter) + '<a class="button secondary" href="#/home">Вернуться на главную</a><footer class="chapter-footer"><a href="' + previousHref + '"><small>ПРЕДЫДУЩАЯ ГЛАВА</small><span>' + escapeHtml(previousLabel) + ' ←</span></a><a href="' + nextHref + '"><small>СЛЕДУЮЩАЯ ГЛАВА</small><span>' + escapeHtml(nextLabel) + ' →</span></a></footer></article><nav class="mobile-bottom-nav mobile-only"><a href="' + previousHref + '">← Назад</a><a href="#/home">Главная</a><a href="' + nextHref + '">Далее →</a></nav><aside class="chapter-toc"><strong>СОДЕРЖАНИЕ ГЛАВЫ</strong><nav><a class="toc-link" href="#/' + chapter.id + "/" + topicsId + '">Планируемые темы</a></nav></aside></div></section>';
  }

  function renderPlaceholderPages() {
    var app = document.getElementById("app");
    data.chapters.forEach(function (chapter, index) {
      if (!chapter.published && !document.querySelector('[data-page="' + chapter.id + '"]')) app.insertAdjacentHTML("beforeend", createPlaceholderPage(chapter, index));
    });
  }

  function loadChecklistState() {
    Object.keys(data.checklists).forEach(function (key) { checklistState[key] = readStoredList(key, data.checklists[key].length); });
  }

  function renderChecklists() {
    document.querySelectorAll("[data-checklist]").forEach(function (list) {
      var key = list.dataset.checklist;
      var items = data.checklists[key] || [];
      var start = Number(list.dataset.checkStart || 0);
      var end = list.dataset.checkEnd ? Number(list.dataset.checkEnd) : items.length;
      list.innerHTML = items.slice(start, end).map(function (item, localIndex) {
        var index = start + localIndex;
        var checked = checklistState[key][index];
        return '<button class="check-row' + (checked ? " checked" : "") + '" type="button" role="checkbox" aria-checked="' + checked + '" data-check-index="' + index + '"><span aria-hidden="true"></span>' + escapeHtml(item) + "</button>";
      }).join("");
      var card = list.closest(".checklist-card, .final-card");
      if (card && !card.querySelector("[data-reset]")) card.insertAdjacentHTML("beforeend", '<button class="reset-link" data-reset type="button">Сбросить чек-лист</button>');
      updateChecklist(list);
    });
  }

  function updateChecklist(list) {
    var key = list.dataset.checklist;
    var stats = logic.checklistStats(checklistState[key] || []);
    var card = list.closest(".checklist-card, .final-card");
    var counter = card && card.querySelector("[data-counter]");
    var progress = card && card.querySelector("[data-check-progress]");
    var completion = card && card.querySelector("[data-completion-message]");
    if (counter) counter.textContent = counter.dataset.counter === "percent" ? "Чек-лист пройден на " + stats.percent + "%" : stats.checked + " из " + stats.total + " (" + stats.percent + "%)";
    if (progress) progress.style.width = stats.percent + "%";
    if (completion) completion.hidden = stats.percent !== 100;
  }

  function updateOverallProgress() {
    var progress = logic.overallProgress(data.chapters, checklistState, data.checklists);
    var label = document.querySelector("[data-overall-label]");
    var bar = document.querySelector("[data-overall-progress]");
    if (label) label.textContent = progress.completedItems + " из " + progress.totalItems + " пунктов выполнено (" + progress.percent + "%)";
    if (bar) bar.style.width = progress.exactPercent + "%";
    data.chapters.forEach(function (chapter) {
      var card = document.querySelector('[data-chapter-card="' + chapter.id + '"]');
      if (!card) return;
      var status = card.querySelector(".status");
      var state = chapterState(chapter);
      var completed = state.status === "completed";
      card.classList.toggle("completed", completed);
      card.classList.toggle("current", getRoute().page === chapter.id);
      card.classList.toggle("in-progress", state.status === "in-progress");
      card.classList.toggle("in-development", state.status === "development");
      card.removeAttribute("aria-disabled");
      card.removeAttribute("tabindex");
      status.className = "status " + state.status;
      status.textContent = state.label + (state.status === "in-progress" ? " · " + state.progress.percentage + "%" : "");
    });
    document.querySelectorAll(".chapter-nav").forEach(function (nav) { nav.innerHTML = navMarkup(getRoute().page); });
    document.querySelectorAll("[data-mobile-menu]").forEach(function (menu) { menu.innerHTML = mobileMenuMarkup(); });
  }

  function setTheme(next) {
    root.dataset.theme = next;
    try { localStorage.setItem(themeKey, next); } catch (error) {}
    updateThemeControls();
  }

  function updateThemeControls() {
    var dark = root.dataset.theme === "dark";
    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      button.setAttribute("aria-label", dark ? "Включить светлую тему" : "Включить тёмную тему");
      button.setAttribute("aria-pressed", String(dark));
    });
    document.querySelectorAll("[data-theme-label]").forEach(function (label) { label.textContent = dark ? "Тёмная тема" : "Светлая тема"; });
  }

  function closeMenus() {
    document.querySelectorAll("[data-mobile-menu]").forEach(function (menu) { menu.classList.remove("open"); });
    document.querySelectorAll("[data-menu-toggle]").forEach(function (button) { button.setAttribute("aria-expanded", "false"); });
    document.querySelectorAll("[data-mobile-toc]").forEach(function (panel) { panel.hidden = true; });
    document.querySelectorAll("[data-toc-toggle]").forEach(function (button) { button.setAttribute("aria-expanded", "false"); });
    document.body.classList.remove("menu-open");
  }

  function getHeaderOffset() {
    var header = document.querySelector('.page:not([hidden]) .chapter-mobile-header');
    return window.innerWidth <= 767 && header ? Math.ceil(header.getBoundingClientRect().height) + 14 : 24;
  }

  function tocSectionIds(page) {
    return Array.from(page.querySelectorAll(".chapter-toc .toc-link")).map(function (link) {
      return link.getAttribute("href").split("/").pop();
    }).filter(function (id) { return Boolean(document.getElementById(id)); });
  }

  function setActiveSection(pageId, sectionId, replaceHash) {
    if (!sectionId || activeSectionByPage[pageId] === sectionId) return;
    activeSectionByPage[pageId] = sectionId;
    var page = document.querySelector('[data-page="' + pageId + '"]');
    if (!page) return;
    page.querySelectorAll(".toc-link").forEach(function (link) {
      var active = link.getAttribute("href").split("/").pop() === sectionId;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "location"); else link.removeAttribute("aria-current");
    });
    if (replaceHash && getRoute().page === pageId) history.replaceState(null, "", "#/" + pageId + "/" + sectionId);
  }

  function chooseActiveSection(page) {
    if (!page || page.hidden) return;
    var ids = tocSectionIds(page);
    if (!ids.length) return;
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 3) {
      setActiveSection(page.dataset.page, ids[ids.length - 1], true);
      return;
    }
    var boundary = getHeaderOffset();
    var visible = ids.map(function (id) { return { id: id, rect: document.getElementById(id).getBoundingClientRect() }; })
      .filter(function (item) { return item.rect.bottom > boundary && item.rect.top < window.innerHeight; });
    var selected = visible.length ? visible.sort(function (first, second) {
      return Math.abs(first.rect.top - boundary) - Math.abs(second.rect.top - boundary);
    })[0].id : ids[0];
    setActiveSection(page.dataset.page, selected, true);
  }

  function scrollToSection(pageId, sectionId, behavior) {
    var target = document.getElementById(sectionId);
    if (!target) return;
    setActiveSection(pageId, sectionId, false);
    var top = window.scrollY + target.getBoundingClientRect().top - getHeaderOffset();
    window.scrollTo({ top: Math.max(0, top), behavior: behavior || (reduceMotion ? "auto" : "smooth") });
  }

  function initMobileToc() {
    document.querySelectorAll('.page[data-page^="chapter-"]').forEach(function (page) {
      var desktopToc = page.querySelector(".chapter-toc nav");
      var bottomNav = page.querySelector(".mobile-bottom-nav");
      if (!desktopToc || !bottomNav || page.querySelector("[data-mobile-toc]")) return;
      var panelId = "mobile-toc-" + page.dataset.page;
      var links = Array.from(desktopToc.querySelectorAll(".toc-link")).map(function (link) {
        return '<a class="toc-link" href="' + link.getAttribute("href") + '">' + escapeHtml(link.textContent.trim()) + "</a>";
      }).join("");
      bottomNav.insertAdjacentHTML("beforebegin", '<aside class="mobile-toc-panel" id="' + panelId + '" data-mobile-toc hidden><strong>Содержание главы</strong><nav>' + links + "</nav></aside>");
      var center = bottomNav.children[1];
      if (center) center.outerHTML = '<button type="button" data-toc-toggle aria-controls="' + panelId + '" aria-expanded="false">☷ Содержание</button>';
    });
  }

  function initScrollSpy() {
    if (!("IntersectionObserver" in window)) return;
    if (scrollSpyObserver) scrollSpyObserver.disconnect();
    scrollSpyObserver = new IntersectionObserver(function () {
      var route = getRoute();
      chooseActiveSection(document.querySelector('[data-page="' + route.page + '"]'));
    }, { root: null, rootMargin: "-64px 0px -35% 0px", threshold: [0, .1, .25, .5, .75, 1] });
    document.querySelectorAll('.page[data-page^="chapter-"]').forEach(function (page) {
      tocSectionIds(page).forEach(function (id) { scrollSpyObserver.observe(document.getElementById(id)); });
    });
  }

  function activateRoute() {
    var route = getRoute();
    var available = ["home"].concat(data.chapters.map(function (chapter) { return chapter.id; }));
    var page = available.indexOf(route.page) >= 0 ? route.page : "home";
    document.querySelectorAll(".page").forEach(function (item) { item.hidden = item.dataset.page !== page; });
    document.body.dataset.route = page;
    closeMenus();
    updateOverallProgress();
    document.querySelectorAll(".chapter-nav a, .mobile-menu a").forEach(function (link) {
      var current = link.getAttribute("href") === "#/" + page;
      if (current) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
    });
    window.setTimeout(function () {
      var visiblePage = document.querySelector('[data-page="' + page + '"]');
      var ids = visiblePage ? tocSectionIds(visiblePage) : [];
      if (route.anchor && ids.indexOf(route.anchor) >= 0) scrollToSection(page, route.anchor, reduceMotion ? "auto" : "smooth");
      else {
        window.scrollTo({ top: 0, behavior: "auto" });
        if (ids.length) setActiveSection(page, ids[0], false);
      }
    }, 30);
  }

  function buildSearchIndex() {
    var results = [];
    data.chapters.forEach(function (chapter) {
      var state = chapterState(chapter);
      results.push({ title: chapter.title, text: chapter.description + " " + chapter.topics.join(" "), href: "#/" + chapter.id, status: state.label + (state.status === "in-progress" ? " · " + state.progress.percentage + "%" : "") });
    });
    document.querySelectorAll('[data-page^="chapter-"] .guide-section').forEach(function (section) {
      var page = section.closest(".page");
      var heading = section.querySelector("h2, h3");
      if (page && heading && section.id) results.push({ title: heading.textContent.trim(), text: section.textContent.trim(), href: "#/" + page.dataset.page + "/" + section.id, status: chapterById(page.dataset.page).title });
    });
    return results;
  }

  function renderSearch(query) {
    var normalized = query.trim().toLocaleLowerCase("ru");
    var container = document.querySelector("[data-search-results]");
    document.querySelectorAll("[data-home-search]").forEach(function (input) { if (input.value !== query) input.value = query; });
    document.querySelectorAll(".search-field .search-clear").forEach(function (button) { button.hidden = !query; });
    if (!normalized) { container.hidden = true; container.innerHTML = ""; return; }
    var matches = buildSearchIndex().filter(function (item) { return (item.title + " " + item.text).toLocaleLowerCase("ru").includes(normalized); }).slice(0, 12);
    container.hidden = false;
    container.innerHTML = matches.length ? '<strong>Результаты поиска</strong><div>' + matches.map(function (item) { return '<a href="' + item.href + '"><span>' + escapeHtml(item.title) + "</span><small>" + escapeHtml(item.status) + "</small></a>"; }).join("") + "</div>" : '<p class="search-empty">Ничего не найдено. Попробуйте изменить запрос.</p>';
  }

  function enhanceSearchFields() {
    document.querySelectorAll(".search-field, .sidebar-search").forEach(function (field) {
      if (!field.querySelector(".search-clear")) field.insertAdjacentHTML("beforeend", '<button class="search-clear" type="button" aria-label="Очистить поиск" hidden>×</button>');
    });
  }

  function filterToc(input) {
    var shell = input.closest(".guide-shell");
    var normalized = input.value.trim().toLocaleLowerCase("ru");
    var links = Array.from(shell.querySelectorAll(".chapter-nav a, .toc-link"));
    links.forEach(function (link) { link.hidden = Boolean(normalized && !link.textContent.toLocaleLowerCase("ru").includes(normalized)); });
    var clear = input.closest("label").querySelector(".search-clear");
    if (clear) clear.hidden = !input.value;
  }

  function initAccordions() {
    document.querySelectorAll(".accordion-item").forEach(function (item, index) {
      var trigger = item.querySelector(".accordion-trigger");
      var content = item.querySelector(".accordion-content");
      var triggerId = "accordion-trigger-" + index;
      var contentId = "accordion-content-" + index;
      trigger.id = triggerId;
      trigger.setAttribute("aria-controls", contentId);
      content.id = contentId;
      content.setAttribute("role", "region");
      content.setAttribute("aria-labelledby", triggerId);
      content.setAttribute("aria-hidden", String(!item.classList.contains("expanded")));
    });
  }

  function initNavigation() {
    document.querySelectorAll(".chapter-nav").forEach(function (nav) { nav.innerHTML = navMarkup(getRoute().page); });
    document.querySelectorAll("[data-mobile-menu]").forEach(function (menu) { menu.innerHTML = mobileMenuMarkup(); });
  }

  document.addEventListener("click", function (event) {
    var themeButton = event.target.closest("[data-theme-toggle]");
    if (themeButton) { setTheme(root.dataset.theme === "dark" ? "light" : "dark"); return; }

    var menuButton = event.target.closest("[data-menu-toggle]");
    if (menuButton) {
      var page = menuButton.closest(".page");
      var menu = page.querySelector("[data-mobile-menu]");
      var open = !menu.classList.contains("open");
      closeMenus();
      menu.classList.toggle("open", open);
      menuButton.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("menu-open", open);
      return;
    }

    var tocToggle = event.target.closest("[data-toc-toggle]");
    if (tocToggle) {
      var tocPanel = document.getElementById(tocToggle.getAttribute("aria-controls"));
      var shouldOpen = tocPanel.hidden;
      closeMenus();
      tocPanel.hidden = !shouldOpen;
      tocToggle.setAttribute("aria-expanded", String(shouldOpen));
      document.body.classList.toggle("menu-open", shouldOpen);
      return;
    }

    var tocLink = event.target.closest(".toc-link");
    if (tocLink) {
      event.preventDefault();
      var hrefParts = tocLink.getAttribute("href").replace(/^#\/?/, "").split("/");
      var tocPage = hrefParts[0];
      var sectionId = hrefParts[1];
      history.pushState(null, "", "#/" + tocPage + "/" + sectionId);
      closeMenus();
      document.querySelectorAll(".page").forEach(function (item) { item.hidden = item.dataset.page !== tocPage; });
      document.body.dataset.route = tocPage;
      setActiveSection(tocPage, sectionId, false);
      scrollToSection(tocPage, sectionId);
      return;
    }

    if (event.target.closest("[data-mobile-menu] a")) closeMenus();

    var row = event.target.closest(".check-row[data-check-index]");
    if (row) {
      var list = row.closest("[data-checklist]");
      var key = list.dataset.checklist;
      var index = Number(row.dataset.checkIndex);
      checklistState[key][index] = !checklistState[key][index];
      writeStoredList(key);
      renderChecklists(); updateOverallProgress(); return;
    }

    var reset = event.target.closest("[data-reset]");
    if (reset) {
      var resetList = reset.closest(".checklist-card, .final-card").querySelector("[data-checklist]");
      var resetKey = resetList.dataset.checklist;
      if (checklistState[resetKey].some(Boolean) && !window.confirm("Сбросить отмеченные пункты этого чек-листа?")) return;
      checklistState[resetKey] = checklistState[resetKey].map(function () { return false; });
      writeStoredList(resetKey);
      renderChecklists(); updateOverallProgress(); showToast("Чек-лист сброшен"); return;
    }

    if (event.target.closest("[data-reset-all]")) {
      var hasProgress = Object.keys(checklistState).some(function (key) { return checklistState[key].some(Boolean); });
      if (hasProgress && !window.confirm("Сбросить весь прогресс по всем главам? Тема оформления сохранится.")) return;
      Object.keys(checklistState).forEach(function (key) {
        checklistState[key] = checklistState[key].map(function () { return false; });
        try { localStorage.removeItem(storageKey(key)); } catch (error) {}
      });
      renderChecklists(); updateOverallProgress(); showToast("Весь прогресс сброшен"); return;
    }

    var copy = event.target.closest("[data-copy]");
    if (copy) {
      var original = copy.dataset.originalLabel || copy.textContent.trim();
      copy.dataset.originalLabel = original;
      copy.classList.add("loading"); copy.disabled = true;
      Promise.resolve(navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(copy.dataset.copy) : Promise.reject()).then(function () {
        copy.classList.remove("loading"); copy.classList.add("success"); copy.textContent = "Скопировано";
        window.setTimeout(function () { copy.classList.remove("success"); copy.disabled = false; copy.textContent = original; }, 1600);
      }).catch(function () { copy.classList.remove("loading"); copy.disabled = false; showToast("Не удалось скопировать"); });
      return;
    }

    var accordion = event.target.closest(".accordion-trigger");
    if (accordion) {
      var item = accordion.closest(".accordion-item");
      var openAccordion = !item.classList.contains("expanded");
      item.classList.toggle("expanded", openAccordion);
      accordion.setAttribute("aria-expanded", String(openAccordion));
      document.getElementById(accordion.getAttribute("aria-controls")).setAttribute("aria-hidden", String(!openAccordion));
      return;
    }

    var orientation = event.target.closest("[data-orientation]");
    if (orientation) {
      orientation.parentElement.querySelectorAll("[data-orientation]").forEach(function (button) { button.classList.toggle("active", button === orientation); button.setAttribute("aria-pressed", String(button === orientation)); });
      showToast("Выбрано: " + orientation.textContent.trim()); return;
    }

    var clear = event.target.closest(".search-clear");
    if (clear) {
      var input = clear.closest("label").querySelector("input");
      input.value = ""; input.dispatchEvent(new Event("input", { bubbles: true })); input.focus(); return;
    }

    var download = event.target.closest("[data-download-checklist]");
    if (download) {
      var finalCard = download.closest(".final-card");
      var lines = Array.from(finalCard.querySelectorAll(".check-row")).map(function (item) { return (item.getAttribute("aria-checked") === "true" ? "[x] " : "[ ] ") + item.textContent.trim(); });
      var url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }));
      var link = document.createElement("a"); link.href = url; link.download = "print-guide-checklist.txt"; link.click(); URL.revokeObjectURL(url);
    }
  });

  document.addEventListener("input", function (event) {
    if (event.target.matches("[data-home-search]")) renderSearch(event.target.value);
    if (event.target.matches("[data-guide-search]")) filterToc(event.target);
  });

  document.addEventListener("keydown", function (event) { if (event.key === "Escape") closeMenus(); });
  window.addEventListener("hashchange", activateRoute);

  renderPlaceholderPages();
  loadChecklistState();
  renderChecklists();
  initNavigation();
  initMobileToc();
  enhanceSearchFields();
  initAccordions();
  initScrollSpy();
  updateThemeControls();
  updateOverallProgress();
  activateRoute();
})();
