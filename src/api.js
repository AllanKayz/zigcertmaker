"use strict";

const { jsPDF } = window.jspdf;

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

// Modal functions
function openModal(modal) {
  if (modal == "certificate") {
    document.getElementById("certificateModal").classList.add("active");
  } else {
    document.getElementById("infoModal").classList.add("active");
    console.log(modal);
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

  if (previewWindow.children.length > 0) {
    previewWindow.parentNode.removeChild(img);
    let newDataURL = canvas.toDataURL();
    let newImg = new Image();
    newImg.src = newDataURL + "?" + new Date().getTime();
    previewWindow.appendChild(newImg);
  } else {
    previewWindow.appendChild(img);
  }
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
}
