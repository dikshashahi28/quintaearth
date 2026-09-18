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

  function isResumeFile(file) {
    return !!(file && file.name && /\.(pdf|doc|docx)$/i.test(file.name));
  }

  function syncResumeField() {
    if (!resumeInput) return true;
    var file = resumeInput.files && resumeInput.files[0];
    if (!file) {
      if (resumeMeta) resumeMeta.textContent = resumeHint;
      if (resumeError) resumeError.hidden = true;
      resumeInput.setCustomValidity("Please attach a resume.");
      return false;
    }
    if (!isResumeFile(file)) {
      resumeInput.value = "";
      if (resumeMeta) resumeMeta.textContent = resumeHint;
      if (resumeError) resumeError.hidden = false;
      resumeInput.setCustomValidity("Please attach a PDF or Word file.");
      return false;
    }
    if (resumeMeta) resumeMeta.textContent = file.name;
    if (resumeError) resumeError.hidden = true;
    resumeInput.setCustomValidity("");
    return true;
  }

  if (resumeInput) {
    resumeInput.addEventListener("change", function () {
      syncResumeField();
    });
  }

  if (volunteerForm && volunteerThanks) {
    volunteerForm.addEventListener("submit", function (e) {
      e.preventDefault();
      syncResumeField();
      if (!volunteerForm.checkValidity()) {
        volunteerForm.reportValidity();
        return;
      }
      if (volunteerSubmitError) volunteerSubmitError.hidden = true;
      var consent = volunteerForm.elements.consent;
      var payload = {
        name: volunteerForm.elements.name.value,
        gender: volunteerForm.elements.gender.value,
        phone: volunteerForm.elements.phone.value,
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

  var volunteerDialog = document.getElementById("volunteer-dialog");
  var volunteerLastFocus = null;

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
    if (volunteerDialog) volunteerDialog.classList.remove("is-thanks");
    if (volunteerIntro) volunteerIntro.hidden = false;
    if (volunteerForm) {
      volunteerForm.hidden = false;
      volunteerForm.reset();
    }
    if (volunteerThanks) volunteerThanks.hidden = true;
    if (volunteerSubmitError) volunteerSubmitError.hidden = true;
    if (volunteerSubmitBtn) volunteerSubmitBtn.disabled = false;
    if (resumeInput) {
      resumeInput.setCustomValidity("");
      if (resumeMeta) resumeMeta.textContent = resumeHint;
      if (resumeError) resumeError.hidden = true;
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
