(function () {
  var root = document.documentElement;
  var toast = document.getElementById("toast");
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  var storedTheme = localStorage.getItem("print-guide-AETrLiqP34VUzEbh3vIkXH-theme");
  var theme = storedTheme || "dark";

  function setTheme(next) {
    theme = next;
    root.dataset.theme = theme;
    localStorage.setItem("print-guide-AETrLiqP34VUzEbh3vIkXH-theme", theme);
    document.querySelectorAll("[data-theme-label]").forEach(function (label) {
      label.textContent = theme === "dark" ? "Темная тема" : "Светлая тема";
    });
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () {
      toast.classList.remove("visible");
    }, 1800);
  }

  function getRoute() {
    var hash = window.location.hash.replace(/^#\/?/, "");
    var parts = hash.split("/").filter(Boolean);
    return {
      page: parts[0] || "home",
      anchor: parts[1] || ""
    };
  }

  function activateRoute() {
    var route = getRoute();
    var available = ["home", "chapter-1", "chapter-2"];
    var page = available.indexOf(route.page) >= 0 ? route.page : "home";

    document.querySelectorAll(".page").forEach(function (item) {
      item.hidden = item.dataset.page !== page;
    });
    document.body.dataset.route = page;
    document.querySelectorAll("[data-mobile-menu]").forEach(function (menu) {
      menu.classList.remove("open");
    });
    document.body.classList.remove("menu-open");

    window.setTimeout(function () {
      if (route.anchor) {
        var target = document.getElementById(route.anchor);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    }, 180);
  }

  function readChecklistState() {
    try {
      return JSON.parse(localStorage.getItem("print-guide-AETrLiqP34VUzEbh3vIkXH-v2-checklists") || "{}");
    } catch (error) {
      return {};
    }
  }

  function writeChecklistState() {
    var result = { version: 3, lists: {} };
    document.querySelectorAll("[data-checklist]").forEach(function (list) {
      result.lists[list.dataset.checklist] = Array.from(list.querySelectorAll(".check-row")).map(function (row) {
        return row.classList.contains("checked");
      });
    });
    localStorage.setItem("print-guide-AETrLiqP34VUzEbh3vIkXH-v2-checklists", JSON.stringify(result));
  }

  function updateChecklist(list) {
    var rows = Array.from(list.querySelectorAll(".check-row"));
    var checked = rows.filter(function (row) {
      return row.classList.contains("checked");
    }).length;
    var percent = rows.length ? Math.round((checked / rows.length) * 100) : 0;
    var counter = list.closest(".checklist-card, .final-card").querySelector("[data-counter]");
    var progress = list.closest(".checklist-card, .final-card").querySelector("[data-check-progress]");
    if (counter) {
      if (counter.dataset.counter === "percent") {
        counter.textContent = "Чек-лист пройден на " + percent + "%";
      } else {
        counter.textContent = checked + " из " + rows.length + " (" + percent + "%)";
      }
    }
    if (progress) progress.style.width = Math.max(percent, 2.5) + "%";
  }

  function restoreChecklists() {
    var saved = readChecklistState();
    document.querySelectorAll("[data-checklist]").forEach(function (list) {
      var rows = list.querySelectorAll(".check-row");
      var state = saved.version === 3 && saved.lists ? saved.lists[list.dataset.checklist] : null;
      if (Array.isArray(state)) {
        rows.forEach(function (row, index) {
          row.classList.toggle("checked", Boolean(state[index]));
        });
      }
      updateChecklist(list);
    });
  }

  function filterCards(query) {
    var normalized = query.trim().toLocaleLowerCase("ru");
    document.querySelectorAll("[data-searchable]").forEach(function (card) {
      card.hidden = normalized && !card.textContent.toLocaleLowerCase("ru").includes(normalized);
    });
    document.querySelectorAll("[data-home-search]").forEach(function (input) {
      if (input.value !== query) input.value = query;
    });
  }

  function filterToc(input) {
    var shell = input.closest(".guide-shell");
    var normalized = input.value.trim().toLocaleLowerCase("ru");
    var links = Array.from(shell.querySelectorAll(".toc-link"));
    links.forEach(function (link) {
      link.hidden = normalized && !link.textContent.toLocaleLowerCase("ru").includes(normalized);
    });
    if (normalized) {
      var first = links.find(function (link) { return !link.hidden; });
      if (first) first.focus();
    }
  }

  document.addEventListener("click", function (event) {
    var themeButton = event.target.closest("[data-theme-toggle]");
    if (themeButton) {
      setTheme(theme === "dark" ? "light" : "dark");
      return;
    }

    var menuButton = event.target.closest("[data-menu-toggle]");
    if (menuButton) {
      var page = menuButton.closest(".page");
      var menu = page.querySelector("[data-mobile-menu]");
      menu.classList.toggle("open");
      document.body.classList.toggle("menu-open", menu.classList.contains("open"));
      return;
    }

    var row = event.target.closest(".check-row");
    if (row) {
      row.classList.toggle("checked");
      var list = row.closest("[data-checklist]");
      updateChecklist(list);
      writeChecklistState();
      return;
    }

    var reset = event.target.closest("[data-reset]");
    if (reset) {
      var card = reset.closest(".checklist-card, .final-card");
      card.querySelectorAll(".check-row").forEach(function (item) {
        item.classList.remove("checked");
      });
      updateChecklist(card.querySelector("[data-checklist]"));
      writeChecklistState();
      showToast("Чек-лист сброшен");
      return;
    }

    var copy = event.target.closest("[data-copy]");
    if (copy) {
      navigator.clipboard.writeText(copy.dataset.copy).then(function () {
        showToast("Скопировано: " + copy.dataset.copy);
      });
      return;
    }

    var accordion = event.target.closest(".accordion-trigger");
    if (accordion) {
      var item = accordion.closest(".accordion-item");
      item.classList.toggle("expanded");
      accordion.setAttribute("aria-expanded", String(item.classList.contains("expanded")));
      return;
    }

    var orientation = event.target.closest("[data-orientation]");
    if (orientation) {
      orientation.parentElement.querySelectorAll("[data-orientation]").forEach(function (button) {
        button.classList.toggle("active", button === orientation);
      });
      showToast("Выбрано: " + orientation.textContent.trim());
      return;
    }

    var download = event.target.closest("[data-download-checklist]");
    if (download) {
      var finalCard = download.closest(".final-card");
      var lines = Array.from(finalCard.querySelectorAll(".check-row")).map(function (item) {
        return (item.classList.contains("checked") ? "[x] " : "[ ] ") + item.textContent.trim();
      });
      var blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "print-guide-checklist.txt";
      link.click();
      URL.revokeObjectURL(url);
    }
  });

  document.addEventListener("input", function (event) {
    if (event.target.matches("[data-home-search]")) filterCards(event.target.value);
    if (event.target.matches("[data-guide-search]")) filterToc(event.target);
  });

  window.addEventListener("hashchange", activateRoute);
  setTheme(theme);
  restoreChecklists();
  activateRoute();
})();
