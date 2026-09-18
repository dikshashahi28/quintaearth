(function () {
  var partnerForm = document.getElementById("partner-form");
  var partnerThanks = document.getElementById("partner-thanks");
  var partnerIntro = document.querySelector("#partner-dialog .volunteer-dialog-intro");
  var partnerDialog = document.getElementById("partner-dialog");
  var partnerSubmitError = document.getElementById("partner-submit-error");
  var partnerSubmitBtn = partnerForm && partnerForm.querySelector('button[type="submit"]');
  var partnerSheetUrl = "https://script.google.com/macros/s/AKfycbx1fOHhkENMi3VJcNw_gVMLmV-8-9xCbkrbaEOjyuVarkQe3BBAo29e_yPdX6pH-AAZIg/exec";
  var collaboratorsSheetUrl = "https://script.google.com/macros/s/AKfycbzVSYYebvaOsIywQZPGv3zZzss27e-gBWhEGo_C4CcIa64M0PuitidLuzOEx6U42nqlnA/exec";
  var submitSheetUrl = partnerSheetUrl;
  var partnerLastFocus = null;

  function sheetSourceFromOpener(opener) {
    if (!opener) return "partner";
    if (opener.getAttribute("data-partner-source") === "collaborators") return "collaborators";
    if (opener.classList && opener.classList.contains("collaborators-btn")) return "collaborators";
    if (typeof opener.closest === "function" && opener.closest("#collaborators")) return "collaborators";
    return "partner";
  }

  function setSubmitSheet(source) {
    submitSheetUrl = source === "collaborators" ? collaboratorsSheetUrl : partnerSheetUrl;
  }

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
    if (partnerSubmitError) partnerSubmitError.hidden = true;
    if (partnerSubmitBtn) partnerSubmitBtn.disabled = false;
    setSubmitSheet("partner");
  }

  function openPartnerDialog(source) {
    if (!partnerDialog) return false;
    resetPartnerThanks();
    setSubmitSheet(source);
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
      if (partnerSubmitError) partnerSubmitError.hidden = true;
      var consent = partnerForm.elements.consent;
      var payload = {
        company: partnerForm.elements.company.value,
        company_type: partnerForm.elements.company_type.value,
        website: partnerForm.elements.website.value,
        phone: partnerForm.elements.phone.value,
        place: partnerForm.elements.place.value,
        email: partnerForm.elements.email.value,
        contact_name: partnerForm.elements.contact_name.value,
        designation: partnerForm.elements.designation.value,
        purpose: partnerForm.elements.purpose.value,
        consent: !!(consent && consent.checked)
      };
      if (partnerSubmitBtn) partnerSubmitBtn.disabled = true;
      fetch(submitSheetUrl, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error("submit failed");
        partnerForm.hidden = true;
        if (partnerDialog) partnerDialog.classList.add("is-thanks");
        partnerThanks.hidden = false;
        partnerThanks.focus();
      }).catch(function () {
        if (partnerSubmitError) partnerSubmitError.hidden = false;
      }).then(function () {
        if (partnerSubmitBtn) partnerSubmitBtn.disabled = false;
      });
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
        openPartnerDialog(sheetSourceFromOpener(opener));
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
