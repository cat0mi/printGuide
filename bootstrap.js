(function () {
  var chapters = ["chapter-1", "chapter-2"];

  Promise.all(
    chapters.map(function (chapter) {
      return fetch("chapters/" + chapter + "/index.html").then(function (response) {
        if (!response.ok) throw new Error("Не удалось загрузить " + chapter);
        return response.text();
      });
    })
  )
    .then(function (templates) {
      templates.forEach(function (template, index) {
        var slot = document.querySelector('[data-chapter-slot="' + chapters[index] + '"]');
        slot.outerHTML = template;
      });

      var app = document.createElement("script");
      app.src = "app.js";
      document.body.appendChild(app);
    })
    .catch(function (error) {
      console.error(error);
      var appRoot = document.getElementById("app");
      appRoot.insertAdjacentHTML(
        "beforeend",
        '<p class="load-error">Не удалось загрузить главы. Обновите страницу.</p>'
      );
    });
})();
