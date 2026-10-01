(function () {
  "use strict";

  var fontPromise = null;
  var regularFontPath = "assets/fonts/geist-400.ttf";
  var boldFontPath = "assets/fonts/geist-700.ttf";

  function bufferToBase64(buffer) {
    var bytes = new Uint8Array(buffer);
    var chunkSize = 0x8000;
    var binary = "";
    for (var offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(offset, offset + chunkSize));
    }
    return btoa(binary);
  }

  function fetchFont(path) {
    return fetch(path).then(function (response) {
      if (!response.ok) throw new Error("Не удалось загрузить шрифт для PDF");
      return response.arrayBuffer();
    }).then(bufferToBase64);
  }

  function loadFonts() {
    if (!fontPromise) {
      fontPromise = Promise.all([fetchFont(regularFontPath), fetchFont(boldFontPath)]).catch(function (error) {
        fontPromise = null;
        throw error;
      });
    }
    return fontPromise;
  }

  function addFonts(doc, fonts) {
    doc.addFileToVFS("Geist-Regular.ttf", fonts[0]);
    doc.addFont("Geist-Regular.ttf", "Geist", "normal");
    doc.addFileToVFS("Geist-Bold.ttf", fonts[1]);
    doc.addFont("Geist-Bold.ttf", "Geist", "bold");
  }

  function addPageHeader(doc, pageNumber, margin) {
    if (pageNumber === 1) return;
    doc.setFont("Geist", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Print Guide", margin, 12);
  }

  function createDocument(options, fonts) {
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error("Библиотека PDF не загружена");

    var doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    addFonts(doc, fonts);

    var pageWidth = doc.internal.pageSize.getWidth();
    var pageHeight = doc.internal.pageSize.getHeight();
    var margin = 18;
    var contentWidth = pageWidth - margin * 2;
    var checkboxSize = 4;
    var checkboxGap = 4;
    var textWidth = contentWidth - checkboxSize - checkboxGap;
    var lineHeight = 5.2;
    var itemGap = 3.2;
    var bottomLimit = pageHeight - 18;
    var pageNumber = 1;
    var y = 20;

    doc.setTextColor(15, 23, 42);
    doc.setFont("Geist", "bold");
    doc.setFontSize(19);
    doc.text("Print Guide", margin, y);
    y += 9;

    doc.setFontSize(13);
    var titleLines = doc.splitTextToSize(options.title, contentWidth);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 6.5 + 4;

    doc.setFont("Geist", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Дата скачивания: " + options.date, margin, y);
    y += 10;

    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y - 4, pageWidth - margin, y - 4);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10.5);

    options.items.forEach(function (item) {
      var lines = doc.splitTextToSize(item, textWidth);
      var itemHeight = Math.max(checkboxSize, lines.length * lineHeight) + itemGap;

      if (y + itemHeight > bottomLimit) {
        doc.addPage();
        pageNumber += 1;
        addPageHeader(doc, pageNumber, margin);
        doc.setFont("Geist", "normal");
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        y = 22;
      }

      doc.setDrawColor(71, 85, 105);
      doc.setLineWidth(0.35);
      doc.rect(margin, y - 3.2, checkboxSize, checkboxSize);
      doc.text(lines, margin + checkboxSize + checkboxGap, y);
      y += itemHeight;
    });

    var totalPages = doc.getNumberOfPages();
    for (var page = 1; page <= totalPages; page += 1) {
      doc.setPage(page);
      doc.setFont("Geist", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(page + " / " + totalPages, pageWidth - margin, pageHeight - 10, { align: "right" });
    }

    return doc;
  }

  function download(options) {
    return loadFonts().then(function (fonts) {
      var doc = createDocument(options, fonts);
      doc.save(options.filename);
      return doc;
    });
  }

  window.PRINT_GUIDE_PDF = { createDocument: createDocument, download: download };
})();
