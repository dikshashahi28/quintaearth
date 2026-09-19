(function () {
  document.querySelectorAll("[data-placeholder]").forEach(function (el) {
    var href = el.getAttribute("href") || "";
    if (href && href !== "#") return;
    el.setAttribute("aria-describedby", "link-coming-soon");
    el.addEventListener("click", function (e) {
      e.preventDefault();
    });
  });

  document.querySelectorAll("#siteOffcanvas a[href]:not([data-placeholder]):not(.nav-toggle)").forEach(function (a) {
    a.addEventListener("click", function () {
      var oc = document.getElementById("siteOffcanvas");
      if (oc && window.bootstrap) {
        var inst = bootstrap.Offcanvas.getInstance(oc);
        if (inst) inst.hide();
      }
    });
  });

  var oc = document.getElementById("siteOffcanvas");
  var industriesSub = document.getElementById("industries-sub");

  function closeGroup(group) {
    if (!group) return;
    group.classList.remove("is-open");
    var t = group.querySelector(":scope > .nav-toggle");
    var subId = t && t.getAttribute("aria-controls");
    var sub = subId ? document.getElementById(subId) : null;
    if (t) t.setAttribute("aria-expanded", "false");
    if (sub) sub.setAttribute("hidden", "");
  }

  function syncNestedFocus() {
    if (!industriesSub) return;
    var anyOpen = false;
    industriesSub.querySelectorAll(":scope > .nav-group-nested").forEach(function (group) {
      var t = group.querySelector(":scope > .nav-toggle");
      var subId = t && t.getAttribute("aria-controls");
      var sub = subId ? document.getElementById(subId) : null;
      if (sub && !sub.hasAttribute("hidden")) anyOpen = true;
    });
    industriesSub.classList.toggle("focus-nested", anyOpen);
  }

  if (oc) {
    oc.addEventListener("show.bs.offcanvas", function () {
      document.body.classList.add("menu-open");
    });
    oc.addEventListener("hide.bs.offcanvas", function () {
      document.body.classList.remove("menu-open");
    });
    oc.querySelectorAll(".nav-toggle").forEach(function (toggle) {
      toggle.addEventListener("keydown", function (e) {
        if (e.key === " ") {
          e.preventDefault();
          toggle.click();
        }
      });
      toggle.addEventListener("click", function (e) {
        var href = toggle.getAttribute("href");
        if (href && href !== "#") {
          var rect = toggle.getBoundingClientRect();
          var caretZone = 36;
          if ((e.clientX || 0) < rect.right - caretZone) {
            return;
          }
        }
        e.preventDefault();
        e.stopPropagation();
        var group = toggle.parentElement;
        var subId = toggle.getAttribute("aria-controls");
        var sub = subId ? document.getElementById(subId) : null;
        if (!group || !sub || !group.classList.contains("nav-group")) return;
        var open = sub.hasAttribute("hidden");
        if (open && group.classList.contains("nav-group-nested") && industriesSub) {
          industriesSub.querySelectorAll(":scope > .nav-group-nested").forEach(function (other) {
            if (other !== group) closeGroup(other);
          });
        }
        group.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) sub.removeAttribute("hidden");
        else sub.setAttribute("hidden", "");
        syncNestedFocus();
      });
    });
    oc.addEventListener("hidden.bs.offcanvas", function () {
      oc.querySelectorAll(".nav-group.is-open").forEach(closeGroup);
      if (industriesSub) industriesSub.classList.remove("focus-nested");
    });
    syncNestedFocus();
  }

  window.quintaPlayYt = function (e) {
    try { if (e) { e.preventDefault(); e.stopPropagation(); } } catch (err) {}
    var cover = document.getElementById("yt-cover");
    var mount = document.getElementById("yt-player");
    if (!cover || !mount) return false;
    if (cover.classList.contains("is-playing")) return false;
    mount.innerHTML = "";
    var frame = document.createElement("iframe");
    frame.src = "https://www.youtube.com/embed/T_udYF5L6OQ?autoplay=1&rel=0&playsinline=1&modestbranding=1";
    frame.title = "QuintaEarth — Earth is our home";
    frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.setAttribute("allowfullscreen", "");
    frame.setAttribute("playsinline", "");
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    mount.appendChild(frame);
    cover.classList.add("is-playing");
    cover.setAttribute("aria-label", "QuintaEarth video playing");
    return false;
  };

  var cover = document.getElementById("yt-cover");
  if (cover) {
    cover.addEventListener("click", function (e) {
      window.quintaPlayYt(e);
    });
    cover.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        window.quintaPlayYt(e);
      }
    });
  }

  var carousel = document.querySelector("[data-t-carousel]");
  if (carousel) {
    var track = carousel.querySelector(".t-track");
    var prev = carousel.querySelector(".t-arrow-prev");
    var next = carousel.querySelector(".t-arrow-next");
    function cardStep() {
      var card = track && track.querySelector(".t-card");
      if (!card) return 280;
      var gap = parseFloat(window.getComputedStyle(track).gap) || 16;
      return card.getBoundingClientRect().width + gap;
    }
    if (prev && track) {
      prev.addEventListener("click", function () {
        track.scrollBy({ left: -cardStep(), behavior: "smooth" });
      });
    }
    if (next && track) {
      next.addEventListener("click", function () {
        track.scrollBy({ left: cardStep(), behavior: "smooth" });
      });
    }
  }

  var volunteerForm = document.getElementById("volunteer-form");
  var volunteerThanks = document.getElementById("volunteer-thanks");
  var volunteerIntro = document.querySelector("#volunteer-dialog .volunteer-dialog-intro");
  var volunteerSubmitError = document.getElementById("volunteer-submit-error");
  var volunteerSubmitBtn = volunteerForm && volunteerForm.querySelector('button[type="submit"]');
  var resumeInput = document.getElementById("volunteer-resume");
  var resumeMeta = document.getElementById("volunteer-resume-meta");
  var resumeError = document.getElementById("volunteer-resume-error");
  var resumeHint = "PDF or Word (.doc, .docx)";
  var volunteerSheetUrl = "https://script.google.com/macros/s/AKfycbwQiYb8LIs9O9SUxOqTUdd8Dt8-mucSdoH1yQ2cwvNM_xHMzwrCQRagvKLof9KrqIrU/exec";
  var volunteerDialog = document.getElementById("volunteer-dialog");
  var volunteerLastFocus = null;
  var volunteerCountry = { iso: "IN", name: "India", dial: "91" };
  var volunteerFieldIds = [
    "volunteer-name",
    "volunteer-gender",
    "volunteer-phone",
    "volunteer-email",
    "volunteer-designation",
    "volunteer-education",
    "volunteer-city",
    "volunteer-college",
    "volunteer-why",
    "volunteer-consent"
  ];

  function volunteerCountries() {
    return window.VOLUNTEER_COUNTRIES || [{ iso: "IN", name: "India", dial: "91" }];
  }

  function flagEmoji(iso) {
    if (!iso || iso.length !== 2) return "";
    var a = iso.toUpperCase().charCodeAt(0) - 65;
    var b = iso.toUpperCase().charCodeAt(1) - 65;
    if (a < 0 || a > 25 || b < 0 || b > 25) return "";
    return String.fromCodePoint(0x1F1E6 + a, 0x1F1E6 + b);
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

  function setFieldError(id, message) {
    var err = document.getElementById(id + "-error");
    var field = document.getElementById(id);
    var wrap = field && field.closest(".volunteer-field");
    if (err) {
      if (id !== "volunteer-resume") err.textContent = message || "";
      err.hidden = !message;
    }
    if (wrap) wrap.classList.toggle("is-invalid", !!message);
    if (field) {
      field.setAttribute("aria-invalid", message ? "true" : "false");
      if (id === "volunteer-resume") field.setCustomValidity(message || "");
    }
  }

  function clearVolunteerFieldErrors() {
    volunteerFieldIds.forEach(function (id) {
      setFieldError(id, "");
    });
    setFieldError("volunteer-resume", "");
    if (resumeError) {
      resumeError.textContent = "Please attach a PDF or Word file.";
      resumeError.hidden = true;
    }
  }

  function isResumeFile(file) {
    return !!(file && file.name && /\.(pdf|doc|docx)$/i.test(file.name));
  }

  function syncResumeField(showMissing) {
    if (!resumeInput) return true;
    var file = resumeInput.files && resumeInput.files[0];
    if (!file) {
      if (resumeMeta) resumeMeta.textContent = resumeHint;
      setFieldError("volunteer-resume", showMissing ? "Please attach a PDF or Word file." : "");
      if (resumeError && showMissing) resumeError.textContent = "Please attach a PDF or Word file.";
      return false;
    }
    if (!isResumeFile(file)) {
      resumeInput.value = "";
      if (resumeMeta) resumeMeta.textContent = resumeHint;
      setFieldError("volunteer-resume", "Please attach a PDF or Word file.");
      if (resumeError) resumeError.textContent = "Please attach a PDF or Word file.";
      return false;
    }
    if (resumeMeta) resumeMeta.textContent = file.name;
    setFieldError("volunteer-resume", "");
    return true;
  }

  function phoneDigits() {
    var input = document.getElementById("volunteer-phone");
    return input ? String(input.value || "").replace(/\D/g, "") : "";
  }

  function phoneErrorMessage(digits, dial) {
    if (!digits) return "Enter a phone number.";
    if (!/^\d+$/.test(digits)) return "Use numbers only.";
    if (dial === "91") {
      if (digits.length !== 10) return "Enter a 10-digit Indian mobile number.";
      if (!/^[6-9]/.test(digits)) return "Enter a valid Indian mobile number.";
    } else if (digits.length < 6 || digits.length > 12) {
      return "Enter a valid phone number.";
    }
    return "";
  }

  function validateVolunteerForm() {
    if (!volunteerForm) return false;
    var firstInvalid = null;
    function fail(id, message) {
      setFieldError(id, message);
      if (!firstInvalid) firstInvalid = document.getElementById(id);
    }

    var name = collapseSpaces(volunteerForm.elements.name.value);
    volunteerForm.elements.name.value = name;
    if (!name) fail("volunteer-name", "Enter your name.");
    else if (!isPersonName(name)) fail("volunteer-name", "Use letters and spaces only.");
    else setFieldError("volunteer-name", "");

    var gender = volunteerForm.elements.gender.value;
    if (!gender) fail("volunteer-gender", "Choose a gender.");
    else setFieldError("volunteer-gender", "");

    var digits = phoneDigits();
    var phoneInput = document.getElementById("volunteer-phone");
    if (phoneInput) phoneInput.value = digits;
    var phoneMsg = phoneErrorMessage(digits, volunteerCountry.dial);
    if (phoneMsg) fail("volunteer-phone", phoneMsg);
    else setFieldError("volunteer-phone", "");

    var email = collapseSpaces(volunteerForm.elements.email.value).toLowerCase();
    volunteerForm.elements.email.value = email;
    if (!email) fail("volunteer-email", "Enter your email.");
    else if (!isEmail(email)) fail("volunteer-email", "Enter a valid email.");
    else setFieldError("volunteer-email", "");

    function requiredText(id, key, emptyMsg, junkMsg, min, max) {
      var value = collapseSpaces(volunteerForm.elements[key].value);
      volunteerForm.elements[key].value = value;
      if (!value) fail(id, emptyMsg);
      else if (!isMeaningfulText(value, min, max)) fail(id, junkMsg);
      else setFieldError(id, "");
    }

    requiredText("volunteer-designation", "designation", "Enter your designation.", "Enter a real designation.", 2, 80);
    requiredText("volunteer-education", "education", "Enter your education.", "Enter a real education value.", 2, 80);
    requiredText("volunteer-city", "city", "Enter your city.", "Enter a real city name.", 2, 80);
    requiredText("volunteer-college", "college", "Enter your college.", "Enter a real college name.", 2, 80);

    if (!syncResumeField(true) && !firstInvalid) firstInvalid = resumeInput;

    var why = collapseSpaces(volunteerForm.elements.why.value);
    volunteerForm.elements.why.value = why;
    if (!why) fail("volunteer-why", "Tell us why you want to volunteer.");
    else if (why.length < 20) fail("volunteer-why", "Please write at least 20 characters.");
    else if (why.length > 400) fail("volunteer-why", "Keep this to 400 characters.");
    else if (!hasLetter(why)) fail("volunteer-why", "Please write a short reason.");
    else setFieldError("volunteer-why", "");

    var consent = volunteerForm.elements.consent;
    if (!(consent && consent.checked)) fail("volunteer-consent", "Please confirm this is a volunteer signup.");
    else setFieldError("volunteer-consent", "");

    if (firstInvalid && typeof firstInvalid.focus === "function") firstInvalid.focus();
    return !firstInvalid;
  }

  function setVolunteerCountry(country) {
    volunteerCountry = country || { iso: "IN", name: "India", dial: "91" };
    var flagEl = document.getElementById("volunteer-cc-flag");
    var dialEl = document.getElementById("volunteer-cc-dial");
    var btn = document.getElementById("volunteer-cc-btn");
    if (flagEl) flagEl.textContent = flagEmoji(volunteerCountry.iso);
    if (dialEl) dialEl.textContent = "+" + volunteerCountry.dial;
    if (btn) {
      btn.setAttribute(
        "aria-label",
        "Country code, " + volunteerCountry.name + " plus " + volunteerCountry.dial
      );
    }
  }

  function volunteerPhoneField() {
    return (
      document.querySelector("#volunteer-dialog .volunteer-phone-field") ||
      document.querySelector(".volunteer-form-page .volunteer-phone-field") ||
      document.querySelector(".volunteer-phone-field")
    );
  }

  function closeCountryPanel() {
    var panel = document.getElementById("volunteer-cc-panel");
    var btn = document.getElementById("volunteer-cc-btn");
    var field = volunteerPhoneField();
    var page = document.querySelector(".volunteer-form-page");
    if (panel) panel.hidden = true;
    if (btn) btn.setAttribute("aria-expanded", "false");
    if (field) field.classList.remove("is-cc-open");
    if (volunteerDialog) volunteerDialog.classList.remove("is-cc-open");
    if (page) page.classList.remove("is-cc-open");
  }

  function renderCountryList(query) {
    var list = document.getElementById("volunteer-cc-list");
    if (!list) return;
    var q = collapseSpaces(query).toLowerCase();
    list.innerHTML = "";
    var matches = volunteerCountries().filter(function (c) {
      if (!q) return true;
      return (c.name + " +" + c.dial + " " + c.iso + " +" + c.dial).toLowerCase().indexOf(q) !== -1;
    });
    if (!matches.length) {
      var empty = document.createElement("li");
      empty.innerHTML = '<p class="volunteer-cc-empty">No countries match.</p>';
      list.appendChild(empty);
      return;
    }
    matches.forEach(function (c) {
      var li = document.createElement("li");
      var option = document.createElement("button");
      option.type = "button";
      option.className = "volunteer-cc-option";
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", c.iso === volunteerCountry.iso ? "true" : "false");
      option.setAttribute("data-iso", c.iso);
      option.innerHTML =
        '<span class="volunteer-cc-flag" aria-hidden="true">' +
        flagEmoji(c.iso) +
        '</span><span class="volunteer-cc-name"></span><span class="volunteer-cc-dial-opt"></span>';
      option.querySelector(".volunteer-cc-name").textContent = c.name;
      option.querySelector(".volunteer-cc-dial-opt").textContent = "+" + c.dial;
      option.addEventListener("click", function () {
        setVolunteerCountry(c);
        closeCountryPanel();
        var phone = document.getElementById("volunteer-phone");
        if (phone) phone.focus();
      });
      li.appendChild(option);
      list.appendChild(li);
    });
    var selected = list.querySelector('.volunteer-cc-option[aria-selected="true"]');
    if (selected && selected.scrollIntoView) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }

  function openCountryPanel() {
    var panel = document.getElementById("volunteer-cc-panel");
    var btn = document.getElementById("volunteer-cc-btn");
    var field = volunteerPhoneField();
    var page = document.querySelector(".volunteer-form-page");
    var search = document.getElementById("volunteer-cc-search");
    if (!panel) return;
    panel.hidden = false;
    if (btn) btn.setAttribute("aria-expanded", "true");
    if (field) field.classList.add("is-cc-open");
    if (volunteerDialog) volunteerDialog.classList.add("is-cc-open");
    if (page) page.classList.add("is-cc-open");
    if (search) search.value = "";
    renderCountryList("");
    if (search) search.focus();
  }

  (function bindVolunteerCountryPicker() {
    var btn = document.getElementById("volunteer-cc-btn");
    var panel = document.getElementById("volunteer-cc-panel");
    var search = document.getElementById("volunteer-cc-search");
    var phone = document.getElementById("volunteer-phone");
    if (!btn || !panel) return;

    setVolunteerCountry(volunteerCountries()[0] || volunteerCountry);

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (panel.hidden) openCountryPanel();
      else closeCountryPanel();
    });

    if (search) {
      search.addEventListener("input", function () {
        renderCountryList(search.value);
      });
      search.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          e.preventDefault();
          closeCountryPanel();
          btn.focus();
        }
      });
    }

    if (phone) {
      phone.addEventListener("input", function () {
        var digits = String(phone.value || "").replace(/\D/g, "").slice(0, 12);
        if (phone.value !== digits) phone.value = digits;
      });
      phone.addEventListener("keydown", function (e) {
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && /\D/.test(e.key)) {
          e.preventDefault();
        }
      });
    }

    document.addEventListener("click", function (e) {
      if (panel.hidden) return;
      if (e.target.closest("#volunteer-cc-panel") || e.target.closest("#volunteer-cc-btn")) return;
      closeCountryPanel();
    });

    if (volunteerDialog) {
      volunteerDialog.addEventListener("cancel", function (e) {
        if (!panel.hidden) {
          e.preventDefault();
          closeCountryPanel();
        }
      });
    }
  })();

  if (resumeInput) {
    resumeInput.addEventListener("change", function () {
      syncResumeField(true);
    });
  }

  if (volunteerForm && volunteerThanks) {
    volunteerForm.addEventListener("submit", function (e) {
      e.preventDefault();
      closeCountryPanel();
      if (volunteerSubmitError) volunteerSubmitError.hidden = true;
      if (!validateVolunteerForm()) return;
      var consent = volunteerForm.elements.consent;
      var payload = {
        name: volunteerForm.elements.name.value,
        gender: volunteerForm.elements.gender.value,
        phone: "+" + volunteerCountry.dial + phoneDigits(),
        email: volunteerForm.elements.email.value,
        designation: volunteerForm.elements.designation.value,
        education: volunteerForm.elements.education.value,
        city: volunteerForm.elements.city.value,
        college: volunteerForm.elements.college.value,
        why: volunteerForm.elements.why.value,
        consent: !!(consent && consent.checked)
      };
      if (volunteerSubmitBtn) volunteerSubmitBtn.disabled = true;
      fetch(volunteerSheetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error("submit failed");
        volunteerForm.hidden = true;
        if (volunteerDialog) volunteerDialog.classList.add("is-thanks");
        volunteerThanks.hidden = false;
        volunteerThanks.focus();
      }).catch(function () {
        if (volunteerSubmitError) volunteerSubmitError.hidden = false;
      }).then(function () {
        if (volunteerSubmitBtn) volunteerSubmitBtn.disabled = false;
      });
    });
  }


  function volunteerHash() {
    return (location.hash || "") === "#volunteer";
  }

  function isHomepage() {
    var file = (location.pathname.split("/").pop() || "").toLowerCase();
    return file === "" || file === "index.html";
  }

  function volunteerHref(href) {
    if (!href) return false;
    var path = href.split("?")[0];
    return (
      path === "volunteer.html" ||
      path === "./volunteer.html" ||
      path === "#volunteer" ||
      path === "index.html#volunteer" ||
      /(?:^|\/)index\.html#volunteer$/.test(path) ||
      /(?:^|\/)#volunteer$/.test(path)
    );
  }

  function resetVolunteerThanks() {
    closeCountryPanel();
    if (volunteerDialog) volunteerDialog.classList.remove("is-thanks");
    if (volunteerIntro) volunteerIntro.hidden = false;
    if (volunteerForm) {
      volunteerForm.hidden = false;
      volunteerForm.reset();
    }
    setVolunteerCountry(volunteerCountries()[0] || { iso: "IN", name: "India", dial: "91" });
    clearVolunteerFieldErrors();
    if (volunteerThanks) volunteerThanks.hidden = true;
    if (volunteerSubmitError) volunteerSubmitError.hidden = true;
    if (volunteerSubmitBtn) volunteerSubmitBtn.disabled = false;
    if (resumeInput) {
      resumeInput.setCustomValidity("");
      if (resumeMeta) resumeMeta.textContent = resumeHint;
    }
  }

  function openVolunteerDialog() {
    if (!volunteerDialog) return false;
    resetVolunteerThanks();
    volunteerLastFocus = document.activeElement;
    if (typeof volunteerDialog.showModal === "function") {
      if (!volunteerDialog.open) volunteerDialog.showModal();
    } else {
      volunteerDialog.setAttribute("open", "");
    }
    var name = document.getElementById("volunteer-name");
    if (name && volunteerForm && !volunteerForm.hidden) name.focus();
    return true;
  }

  function closeVolunteerDialog() {
    if (!volunteerDialog) return;
    if (typeof volunteerDialog.close === "function" && volunteerDialog.open) {
      volunteerDialog.close();
    } else {
      volunteerDialog.removeAttribute("open");
    }
  }

  if (volunteerDialog) {
    volunteerDialog.addEventListener("click", function (e) {
      if (e.target === volunteerDialog) closeVolunteerDialog();
    });
    volunteerDialog.addEventListener("close", function () {
      if (volunteerLastFocus && typeof volunteerLastFocus.focus === "function") {
        volunteerLastFocus.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-volunteer-close]")) {
        e.preventDefault();
        closeVolunteerDialog();
      }
    });
  }

  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-volunteer-open], a[href]");
    if (!opener) return;
    if (opener.hasAttribute("data-volunteer-open") || volunteerHref(opener.getAttribute("href"))) {
      if (volunteerDialog) {
        e.preventDefault();
        openVolunteerDialog();
      } else if (opener.hasAttribute("data-volunteer-open") && !isHomepage()) {
        e.preventDefault();
        location.href = "index.html#volunteer";
      } else if (volunteerHref(opener.getAttribute("href")) && isHomepage()) {
        e.preventDefault();
      }
    }
  });

  if (volunteerDialog && volunteerHash()) {
    openVolunteerDialog();
  }
  window.addEventListener("hashchange", function () {
    if (volunteerDialog && volunteerHash()) openVolunteerDialog();
  });
})();
