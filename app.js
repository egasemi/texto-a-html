"use strict";

const sourceText = document.querySelector("#source-text");
const documentTitle = document.querySelector("#document-title");
const fileName = document.querySelector("#file-name");
const pasteButton = document.querySelector("#paste-button");
const clearButton = document.querySelector("#clear-button");
const downloadButton = document.querySelector("#download-button");
const previewFrame = document.querySelector("#preview-frame");
const characterCount = document.querySelector("#character-count");
const wordCount = document.querySelector("#word-count");
const fileBadge = document.querySelector("#file-badge");
const statusMessage = document.querySelector("#status-message");

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const getSafeFileName = () => {
  const cleaned = fileName.value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/[. ]+$/g, "");

  const baseName = cleaned || "documento";
  return baseName.toLowerCase().endsWith(".html") ? baseName : `${baseName}.html`;
};

const buildHtmlDocument = (text, title) => {
  const safeTitle = escapeHtml(title.trim() || "Documento");
  const safeText = escapeHtml(text.replace(/\r\n?/g, "\n"));

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #1c2937;
      background: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
    }
    main {
      width: min(760px, 100%);
      margin: 0 auto;
      padding: clamp(24px, 6vw, 64px) clamp(20px, 5vw, 48px);
      font-size: 18px;
      line-height: 1.65;
      overflow-wrap: anywhere;
      tab-size: 4;
      white-space: pre-wrap;
    }
    @media print {
      main { width: auto; padding: 0; }
    }
  </style>
</head>
<body>
  <main>${safeText}</main>
</body>
</html>`;
};

const buildEmptyPreview = () => `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      display: grid;
      min-height: 100vh;
      margin: 0;
      place-items: center;
      color: #6b7b8b;
      background: #fff;
      font: 16px/1.5 Arial, Helvetica, sans-serif;
      text-align: center;
    }
    p { max-width: 24rem; padding: 2rem; }
  </style>
</head>
<body><p>La vista previa aparecerá cuando pegues o escribas un texto.</p></body>
</html>`;

const pluralize = (amount, singular, plural) =>
  `${amount.toLocaleString("es-AR")} ${amount === 1 ? singular : plural}`;

const showStatus = (message, type = "success") => {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", type === "error");
};

const updateInterface = () => {
  const text = sourceText.value;
  const trimmedText = text.trim();
  const words = trimmedText ? trimmedText.split(/\s+/u).length : 0;
  const hasText = text.length > 0;

  characterCount.textContent = pluralize(text.length, "carácter", "caracteres");
  wordCount.textContent = pluralize(words, "palabra", "palabras");
  clearButton.disabled = !hasText;
  downloadButton.disabled = !hasText;
  fileBadge.textContent = getSafeFileName();
  previewFrame.srcdoc = hasText
    ? buildHtmlDocument(text, documentTitle.value)
    : buildEmptyPreview();
};

const pasteFromClipboard = async () => {
  showStatus("");

  if (!navigator.clipboard?.readText) {
    sourceText.focus();
    showStatus("Tu navegador no permitió leer el portapapeles. Pegá con Ctrl/⌘ + V.", "error");
    return;
  }

  try {
    const text = await navigator.clipboard.readText();

    if (!text) {
      sourceText.focus();
      showStatus("El portapapeles no contiene texto.", "error");
      return;
    }

    sourceText.value = text;
    updateInterface();
    sourceText.focus();
    sourceText.setSelectionRange(text.length, text.length);
    showStatus("Texto pegado.");
  } catch {
    sourceText.focus();
    showStatus("No se pudo acceder al portapapeles. Pegá con Ctrl/⌘ + V.", "error");
  }
};

const downloadHtml = () => {
  if (!sourceText.value.length) return;

  const output = buildHtmlDocument(sourceText.value, documentTitle.value);
  const blob = new Blob([output], { type: "text/html;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = getSafeFileName();
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
  showStatus(`${getSafeFileName()} descargado.`);
};

sourceText.addEventListener("input", () => {
  showStatus("");
  updateInterface();
});

documentTitle.addEventListener("input", updateInterface);
fileName.addEventListener("input", updateInterface);
pasteButton.addEventListener("click", pasteFromClipboard);
downloadButton.addEventListener("click", downloadHtml);

clearButton.addEventListener("click", () => {
  sourceText.value = "";
  showStatus("");
  updateInterface();
  sourceText.focus();
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && sourceText.value.length) {
    event.preventDefault();
    downloadHtml();
  }
});

updateInterface();
