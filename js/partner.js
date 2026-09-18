(function () {
  var partnerForm = document.getElementById("partner-form");
  var partnerThanks = document.getElementById("partner-thanks");
  var partnerIntro = document.querySelector("#partner-dialog .volunteer-dialog-intro");
  var partnerDialog = document.getElementById("partner-dialog");
  var partnerLastFocus = null;

  function partnerHash() {
    return (location.hash || "") === "#partner";
  }

  function isHomepage() {
    var file = (location.pathname.split("/").pop() || "").toLowerCase();
    return file === "" || file === "index.html";
  }

  function partnerHref(href) {
    if (!href) return false;
    var path = href.split("?")[0];
    return (
      path === "#partner" ||
      path === "index.html#partner" ||
      /(?:^|\/)index\.html#partner$/.test(path) ||
      /(?:^|\/)#partner$/.test(path)
    );
  }

  function resetPartnerThanks() {
    if (partnerDialog) partnerDialog.classList.remove("is-thanks");
    if (partnerIntro) partnerIntro.hidden = false;
    if (partnerForm) {
      partnerForm.hidden = false;
      partnerForm.reset();
    }
    if (partnerThanks) partnerThanks.hidden = true;
  }

  function openPartnerDialog() {
    if (!partnerDialog) return false;
    resetPartnerThanks();
    partnerLastFocus = document.activeElement;
    if (typeof partnerDialog.showModal === "function") {
      if (!partnerDialog.open) partnerDialog.showModal();
    } else {
      partnerDialog.setAttribute("open", "");
    }
    var company = document.getElementById("partner-company");
    if (company && partnerForm && !partnerForm.hidden) company.focus();
    return true;
  }

  function closePartnerDialog() {
    if (!partnerDialog) return;
    if (typeof partnerDialog.close === "function" && partnerDialog.open) {
      partnerDialog.close();
    } else {
      partnerDialog.removeAttribute("open");
    }
  }

  if (partnerForm && partnerThanks) {
    partnerForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!partnerForm.checkValidity()) {
        partnerForm.reportValidity();
        return;
      }
      partnerForm.hidden = true;
      if (partnerDialog) partnerDialog.classList.add("is-thanks");
      partnerThanks.hidden = false;
      partnerThanks.focus();
    });
  }

  if (partnerDialog) {
    partnerDialog.addEventListener("click", function (e) {
      if (e.target === partnerDialog) closePartnerDialog();
    });
    partnerDialog.addEventListener("close", function () {
      if (partnerLastFocus && typeof partnerLastFocus.focus === "function") {
        partnerLastFocus.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-partner-close]")) {
        e.preventDefault();
        closePartnerDialog();
      }
    });
  }

  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-partner-open], a[href]");
    if (!opener) return;
    if (opener.hasAttribute("data-partner-open") || partnerHref(opener.getAttribute("href"))) {
      if (partnerDialog) {
        e.preventDefault();
        openPartnerDialog();
      } else if (opener.hasAttribute("data-partner-open") && !isHomepage()) {
        e.preventDefault();
        location.href = "index.html#partner";
      } else if (partnerHref(opener.getAttribute("href")) && isHomepage()) {
        e.preventDefault();
      }
    }
  });

  if (partnerDialog && partnerHash()) {
    openPartnerDialog();
  }
  window.addEventListener("hashchange", function () {
    if (partnerDialog && partnerHash()) openPartnerDialog();
  });
})();
