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
  var partnerFieldIds = [
    "partner-company",
    "partner-type",
    "partner-website",
    "partner-phone",
    "partner-place",
    "partner-email",
    "partner-contact",
    "partner-designation",
    "partner-purpose",
    "partner-consent"
  ];

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

  function collapseSpaces(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
  }

  function hasLetter(s) {
    try {
      return /[\p{L}]/u.test(s);
    } catch (err) {
      return /[A-Za-z]/.test(s);
    }
  }

  function isPersonName(s) {
    if (s.length < 2 || s.length > 80) return false;
    try {
      return /^[\p{L}]+(?: [\p{L}]+)*$/u.test(s);
    } catch (err) {
      return /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(s);
    }
  }

  function isMeaningfulText(s, min, max) {
    if (s.length < min || s.length > max) return false;
    if (!hasLetter(s)) return false;
    var compact = s.replace(/\s/g, "");
    if (compact.length < 2) return false;
    if (/^(.)\1+$/.test(compact)) return false;
    return true;
  }

  function isEmail(s) {
    return s.length <= 100 && /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,24}$/.test(s);
  }

  function normalizeWebsite(raw) {
    var s = collapseSpaces(raw);
    if (!s) return "";
    if (!/^https?:\/\//i.test(s)) s = "https://" + s;
    return s;
  }

  function isHttpUrl(s) {
    try {
      var u = new URL(s);
      if (u.protocol !== "http:" && u.protocol !== "https:") return false;
      var host = String(u.hostname || "").toLowerCase();
      if (!host || host.indexOf(".") === -1) return false;
      if (!/[a-z]/i.test(host)) return false;
      if (/\s/.test(s)) return false;
      return true;
    } catch (err) {
      return false;
    }
  }

  function phoneDigits() {
    var input = document.getElementById("partner-phone");
    return input ? String(input.value || "").replace(/\D/g, "") : "";
  }

  function phoneErrorMessage(digits) {
    if (!digits) return "Enter a phone number.";
    if (!/^\d+$/.test(digits)) return "Use numbers only.";
    if (digits.length < 6 || digits.length > 12) return "Enter a valid phone number.";
    return "";
  }

  function setFieldError(id, message) {
    var err = document.getElementById(id + "-error");
    var field = document.getElementById(id);
    var wrap = field && field.closest(".volunteer-field");
    if (err) {
      err.textContent = message || "";
      err.hidden = !message;
    }
    if (wrap) wrap.classList.toggle("is-invalid", !!message);
    if (field) field.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function clearPartnerFieldErrors() {
    partnerFieldIds.forEach(function (id) {
      setFieldError(id, "");
    });
  }

  function validatePartnerForm() {
    if (!partnerForm) return false;
    var firstInvalid = null;
    function fail(id, message) {
      setFieldError(id, message);
      if (!firstInvalid) firstInvalid = document.getElementById(id);
    }

    function requiredText(id, key, emptyMsg, junkMsg, min, max) {
      var value = collapseSpaces(partnerForm.elements[key].value);
      partnerForm.elements[key].value = value;
      if (!value) fail(id, emptyMsg);
      else if (!isMeaningfulText(value, min, max)) fail(id, junkMsg);
      else setFieldError(id, "");
    }

    requiredText("partner-company", "company", "Enter your company name.", "Enter a real company name.", 2, 120);

    var companyType = partnerForm.elements.company_type.value;
    if (!companyType) fail("partner-type", "Choose a company type.");
    else setFieldError("partner-type", "");

    var website = normalizeWebsite(partnerForm.elements.website.value);
    partnerForm.elements.website.value = website;
    if (!website) fail("partner-website", "Enter your website.");
    else if (!isHttpUrl(website)) fail("partner-website", "Enter a valid http(s) URL.");
    else setFieldError("partner-website", "");

    var digits = phoneDigits();
    var phoneInput = document.getElementById("partner-phone");
    if (phoneInput) phoneInput.value = digits;
    var phoneMsg = phoneErrorMessage(digits);
    if (phoneMsg) fail("partner-phone", phoneMsg);
    else setFieldError("partner-phone", "");

    requiredText("partner-place", "place", "Enter your place.", "Enter a real place name.", 2, 80);

    var email = collapseSpaces(partnerForm.elements.email.value).toLowerCase();
    partnerForm.elements.email.value = email;
    if (!email) fail("partner-email", "Enter your email.");
    else if (!isEmail(email)) fail("partner-email", "Enter a valid email.");
    else setFieldError("partner-email", "");

    var contact = collapseSpaces(partnerForm.elements.contact_name.value);
    partnerForm.elements.contact_name.value = contact;
    if (!contact) fail("partner-contact", "Enter the contact person's name.");
    else if (!isPersonName(contact)) fail("partner-contact", "Use letters and spaces only.");
    else setFieldError("partner-contact", "");

    requiredText("partner-designation", "designation", "Enter your designation.", "Enter a real designation.", 2, 80);

    var purpose = collapseSpaces(partnerForm.elements.purpose.value);
    partnerForm.elements.purpose.value = purpose;
    if (!purpose) fail("partner-purpose", "Tell us the purpose of this partnership.");
    else if (purpose.length < 20) fail("partner-purpose", "Please write at least 20 characters.");
    else if (purpose.length > 400) fail("partner-purpose", "Keep this to 400 characters.");
    else if (!hasLetter(purpose)) fail("partner-purpose", "Please write a short purpose.");
    else if (!isMeaningfulText(purpose, 20, 400)) fail("partner-purpose", "Please write a real purpose.");
    else setFieldError("partner-purpose", "");

    var consent = partnerForm.elements.consent;
    if (!(consent && consent.checked)) fail("partner-consent", "Please agree to be contacted about this partnership.");
    else setFieldError("partner-consent", "");

    if (firstInvalid && typeof firstInvalid.focus === "function") firstInvalid.focus();
    return !firstInvalid;
  }

  function resetPartnerThanks() {
    if (partnerDialog) partnerDialog.classList.remove("is-thanks");
    if (partnerIntro) partnerIntro.hidden = false;
    if (partnerForm) {
      partnerForm.hidden = false;
      partnerForm.reset();
    }
    clearPartnerFieldErrors();
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
    var phoneInput = document.getElementById("partner-phone");
    if (phoneInput) {
      phoneInput.addEventListener("input", function () {
        var digits = String(phoneInput.value || "").replace(/\D/g, "").slice(0, 12);
        if (phoneInput.value !== digits) phoneInput.value = digits;
      });
      phoneInput.addEventListener("keydown", function (e) {
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && /\D/.test(e.key)) {
          e.preventDefault();
        }
      });
    }

    partnerForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validatePartnerForm()) return;
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
