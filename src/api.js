/**
 * @file api.js
 * @description Core functionality for the ZIG Certificate Generator application.
 * This file handles UI interactions, certificate generation, and settings management.
 * @version 2.0.0
 * @date 2025-11-25
 */

// ===== IMPORTS =====
const { jsPDF } = window.jspdf;

// ===== DOM ELEMENT SELECTIONS =====
const $ = (selector) => document.querySelector(selector);
const canvas = $("#canvas");
const ctx = canvas.getContext("2d");
const memberNameInput = $("#memberName");
const membershipCategoryInput = $("#membershipCategory");
const membershipIDInput = $("#membershipID");
const previewPlaceholder = $("#preview-placeholder");
const previewWindow = $("#preview");
const categories = Array.from(document.getElementById("categories").getElementsByTagName("option"));
const modalTitle = $("#modalInfoTitle");
const modalContent = $("#modalInfoContent");
const multiPurposeBtn = $("#multiPurposeBtn");
const year = new Date();

// ===== STATE =====
let category = "";
let member = "";
let membershipNumber = "";
let settings = {
  theme: "dark",
  accentColor: "#667eea",
  fontSize: "medium",
};

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", () => {
  setupPlatformUI();
  setupTitleBar();
  setupNavigation();
  loadSettings();
  setupEventListeners();
});

// ===== PLATFORM AND UI SETUP =====

/**
 * @description Adjusts the UI based on whether the app is running in Electron or a web browser.
 */
function setupPlatformUI() {
  const isElectron = typeof navigator === "object" && typeof navigator.userAgent === "string" && navigator.userAgent.indexOf("Electron") >= 0;
  if (isElectron) {
    $(".status-bar")?.style.setProperty("display", "flex");
  } else {
    $(".title-bar")?.classList.add("hide");
    $(".status-bar")?.style.setProperty("display", "none");
    $(".updates")?.classList.add("hide");
    $(".app-container")?.style.setProperty("height", "calc(100vh - 10px)");
    $(".app-container")?.style.setProperty("display", "flex");
    createWebAppFooter();
  }
}

/**
 * @description Creates a footer for the web application version.
 */
function createWebAppFooter() {
  const footer = document.createElement("div");
  footer.style.cssText = `
    position: fixed; bottom: 0; right: 0; left: 0; width: 100%;
    background: var(--bg-secondary); color: var(--text-primary);
    padding: 12px 20px; border-top: 1px solid var(--border-color);
    font-size: 14px; transition: all 0.3s ease;
  `;
  footer.innerHTML = `
    <footer>
      <img src='zigLogo.png' width='25' height='25' alt='ZIG'>
      Rights Reserved | Powered by
      <a href='https://allankayz.co.zw'>
        <img src='AKLogo.ico' width='20' height='20' alt='AllanKayz'>
      </a>
    </footer>
  `;
  document.body.appendChild(footer);
}

/**
 * @description Sets up the event listeners for the title bar controls (minimize, maximize, close).
 * This function is specific to the Electron environment.
 */
function setupTitleBar() {
  $("#min-btn")?.addEventListener("click", () => window.electronAPI?.minimize());
  $("#max-btn")?.addEventListener("click", () => {
    const maximized = window.outerWidth === screen.availWidth && window.outerHeight === screen.availHeight;
    maximized ? window.electronAPI?.unmaximize() : window.electronAPI?.maximize();
  });
  $("#close-btn")?.addEventListener("click", () => window.electronAPI?.close());
}

// ===== NAVIGATION AND VIEW MANAGEMENT =====

const views = {
  create: { title: "Create New Certificate", viewId: "createView" },
  templates: { title: "Templates", viewId: "templatesView" },
  history: { title: "Certificate History", viewId: "historyView" },
  settings: { title: "Settings", viewId: "settingsView" },
  update: { title: "Software Updates", viewId: "updateView" },
};

/**
 * @description Sets up the navigation menu to switch between different views.
 */
function setupNavigation() {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", function () {
      document.querySelectorAll(".nav-item").forEach((i) => i.classList.remove("active"));
      this.classList.add("active");
      const viewName = this.getAttribute("data-view");
      const view = views[viewName];
      if (view) {
        $("#pageTitle").textContent = view.title;
        document.querySelectorAll(".page-view").forEach((v) => v.classList.remove("active"));
        $("#" + view.viewId)?.classList.add("active");
        if (window.innerWidth <= 768) {
          $(".sidebar")?.classList.remove("open");
        }
      }
    });
  });
}

/**
 * @description Toggles the sidebar visibility.
 */
function toggleSidebar() {
  const sidebar = $(".sidebar");
  if (!sidebar) return;
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle("open");
  } else {
    sidebar.classList.toggle("collapsed");
  }
}

// ===== EVENT LISTENERS =====

/**
 * @description Sets up all the event listeners for the application.
 */
function setupEventListeners() {
  // Sidebar
  document.addEventListener("click", (e) => {
    const sidebar = $(".sidebar");
    const menuToggle = $(".menu-toggle");
    if (window.innerWidth <= 768 && sidebar?.classList.contains("open") && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
      sidebar.classList.remove("open");
    }
  });

  // Modals
  $("#certificateModal")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal("certificate");
  });
  $("#infoModal")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal("info");
  });

  // Inputs
  memberNameInput?.addEventListener("input", () => {
    member = capitalizeWords(memberNameInput.value.trim());
  });
  membershipCategoryInput?.addEventListener("change", handleCategoryChange);
  membershipIDInput?.addEventListener("input", () => {
    membershipNumber = "ZIG" + membershipIDInput.value.trim();
  });

  // Settings
  $('select[name="theme"]')?.addEventListener("change", function () {
    settings.theme = this.value;
    saveSettings();
  });
  $(".color-picker")?.addEventListener("input", function () {
    settings.accentColor = this.value;
    saveSettings();
  });
  $('select[name="fontSize"]')?.addEventListener("change", function () {
    settings.fontSize = this.value;
    saveSettings();
  });
  $(".save-appearance")?.addEventListener("click", () => {
    saveSettings();
    showNotification("Settings saved successfully!");
  });

  // System Theme Listener
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
      if (settings.theme === "system") applyTheme("system");
    });
  }
}

// ===== CERTIFICATE LOGIC =====

const image = new Image();
let imageLoaded = false;

/**
 * @description Pre-loads the certificate template image.
 */
function loadImage() {
  image.src = "ZiGCertTemplate.png";
  image.onload = () => {
    imageLoaded = true;
    drawImage(member, category, membershipNumber);
  };
}
loadImage();

/**
 * @description Handles the change event for the membership category input.
 */
function handleCategoryChange() {
  if (!categories.some((opt) => opt.value === membershipCategoryInput.value)) {
    openModal("catError");
    membershipCategoryInput.value = "";
    category = "";
    return;
  }
  const endYear = hasDatePassed(`${year.getFullYear()}-06-01`) ? year.getFullYear() + 1 : year.getFullYear();
  category = `REGISTERED AS A GEOMATICS ${membershipCategoryInput.value} UNTIL 31 AUGUST ${endYear}`;
}

/**
 * @description Draws the certificate on the canvas.
 * @param {string} member - The name of the member.
 * @param {string} category - The membership category.
 * @param {string} membershipNumber - The membership number.
 */
function drawImage(member, category, membershipNumber) {
  if (!imageLoaded) return;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  ctx.font = "90px Charm";
  ctx.fillStyle = "#262264";
  const memberText = centerText(capitalizeWords(member), 545);
  ctx.fillText(...memberText);

  ctx.font = "40px 'Century Gothic Paneuropean'";
  ctx.fillStyle = "#262264";
  const subtitleText = centerText("IS A MEMBER OF ZIMBABWE INSTITUTE OF GEOMATICS", 630);
  ctx.fillText(...subtitleText);

  const categoryText = centerText(category.toUpperCase(), 680);
  ctx.fillText(...categoryText);

  ctx.font = "44px 'Liberation Mono'";
  ctx.fillStyle = "#262264";
  ctx.fillText(membershipNumber, 240, 860);
}

/**
 * @description Previews the certificate in the UI.
 */
function preview() {
  if (validateFields()) {
    previewPlaceholder?.classList.add("hide");
    drawImage(member, category, membershipNumber);
    const dataURL = canvas.toDataURL();
    const img = new Image();
    img.src = dataURL;
    previewWindow.innerHTML = "";
    previewWindow.appendChild(img);
  }
}

/**
 * @description Saves the certificate as a PDF or PNG file.
 * @param {string} downloadFileType - The file type to save the certificate as ('PDF' or 'PNG').
 */
function saveCertificate(downloadFileType) {
  drawImage(member, category, membershipNumber);
  const imgData = canvas.toDataURL();
  switch (downloadFileType) {
    case "PDF": {
      const certpdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      certpdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      certpdf.save(`Certificate-${capitalizeWords(member)}.pdf`);
      break;
    }
    case "PNG": {
      multiPurposeBtn.href = imgData;
      multiPurposeBtn.download = `Certificate-${capitalizeWords(member)}.png`;
      break;
    }
  }
}

/**
 * @description Resets the form fields and the certificate preview.
 */
function reset() {
  memberNameInput.value = "";
  membershipCategoryInput.value = "";
  membershipIDInput.value = "";
  member = "";
  category = "";
  membershipNumber = "";
  previewWindow.innerHTML = "";
  previewPlaceholder?.classList.remove("hide");
}

// ===== VALIDATION AND MODALS =====

/**
 * @description Validates the form fields.
 * @returns {boolean} - True if the fields are valid, false otherwise.
 */
function validateFields() {
  if (!memberNameInput.value || !membershipCategoryInput.value || !membershipIDInput.value) {
    openModal("noInfo");
    return false;
  }
  if (!member || !category || !membershipNumber) {
    openModal("error");
    return false;
  }
  if (!categories.some((opt) => opt.value === membershipCategoryInput.value)) {
    openModal("catError");
    return false;
  }
  return true;
}

/**
 * @description Checks for errors and opens the certificate modal if the fields are valid.
 */
function checkForErrors() {
  if (validateFields()) openModal("certificate");
}

/**
 * @description Opens a modal dialog.
 * @param {string} modalType - The type of modal to open.
 */
function openModal(modalType) {
  if (modalType === "certificate") {
    $("#certificateModal")?.classList.add("active");
  } else {
    $("#infoModal")?.classList.add("active");
    switch (modalType) {
      case "noInfo":
      case "error":
        modalTitle.innerText = "Error";
        modalContent.innerText = "Missing Information. Please check all fields.";
        break;
      case "catError":
        modalTitle.innerText = "Error";
        modalContent.innerText = "Insert correct membership category";
        break;
    }
  }
}

/**
 * @description Closes a modal dialog.
 * @param {string} modalType - The type of modal to close.
 */
function closeModal(modalType) {
  $(`#${modalType}Modal`)?.classList.remove("active");
}

// ===== UPDATES LOGIC =====

/**
 * @description Checks for application updates.
 */
function checkForUpdates() {
  const latestVersionEl = $("#latestVersion");
  const banner = $("#updateAvailableBanner");
  latestVersionEl.textContent = "Checking...";
  setTimeout(() => {
    latestVersionEl.textContent = "2.0.0";
    banner.style.display = "flex";
  }, 1500);
}

/**
 * @description Navigates to the update view and checks for updates.
 */
function checkForUpdatesFromStatus() {
  document.querySelectorAll(".nav-item").forEach((i) => i.classList.remove("active"));
  document.querySelector('[data-view="update"]')?.classList.add("active");
  $("#pageTitle").textContent = "Software Updates";
  document.querySelectorAll(".page-view").forEach((v) => v.classList.remove("active"));
  $("#updateView")?.classList.add("active");
  checkForUpdates();
}

/**
 * @description Simulates the update process.
 */
function startUpdate() {
  const progressDiv = $("#updateProgress");
  const progressFill = $("#progressFill");
  const statusText = $("#updateStatus");
  const banner = $("#updateAvailableBanner");

  banner.style.display = "none";
  progressDiv.style.display = "block";

  let progress = 0;
  const statuses = [
    "Preparing download...",
    "Downloading update... (0%)",
    "Downloading update... (25%)",
    "Downloading update... (50%)",
    "Downloading update... (75%)",
    "Downloading update... (100%)",
    "Installing update...",
    "Finalizing installation...",
    "Update complete! Restart required.",
  ];

  const interval = setInterval(() => {
    if (progress <= 100) {
      progressFill.style.width = `${progress}%`;
      const statusIndex = Math.floor((progress / 100) * (statuses.length - 1));
      statusText.textContent = statuses[statusIndex];
      progress += 2;
    } else {
      clearInterval(interval);
      statusText.innerHTML = "<strong>Update installed successfully!</strong> Please restart the application.";
    }
  }, 100);
}

// ===== APPEARANCE SETTINGS =====

/**
 * @description Loads user settings from local storage and applies them to the UI.
 */
function loadSettings() {
  try {
    const savedSettings = localStorage.getItem("certificateMakerSettings");
    if (savedSettings) {
      settings = { ...settings, ...JSON.parse(savedSettings) };
    }
  } catch {
    // Fallback to default settings
  }
  applySettings();
}

/**
 * @description Saves the current settings to local storage and applies them to the UI.
 */
function saveSettings() {
  localStorage.setItem("certificateMakerSettings", JSON.stringify(settings));
  applySettings();
}

/**
 * @description Applies all appearance settings to the UI.
 */
function applySettings() {
  applyTheme(settings.theme);
  applyAccentColor(settings.accentColor);
  applyFontSize(settings.fontSize);
  updateFormControls();
}

/**
 * @description Applies the selected theme to the application.
 * @param {string} theme - The theme to apply ('light', 'dark', or 'system').
 */
function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  const styles = theme === "light"
    ? {
        "--bg-primary": "#ffffff",
        "--bg-secondary": "#f5f5f5",
        "--bg-tertiary": "#e5e5e5",
        "--text-primary": "#333333",
        "--text-secondary": "#666666",
        "--border-color": "#dddddd",
      }
    : {
        "--bg-primary": "#1e1e1e",
        "--bg-secondary": "#252526",
        "--bg-tertiary": "#2d2d30",
        "--text-primary": "#cccccc",
        "--text-secondary": "#858585",
        "--border-color": "#3c3c3c",
      };
  for (const [key, value] of Object.entries(styles)) {
    document.body.style.setProperty(key, value);
  }
  if (theme === "system" && window.matchMedia) {
    applyTheme(window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  }
}

/**
 * @description Applies the selected accent color to the application.
 * @param {string} color - The accent color to apply (in hex format).
 */
function applyAccentColor(color) {
  const darkerColor = shadeColor(color, -30);
  document.documentElement.style.setProperty("--accent-primary", color);
  document.documentElement.style.setProperty("--accent-secondary", darkerColor);
  document.documentElement.style.setProperty("--accent-gradient", `linear-gradient(135deg, ${color} 0%, ${darkerColor} 100%)`);
  const preview = $(".color-preview");
  if (preview) preview.style.background = `linear-gradient(135deg, ${color} 0%, ${darkerColor} 100%)`;
}

/**
 * @description Applies the selected font size to the application.
 * @param {string} size - The font size to apply ('small', 'medium', or 'large').
 */
function applyFontSize(size) {
  const sizes = { small: "14px", medium: "18px", large: "22px" };
  document.documentElement.style.setProperty("--base-font-size", sizes[size] ?? sizes.medium);
  updateFontSizeSpecifics(size);
}

/**
 * @description Updates the font size of specific UI elements based on the selected size.
 * @param {string} size - The font size to apply ('small', 'medium', or 'large').
 */
function updateFontSizeSpecifics(size) {
  const scale = { small: 0.9, medium: 1, large: 1.1 }[size] ?? 1;
  const elements = [
    { selector: ".app-title", baseSize: 12 },
    { selector: ".sidebar-title", baseSize: 11 },
    { selector: ".nav-item", baseSize: 13 },
    { selector: ".content-title", baseSize: 16 },
    { selector: ".section-title", baseSize: 14 },
    { selector: ".form-label", baseSize: 12 },
    { selector: ".form-input, .form-select, .btn", baseSize: 13 },
  ];
  elements.forEach(({ selector, baseSize }) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.style.setProperty("font-size", `${baseSize * scale}px`);
    });
  });
}

/**
 * @description Updates the form controls in the settings view to reflect the current settings.
 */
function updateFormControls() {
  const themeSelect = $('select[name="theme"]');
  if (themeSelect) themeSelect.value = settings.theme;
  const colorPicker = $(".color-picker");
  if (colorPicker) colorPicker.value = settings.accentColor;
  const fontSizeSelect = $('select[name="fontSize"]');
  if (fontSizeSelect) fontSizeSelect.value = settings.fontSize;
}

// ===== UTILITY FUNCTIONS =====

/**
 * @description Capitalizes the first letter of each word in a string.
 * @param {string} str - The string to capitalize.
 * @returns {string} - The capitalized string.
 */
function capitalizeWords(str) {
  if (!str) return "";
  return str.replace(/\b\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

/**
 * @description Checks if a date has passed.
 * @param {string} dateString - The date to check.
 * @returns {boolean} - True if the date has passed, false otherwise.
 */
function hasDatePassed(dateString) {
  return new Date(dateString) < new Date();
}

/**
 * @description Calculates the coordinates to center a text on the canvas.
 * @param {string} value - The text to center.
 * @param {number} y - The y-coordinate.
 * @returns {Array<string|number>} - An array containing the text, x-coordinate, and y-coordinate.
 */
function centerText(value, y) {
  const textWidth = ctx.measureText(value).width;
  const startX = canvas.width / 2 - textWidth / 2;
  return [value, startX, y];
}

/**
 * @description Darkens or lightens a color by a given percentage.
 * @param {string} color - The color to shade (in hex format).
 * @param {number} percent - The percentage to shade the color by.
 * @returns {string} - The shaded color in hex format.
 */
function shadeColor(color, percent) {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);
  R = Math.min(255, Math.floor((R * (100 + percent)) / 100));
  G = Math.min(255, Math.floor((G * (100 + percent)) / 100));
  B = Math.min(255, Math.floor((B * (100 + percent)) / 100));
  return `#${R.toString(16).padStart(2, "0")}${G.toString(16).padStart(2, "0")}${B.toString(16).padStart(2, "0")}`;
}

/**
 * @description Shows a notification message.
 * @param {string} message - The message to display.
 */
function showNotification(message) {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed; top: 50px; right: 20px;
    background: var(--accent-gradient, linear-gradient(135deg,#667eea 0%,#764ba2 100%));
    color: white; padding: 12px 20px; border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10000;
    font-size: 14px; transition: all 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateX(100%)";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ===== PUBLIC API =====
window.certificateMaker = {
  checkForErrors,
  preview,
  saveCertificate,
  reset,
  checkForUpdatesFromStatus,
  startUpdate,
  toggleSidebar,
};
