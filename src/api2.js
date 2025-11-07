const { jsPDF } = window.jspdf;

// Check Platform first
if (
  typeof navigator === "object" &&
  typeof navigator.userAgent === "string" &&
  navigator.userAgent.indexOf('Electron') >= 0
) {
  // Running in electron keep default settings
  document.querySelector(".status-bar").style.display = "flex";
} else {
  document.querySelector(".title-bar").classList.add("hide");
  document.querySelector(".status-bar").style.display = "none";
  document.querySelector(".updates").classList.add("hide");
  document.querySelector(".app-container").style.cssText = `display: flex; height: calc(100vh - 0px);`;
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const memberName = document.getElementById("memberName");
const membershipCategory = document.getElementById("membershipCategory");
const membershipID = document.getElementById("membershipID");
const previewPlaceholder = document.getElementById("preview-placeholder");
const year = new Date();

const categories = document
  .getElementById("categories")
  .getElementsByTagName("option");
let modalTitle = document.getElementById("modalInfoTitle");
let modalContent = document.getElementById("modalInfoContent");
let multiPurposeBtn = document.getElementById("multiPurposeBtn");
let previewWindow = document.getElementById("preview");

let category = "sample";
let member = "sample";
let membershipNumber = "sample";

const image = new Image();
image.src = "ZiGCertTemplate.png";
image.onload = function () {
  drawImage(member, category, membershipNumber);
};

// Title bar
document
  .getElementById("min-btn")
  .addEventListener("click", () => window.electronAPI.minimize());

document.getElementById("max-btn").addEventListener("click", () => {
  if (
    window.outerWidth === screen.availWidth &&
    window.outerHeight === screen.availHeight
  ) {
    window.electronAPI.unmaximize();
  } else {
    window.electronAPI.maximize();
  }
});

document
  .getElementById("close-btn")
  .addEventListener("click", () => window.electronAPI.close());

// Sidebar toggle
function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle("open");
  } else {
    sidebar.classList.toggle("collapsed");
  }
}

// Close sidebar on mobile when clicking outside
document.addEventListener("click", function (e) {
  const sidebar = document.querySelector(".sidebar");
  const menuToggle = document.querySelector(".menu-toggle");

  if (
    window.innerWidth <= 768 &&
    sidebar.classList.contains("open") &&
    !sidebar.contains(e.target) &&
    !menuToggle.contains(e.target)
  ) {
    sidebar.classList.remove("open");
  }
});

// Navigation functionality
const views = {
  create: { title: "Create New Certificate", viewId: "createView" },
  templates: { title: "Templates", viewId: "templatesView" },
  history: { title: "Certificate History", viewId: "historyView" },
  settings: { title: "Settings", viewId: "settingsView" },
  update: { title: "Software Updates", viewId: "updateView" },
};

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", function () {
    // Update active nav item
    document
      .querySelectorAll(".nav-item")
      .forEach((i) => i.classList.remove("active"));
    this.classList.add("active");

    // Get view name
    const viewName = this.getAttribute("data-view");
    const view = views[viewName];

    if (view) {
      // Update page title
      document.getElementById("pageTitle").textContent = view.title;

      // Show corresponding view
      document
        .querySelectorAll(".page-view")
        .forEach((v) => v.classList.remove("active"));
      document.getElementById(view.viewId).classList.add("active");

      // Close sidebar on mobile after selection
      if (window.innerWidth <= 768) {
        document.querySelector(".sidebar").classList.remove("open");
      }
    }
  });
});

// Update functionality
function checkForUpdatesFromStatus() {
  // Switch to updates view
  document
    .querySelectorAll(".nav-item")
    .forEach((i) => i.classList.remove("active"));
  document.querySelector('[data-view="update"]').classList.add("active");
  document.getElementById("pageTitle").textContent = "Software Updates";
  document
    .querySelectorAll(".page-view")
    .forEach((v) => v.classList.remove("active"));
  document.getElementById("updateView").classList.add("active");

  // Trigger check
  checkForUpdates();
}

function checkForUpdates() {
  const latestVersionEl = document.getElementById("latestVersion");
  const banner = document.getElementById("updateAvailableBanner");
  const whatsNew = document.getElementById("whatsNewSection");

  // Simulate checking for updates
  latestVersionEl.textContent = "Checking...";

  setTimeout(() => {
    // Simulate finding an update
    latestVersionEl.textContent = "1.0.0";
    banner.style.display = "flex";
    //whatsNew.style.display = 'block';
  }, 1500);
}

function startUpdate() {
  const progressDiv = document.getElementById("updateProgress");
  const progressFill = document.getElementById("progressFill");
  const statusText = document.getElementById("updateStatus");
  const banner = document.getElementById("updateAvailableBanner");

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
      progressFill.style.width = progress + "%";
      const statusIndex = Math.floor((progress / 100) * (statuses.length - 1));
      statusText.textContent = statuses[statusIndex];
      progress += 2;
    } else {
      clearInterval(interval);
      statusText.innerHTML =
        "<strong>Update installed successfully!</strong> Please restart the application.";
    }
  }, 100);
}

// Modal functions
function openModal(modal) {
  if (modal == "certificate") {
    document.getElementById("certificateModal").classList.add("active");
  } else {
    document.getElementById("infoModal").classList.add("active");
    if (modal == "noInfo" || modal == "error") {
      modalTitle.innerText = "Error";
      modalContent.innerText =
        "Missing Information, Please check the information entered and make sure all fields are filled";
    } else if (modal == "catError") {
      modalTitle.innerText = "Error";
      modalContent.innerText = "Insert correct membership category";
    }
  }
}

function closeModal(modal) {
  if (modal == "certificate") {
    document.getElementById("certificateModal").classList.remove("active");
  } else {
    document.getElementById("infoModal").classList.remove("active");
  }
}

// Close modal on outside click
document
  .getElementById("certificateModal")
  .addEventListener("click", function (e) {
    if (e.target === this) {
      closeModal("certificate");
    }
  });

document.getElementById("infoModal").addEventListener("click", function (e) {
  if (e.target === this) {
    closeModal("info");
  }
});

function checkForErrors() {
  if (
    memberName.value == "" ||
    membershipCategory.value == "" ||
    membershipID.value == ""
  ) {
    openModal("noInfo");
  } else if (
    member == "sample" ||
    category == "sample" ||
    membershipNumber == "number"
  ) {
    openModal("error");
  } else {
    if (getData(membershipCategory)) {
      openModal("certificate");
    } else {
      openModal("catError");
    }
  }
}

function centerText(value, y) {
  let textWidth = ctx.measureText(value).width;
  let startX = canvas.width / 2 - textWidth / 2;
  let startY = y - 0;

  return [value, startX, startY];
}

let getData;
membershipCategory.addEventListener(
  "onchange",
  (getData = function (elem) {
    const optionVals = [];

    for (let i = 0; i < categories.length; i++) {
      optionVals.push(categories[i].value);
    }

    if (optionVals.indexOf(elem.value) > -1) {
      return elem;
    } else {
      openModal("catError");
      membershipCategory.value = "";
    }
  })
);

function drawImage(member, category, membershipNumber) {
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  ctx.font = "90px Charm";
  ctx.fillStyle = "#262264";
  let text = centerText(capitalizeWords(member), 1090 / 2);
  ctx.fillText(text[0], text[1], text[2]);

  ctx.font = "40px Century Gothic Paneuropean";
  ctx.fillStyle = "#262264";
  const upperCategory = "IS A MEMBER OF ZIMBABWE INSTITUTE OF GEOMATICS";
  let txt = centerText(upperCategory, 1260 / 2);
  ctx.fillText(txt[0], txt[1], txt[2]);

  let txtCat = centerText(category.toUpperCase(), 1360 / 2);
  ctx.fillText(txtCat[0], txtCat[1], txtCat[2]);

  ctx.font = "44px Liberation Mono";
  ctx.fillStyle = "#262264";
  ctx.fillText(membershipNumber, 480 / 2, 1720 / 2);
}

memberName.addEventListener("input", function () {
  const memberNam = memberName.value;
  member = memberNam.replace(/(^\w{1})|(\s+\w{1})/g, (letter) =>
    letter.toUpperCase()
  );
});

membershipCategory.addEventListener("input", function () {
  if (hasDatePassed(year.getFullYear() + "-06-01")) {
    const nextYear = new Date().getFullYear() + 1;
    category =
      "REGISTERED AS A GEOMATICS " +
      membershipCategory.value +
      " UNTIL 31 AUGUST " +
      nextYear;
  } else {
    category =
      "REGISTERED AS A GEOMATICS " +
      membershipCategory.value +
      " UNTIL 31 AUGUST " +
      year.getFullYear();
  }
});

membershipID.addEventListener("input", function () {
  membershipNumber = "ZIG" + membershipID.value;
});

function hasDatePassed(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  return date < today;
}

function capitalizeWords(sentence) {
  return sentence
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function preview() {
  previewPlaceholder.classList.add("hide");
  drawImage(member, category, membershipNumber);
  let dataURL = canvas.toDataURL();
  let img = new Image();
  img.src = dataURL;

  // Clear previous preview
  previewWindow.innerHTML = "";
  previewWindow.appendChild(img);
}

function saveCertificate(downloadFileType) {
  switch (downloadFileType) {
    case "PDF":
      drawImage(member, category, membershipNumber);
      let imgData = canvas.toDataURL();
      const certpdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      certpdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      certpdf.save("Certificate-" + capitalizeWords(member) + ".pdf");
      break;
    case "PNG":
      drawImage(member, category, membershipNumber);
      multiPurposeBtn.href = canvas.toDataURL();
      multiPurposeBtn.download = "Certificate - " + capitalizeWords(member);
      break;
  }
}

function reset() {
  memberName.value = memberName.defaultValue;
  membershipCategory.value = membershipCategory.defaultValue;
  membershipID.value = membershipID.defaultValue;
  previewWindow.innerHTML = "";
  previewPlaceholder.classList.remove("hide");
}

// Settings storage (using Electron store)
let settings = {
  theme: "dark",
  accentColor: "#667eea",
  fontSize: "medium",
};

// Load settings from storage
function loadSettings() {
  // In Electron, this would be: settings = electronStore.get('appSettings') || settings;
  const savedSettings = localStorage.getItem("certificateMakerSettings");
  if (savedSettings) {
    settings = { ...settings, ...JSON.parse(savedSettings) };
  }
  applySettings();
}

// Save settings to storage
function saveSettings() {
  // In Electron, this would be: electronStore.set('appSettings', settings);
  localStorage.setItem("certificateMakerSettings", JSON.stringify(settings));
  applySettings();
}

// Apply all settings to the UI
function applySettings() {
  applyTheme(settings.theme);
  applyAccentColor(settings.accentColor);
  applyFontSize(settings.fontSize);
  updateFormControls();
}

// Apply theme
function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);

  // Update theme-specific styles
  if (theme === "light") {
    document.body.style.setProperty("--bg-primary", "#ffffff");
    document.body.style.setProperty("--bg-secondary", "#f5f5f5");
    document.body.style.setProperty("--bg-tertiary", "#e5e5e5");
    document.body.style.setProperty("--text-primary", "#333333");
    document.body.style.setProperty("--text-secondary", "#666666");
    document.body.style.setProperty("--border-color", "#dddddd");
  } else if (theme === "system") {
    // Check system preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches
    ) {
      applyTheme("light");
    } else {
      applyTheme("dark");
    }
  } else {
    // Dark theme (default)
    document.body.style.setProperty("--bg-primary", "#1e1e1e");
    document.body.style.setProperty("--bg-secondary", "#252526");
    document.body.style.setProperty("--bg-tertiary", "#2d2d30");
    document.body.style.setProperty("--text-primary", "#cccccc");
    document.body.style.setProperty("--text-secondary", "#858585");
    document.body.style.setProperty("--border-color", "#3c3c3c");
  }
}

// Apply accent color
function applyAccentColor(color) {
  // Generate darker shade for gradient
  const darkerColor = shadeColor(color, -30);

  // Update CSS variables
  document.documentElement.style.setProperty("--accent-primary", color);
  document.documentElement.style.setProperty("--accent-secondary", darkerColor);

  // Update gradient
  const gradient = `linear-gradient(135deg, ${color} 0%, ${darkerColor} 100%)`;
  document.documentElement.style.setProperty("--accent-gradient", gradient);

  // Update color preview
  const preview = document.querySelector(".color-preview");
  if (preview) {
    preview.style.background = gradient;
  }
}

// Apply font size
function applyFontSize(size) {
  const sizes = {
    small: "14px",
    medium: "18px",
    large: "22px",
  };

  document.documentElement.style.setProperty(
    "--base-font-size",
    sizes[size] || sizes.medium
  );

  // Update specific elements that need different scaling
  updateFontSizeSpecifics(size);
}

// Update font size for specific elements
function updateFontSizeSpecifics(size) {
  const scaleFactors = {
    small: 0.9,
    medium: 1,
    large: 1.1,
  };

  const factor = scaleFactors[size] || 1;

  // Update title bar
  document.querySelector(".app-title").style.fontSize = `${12 * factor}px`;

  // Update sidebar
  document.querySelector(".sidebar-title").style.fontSize = `${11 * factor}px`;
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.style.fontSize = `${13 * factor}px`;
  });

  // Update content
  document.querySelector(".content-title").style.fontSize = `${16 * factor}px`;
  document.querySelectorAll(".section-title").forEach((title) => {
    title.style.fontSize = `${14 * factor}px`;
  });
  document.querySelectorAll(".form-label").forEach((label) => {
    label.style.fontSize = `${12 * factor}px`;
  });
  document.querySelectorAll(".form-input, .form-select, .btn").forEach((el) => {
    el.style.fontSize = `${13 * factor}px`;
  });
}

// Update form controls to match current settings
function updateFormControls() {
  // Theme select
  const themeSelect = document.querySelector('select[style*="width: 200px"]');
  if (themeSelect) {
    themeSelect.value = settings.theme;
  }

  // Accent color picker
  const colorPicker = document.querySelector(".color-picker");
  if (colorPicker) {
    colorPicker.value = settings.accentColor;
  }

  // Font size select
  const fontSizeSelects = document.querySelectorAll(
    'select[style*="width: 200px"]'
  );
  if (fontSizeSelects.length > 1) {
    fontSizeSelects[1].value = settings.fontSize;
  }
}

// Utility function to shade colors
function shadeColor(color, percent) {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = parseInt((R * (100 + percent)) / 100);
  G = parseInt((G * (100 + percent)) / 100);
  B = parseInt((B * (100 + percent)) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  const RR =
    R.toString(16).length === 1 ? "0" + R.toString(16) : R.toString(16);
  const GG =
    G.toString(16).length === 1 ? "0" + G.toString(16) : G.toString(16);
  const BB =
    B.toString(16).length === 1 ? "0" + B.toString(16) : B.toString(16);

  return "#" + RR + GG + BB;
}

// Event listeners for settings changes
document.addEventListener("DOMContentLoaded", function () {
  // Load saved settings
  loadSettings();

  // Theme change
  const themeSelect = document.querySelector('select[style*="width: 200px"]');
  if (themeSelect) {
    themeSelect.addEventListener("change", function () {
      settings.theme = this.value;
      saveSettings();
    });
  }

  // Accent color change
  const colorPicker = document.querySelector(".color-picker");
  if (colorPicker) {
    colorPicker.addEventListener("input", function () {
      settings.accentColor = this.value;
      saveSettings();
    });
  }

  // Font size change
  const fontSizeSelects = document.querySelectorAll(
    'select[style*="width: 200px"]'
  );
  if (fontSizeSelects.length > 1) {
    fontSizeSelects[1].addEventListener("change", function () {
      settings.fontSize = this.value;
      saveSettings();
    });
  }

  // Save settings button
  const saveButton = document.querySelector(".save-appearance");
  if (saveButton && saveButton.textContent === "Save Settings") {
    saveButton.addEventListener("click", function () {
      saveSettings();
      showNotification("Settings saved successfully!");
    });
  }
});

// Show notification
function showNotification(message) {
  // Create notification element
  const notification = document.createElement("div");
  notification.style.cssText = `
            position: fixed;
            top: 50px;
            right: 20px;
            background: var(--accent-gradient, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-size: 14px;
            transition: all 0.3s ease;
        `;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// System theme change listener
if (window.matchMedia) {
  window
    .matchMedia("(prefers-color-scheme: light)")
    .addEventListener("change", (e) => {
      if (settings.theme === "system") {
        applyTheme("system");
      }
    });
}
