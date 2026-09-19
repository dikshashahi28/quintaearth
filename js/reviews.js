(function () {
  var reviewForm = document.getElementById("review-form");
  var reviewThanks = document.getElementById("review-thanks");
  var reviewRoom = document.getElementById("leave-review");
  var reviewDialog = document.getElementById("review-dialog");
  var reviewIntro = document.querySelector(".review-dialog-intro");
  var reviewSubmitError = document.getElementById("review-submit-error");
  var reviewSubmitBtn = reviewForm && reviewForm.querySelector('button[type="submit"]');
  var reviewCount = document.getElementById("review-count");
  var reviewAuth = document.getElementById("review-auth");
  var reviewSigned = document.getElementById("review-signed");
  var reviewSignedEmail = document.getElementById("review-signed-email");
  var reviewAuthError = document.getElementById("review-auth-error");
  var reviewGoogleBtn = document.getElementById("review-google-btn");
  var reviewGoogleFallback = document.getElementById("review-google-fallback");
  var reviewSheetUrl = "https://script.google.com/macros/s/AKfycbwCjFfLWgIh-yJZWAukdAX6lUnHCO2qqCMzoPr14EIH2q1zfk7sP1dqGznSaCNPzt0Z/exec";
  var reviewAuthKey = "qe-review-google";
  var reviewSession = null;
  var reviewLastFocus = null;
  var reviewFieldIds = [
    "review-name",
    "review-designation",
    "review-company",
    "review-rating",
    "review-text"
  ];
  var starPath = "M12 2.7l2.35 7.23h7.6l-6.15 4.47 2.35 7.23L12 17.16l-6.15 4.47 2.35-7.23-6.15-4.47h7.6z";

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
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }

  function googleClientId() {
    return collapseSpaces(window.GOOGLE_CLIENT_ID || "");
  }

  function reviewSource() {
    var file = (location.pathname.split("/").pop() || "").toLowerCase();
    return file === "testimonials.html" ? "testimonials" : "homepage";
  }

  function selectedRating() {
    if (!reviewForm) return "";
    var checked = reviewForm.querySelector('input[name="rating"]:checked');
    return checked ? String(checked.value) : "";
  }

  function setFieldError(id, message) {
    var err = document.getElementById(id + "-error");
    var field = document.getElementById(id);
    var wrap = field && field.closest(".volunteer-field");
    if (id === "review-rating") {
      wrap = document.getElementById("review-rating-field");
    }
    if (err) {
      err.textContent = message || "";
      err.hidden = !message;
    }
    if (wrap) wrap.classList.toggle("is-invalid", !!message);
    if (field) {
      field.setAttribute("aria-invalid", message ? "true" : "false");
    }
    if (id === "review-rating") {
      var group = wrap && wrap.querySelector(".review-stars-pick");
      if (group) group.setAttribute("aria-invalid", message ? "true" : "false");
    }
  }

  function clearReviewFieldErrors() {
    reviewFieldIds.forEach(function (id) {
      setFieldError(id, "");
    });
  }

  function syncReviewCount() {
    if (!reviewForm || !reviewCount) return;
    var value = String(reviewForm.elements.review.value || "");
    reviewCount.textContent = value.length + " / 400";
  }

  function setAuthError(message) {
    if (!reviewAuthError) return;
    reviewAuthError.textContent = message || "";
    reviewAuthError.hidden = !message;
  }

  function readStoredSession() {
    try {
      var raw = sessionStorage.getItem(reviewAuthKey);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !isEmail(collapseSpaces(parsed.email))) return null;
      return {
        email: collapseSpaces(parsed.email),
        name: collapseSpaces(parsed.name)
      };
    } catch (err) {
      return null;
    }
  }

  function writeStoredSession(session) {
    try {
      if (!session) sessionStorage.removeItem(reviewAuthKey);
      else sessionStorage.setItem(reviewAuthKey, JSON.stringify(session));
    } catch (err) {}
  }

  function applySessionToForm() {
    if (!reviewForm || !reviewSession) return;
    var nameField = reviewForm.elements.name;
    if (nameField && !collapseSpaces(nameField.value) && isPersonName(reviewSession.name || "")) {
      nameField.value = reviewSession.name;
    }
  }

  function showSignedIn() {
    if (reviewAuth) reviewAuth.hidden = true;
    if (reviewSigned) reviewSigned.hidden = false;
    if (reviewSignedEmail) reviewSignedEmail.textContent = reviewSession.email;
    if (reviewForm) reviewForm.hidden = false;
    applySessionToForm();
    setAuthError("");
  }

  function showSignedOut() {
    reviewSession = null;
    writeStoredSession(null);
    if (reviewAuth) reviewAuth.hidden = false;
    if (reviewSigned) reviewSigned.hidden = true;
    if (reviewSignedEmail) reviewSignedEmail.textContent = "";
    if (reviewForm) reviewForm.hidden = true;
    if (reviewThanks) reviewThanks.hidden = true;
    if (reviewDialog) reviewDialog.classList.remove("is-thanks");
    if (reviewRoom) reviewRoom.classList.remove("is-thanks");
    if (reviewIntro) reviewIntro.hidden = false;
  }

  function setReviewSession(session) {
    if (!session || !isEmail(collapseSpaces(session.email))) {
      showSignedOut();
      return false;
    }
    reviewSession = {
      email: collapseSpaces(session.email),
      name: collapseSpaces(session.name)
    };
    writeStoredSession(reviewSession);
    showSignedIn();
    var name = document.getElementById("review-name");
    if (name && reviewForm && !reviewForm.hidden) name.focus();
    return true;
  }

  function decodeGoogleCredential(credential) {
    try {
      var payload = String(credential || "").split(".")[1];
      if (!payload) return null;
      var json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(json);
    } catch (err) {
      return null;
    }
  }

  function handleGoogleCredential(response) {
    var profile = decodeGoogleCredential(response && response.credential);
    if (!profile || !isEmail(profile.email || "")) {
      setAuthError("Google Sign-In did not return an email. Please try again.");
      return;
    }
    setReviewSession({
      email: profile.email,
      name: profile.name || profile.given_name || ""
    });
  }

  function renderGoogleButton() {
    var clientId = googleClientId();
    if (!clientId) {
      if (reviewGoogleFallback) reviewGoogleFallback.hidden = false;
      setAuthError("Paste your Google Client ID in js/google-client.js to enable Sign in with Google.");
      return;
    }
    if (!window.google || !google.accounts || !google.accounts.id) {
      if (reviewGoogleFallback) reviewGoogleFallback.hidden = false;
      setAuthError("Google Sign-In could not load. Please refresh.");
      return;
    }
    setAuthError("");
    if (reviewGoogleFallback) reviewGoogleFallback.hidden = true;
    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredential,
      auto_select: false,
      ux_mode: "popup"
    });
    if (reviewGoogleBtn) {
      reviewGoogleBtn.innerHTML = "";
      google.accounts.id.renderButton(reviewGoogleBtn, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular"
      });
    }
  }

  function waitForGoogle(attempt) {
    if (window.google && google.accounts && google.accounts.id) {
      renderGoogleButton();
      return;
    }
    if ((attempt || 0) >= 40) {
      renderGoogleButton();
      return;
    }
    setTimeout(function () {
      waitForGoogle((attempt || 0) + 1);
    }, 100);
  }

  function initGoogleSignIn() {
    var stored = readStoredSession();
    if (stored) setReviewSession(stored);
    else showSignedOut();
    if (googleClientId()) waitForGoogle(0);
    else renderGoogleButton();
  }

  function validateReviewForm() {
    if (!reviewForm) return false;
    var firstInvalid = null;
    function fail(id, message) {
      setFieldError(id, message);
      if (!firstInvalid) {
        firstInvalid = id === "review-rating"
          ? document.getElementById("review-star-1")
          : document.getElementById(id);
      }
    }

    var name = collapseSpaces(reviewForm.elements.name.value);
    reviewForm.elements.name.value = name;
    if (!name) fail("review-name", "Enter your name.");
    else if (!isPersonName(name)) fail("review-name", "Use letters and spaces only.");
    else setFieldError("review-name", "");

    var designation = collapseSpaces(reviewForm.elements.designation.value);
    reviewForm.elements.designation.value = designation;
    if (!designation) fail("review-designation", "Enter your designation or role.");
    else if (!isMeaningfulText(designation, 2, 80)) fail("review-designation", "Enter a real designation or role.");
    else setFieldError("review-designation", "");

    var company = collapseSpaces(reviewForm.elements.company.value);
    reviewForm.elements.company.value = company;
    if (company && !isMeaningfulText(company, 2, 80)) fail("review-company", "Enter a real company or place, or leave this blank.");
    else setFieldError("review-company", "");

    var rating = selectedRating();
    if (!/^[1-5]$/.test(rating)) fail("review-rating", "Choose a star rating.");
    else setFieldError("review-rating", "");

    var review = collapseSpaces(reviewForm.elements.review.value);
    reviewForm.elements.review.value = review;
    syncReviewCount();
    if (!review) fail("review-text", "Write a short review.");
    else if (review.length < 20) fail("review-text", "Please write at least 20 characters.");
    else if (review.length > 400) fail("review-text", "Keep this to 400 characters.");
    else if (!isMeaningfulText(review, 20, 400)) fail("review-text", "Please write a real review.");
    else setFieldError("review-text", "");

    if (firstInvalid && typeof firstInvalid.focus === "function") firstInvalid.focus();
    return !firstInvalid;
  }

  function showReviewThanks() {
    if (reviewForm) reviewForm.hidden = true;
    if (reviewIntro) reviewIntro.hidden = true;
    if (reviewAuth) reviewAuth.hidden = true;
    if (reviewSigned) reviewSigned.hidden = true;
    if (reviewRoom) reviewRoom.classList.add("is-thanks");
    if (reviewDialog) reviewDialog.classList.add("is-thanks");
    if (reviewThanks) {
      reviewThanks.hidden = false;
      reviewThanks.focus();
    }
  }

  function resetReviewForm() {
    if (reviewDialog) reviewDialog.classList.remove("is-thanks");
    if (reviewRoom) reviewRoom.classList.remove("is-thanks");
    if (reviewIntro) reviewIntro.hidden = false;
    if (reviewForm) {
      reviewForm.reset();
    }
    clearReviewFieldErrors();
    if (reviewThanks) reviewThanks.hidden = true;
    if (reviewSubmitError) reviewSubmitError.hidden = true;
    if (reviewSubmitBtn) reviewSubmitBtn.disabled = false;
    syncReviewCount();
    if (reviewSession) showSignedIn();
    else showSignedOut();
  }

  function openReviewDialog() {
    if (!reviewDialog) return false;
    resetReviewForm();
    reviewLastFocus = document.activeElement;
    if (typeof reviewDialog.showModal === "function") {
      if (!reviewDialog.open) reviewDialog.showModal();
    } else {
      reviewDialog.setAttribute("open", "");
    }
    if (reviewSession) {
      var name = document.getElementById("review-name");
      if (name && reviewForm && !reviewForm.hidden) name.focus();
    } else if (reviewGoogleFallback && !reviewGoogleFallback.hidden) {
      reviewGoogleFallback.focus();
    }
    return true;
  }

  function closeReviewDialog() {
    if (!reviewDialog) return;
    if (typeof reviewDialog.close === "function" && reviewDialog.open) {
      reviewDialog.close();
    } else {
      reviewDialog.removeAttribute("open");
    }
  }

  function starMarkup(count) {
    var n = Math.max(1, Math.min(5, parseInt(count, 10) || 5));
    var html = "";
    var i;
    for (i = 0; i < 5; i++) {
      html += '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="' +
        (i < n ? "#C4A15A" : "#E0B8A0") + '" d="' + starPath + '"/></svg>';
    }
    return html;
  }

  function starLabel(count) {
    var n = Math.max(1, Math.min(5, parseInt(count, 10) || 5));
    return n + (n === 1 ? " star" : " stars");
  }

  function makeCard(row, index, withHit) {
    var card = document.createElement("article");
    card.className = "t-card";
    if (withHit) {
      var hit = document.createElement("a");
      hit.className = "t-card-hit";
      hit.href = "testimonials.html";
      hit.setAttribute("aria-label", "Testimonials");
      card.appendChild(hit);
    }
    var stars = document.createElement("p");
    stars.className = "t-stars";
    stars.setAttribute("aria-label", starLabel(row.rating));
    stars.innerHTML = starMarkup(row.rating);
    card.appendChild(stars);

    var quote = document.createElement("blockquote");
    quote.className = "t-quote";
    var quoteP = document.createElement("p");
    quoteP.textContent = collapseSpaces(row.review);
    quote.appendChild(quoteP);
    card.appendChild(quote);

    var person = document.createElement("footer");
    person.className = "t-person";
    var avatar = document.createElement("span");
    avatar.className = "t-avatar";
    avatar.setAttribute("aria-hidden", "true");
    var img = document.createElement("img");
    img.src = "img/placeholders/portrait-" + ((index % 6) + 1) + ".svg";
    img.alt = "";
    img.width = 40;
    img.height = 40;
    avatar.appendChild(img);
    person.appendChild(avatar);
    var who = document.createElement("span");
    var nameEl = document.createElement("span");
    nameEl.className = "t-name";
    nameEl.textContent = collapseSpaces(row.name);
    var roleEl = document.createElement("span");
    roleEl.className = "t-role";
    roleEl.textContent = collapseSpaces(row.email) || collapseSpaces(row.designation);
    who.appendChild(nameEl);
    who.appendChild(roleEl);
    person.appendChild(who);
    card.appendChild(person);

    var sign = document.createElement("p");
    sign.className = "t-sign";
    sign.textContent = collapseSpaces(row.name);
    card.appendChild(sign);
    return card;
  }

  function makeNamedCard(row) {
    var card = document.createElement("article");
    card.className = "reviews-named";
    var stars = document.createElement("p");
    stars.className = "reviews-named-stars";
    stars.setAttribute("aria-label", starLabel(row.rating));
    stars.innerHTML = starMarkup(row.rating);
    card.appendChild(stars);
    var quote = document.createElement("blockquote");
    quote.className = "reviews-named-quote";
    var quoteP = document.createElement("p");
    quoteP.textContent = collapseSpaces(row.review);
    quote.appendChild(quoteP);
    card.appendChild(quote);
    var nameEl = document.createElement("p");
    nameEl.className = "reviews-named-name";
    nameEl.textContent = collapseSpaces(row.name);
    card.appendChild(nameEl);
    var emailEl = document.createElement("p");
    emailEl.className = "reviews-named-email";
    emailEl.textContent = collapseSpaces(row.email) || collapseSpaces(row.designation);
    card.appendChild(emailEl);
    return card;
  }

  function usableReviews(rows) {
    return (rows || []).filter(function (row) {
      return collapseSpaces(row && row.review) && collapseSpaces(row && row.name);
    }).sort(function (a, b) {
      return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
    });
  }

  function markPhotoNamed() {
    var flag = document.querySelector("#testimonials .t-flag");
    var stat = document.querySelector("#testimonials .t-photo-stat");
    if (!flag || !stat) return;
    flag.textContent = "Reviews";
    while (stat.childNodes.length > 1) stat.removeChild(stat.lastChild);
    stat.appendChild(document.createTextNode(" From people walking with us."));
  }

  function renderCarousel(reviews) {
    var track = document.querySelector("#testimonials .t-track");
    if (!track || !reviews.length) return;
    var withHit = !!document.querySelector("#testimonials .t-card-hit");
    track.innerHTML = "";
    reviews.forEach(function (row, index) {
      track.appendChild(makeCard(row, index, withHit));
    });
    markPhotoNamed();
  }

  function renderShowcase(reviews) {
    var list = document.getElementById("reviews-list");
    if (!list || !reviews.length) return;
    list.innerHTML = "";
    reviews.forEach(function (row) {
      list.appendChild(makeNamedCard(row));
    });
  }

  function loadReviews() {
    if (!reviewSheetUrl) return;
    fetch(reviewSheetUrl, {
      method: "GET",
      redirect: "follow"
    }).then(function (res) {
      if (!res.ok) throw new Error("get failed");
      return res.json();
    }).then(function (data) {
      var reviews = usableReviews(data && data.reviews);
      if (!reviews.length) return;
      renderCarousel(reviews);
      renderShowcase(reviews);
    }).catch(function () {});
  }

  function submitReview() {
    if (reviewSubmitError) reviewSubmitError.hidden = true;
    if (!reviewSession || !isEmail(reviewSession.email)) {
      if (reviewSubmitError) {
        reviewSubmitError.textContent = "Sign in with Google before leaving a review.";
        reviewSubmitError.hidden = false;
      }
      showSignedOut();
      return;
    }
    if (!validateReviewForm()) return;

    var payload = {
      name: reviewForm.elements.name.value,
      designation: reviewForm.elements.designation.value,
      company: reviewForm.elements.company.value,
      rating: selectedRating(),
      review: reviewForm.elements.review.value,
      email: reviewSession.email,
      source: reviewSource()
    };

    if (reviewSubmitBtn) reviewSubmitBtn.disabled = true;
    fetch(reviewSheetUrl, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error("submit failed");
      showReviewThanks();
      loadReviews();
    }).catch(function () {
      if (reviewSubmitError) {
        reviewSubmitError.textContent = "Something went wrong. Your review could not be stored. Please try again.";
        reviewSubmitError.hidden = false;
      }
      if (reviewSubmitBtn) reviewSubmitBtn.disabled = false;
    });
  }

  if (reviewForm) {
    reviewForm.addEventListener("input", function (e) {
      var target = e.target;
      if (!target) return;
      if (target.name === "review") syncReviewCount();
      if (target.id && reviewFieldIds.indexOf(target.id) !== -1) {
        setFieldError(target.id, "");
      }
      if (target.name === "rating") setFieldError("review-rating", "");
    });
    reviewForm.addEventListener("change", function (e) {
      if (e.target && e.target.name === "rating") setFieldError("review-rating", "");
    });
    reviewForm.addEventListener("submit", function (e) {
      e.preventDefault();
      submitReview();
    });
    syncReviewCount();
  }

  if (reviewGoogleFallback) {
    reviewGoogleFallback.addEventListener("click", function () {
      if (googleClientId()) {
        setAuthError("Google Sign-In is still loading. Please wait a moment.");
        waitForGoogle(0);
        return;
      }
      setAuthError("Paste your Google Client ID in js/google-client.js to enable Sign in with Google.");
    });
  }

  document.addEventListener("click", function (e) {
    if (!e.target.closest("[data-review-signout]")) return;
    e.preventDefault();
    if (window.google && google.accounts && google.accounts.id && google.accounts.id.disableAutoSelect) {
      google.accounts.id.disableAutoSelect();
    }
    if (reviewForm) reviewForm.reset();
    clearReviewFieldErrors();
    showSignedOut();
    renderGoogleButton();
  });

  if (reviewDialog) {
    reviewDialog.addEventListener("click", function (e) {
      if (e.target === reviewDialog) closeReviewDialog();
    });
    reviewDialog.addEventListener("close", function () {
      resetReviewForm();
      if (reviewLastFocus && typeof reviewLastFocus.focus === "function") {
        reviewLastFocus.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-review-close]")) {
        e.preventDefault();
        closeReviewDialog();
      }
    });
    document.addEventListener("click", function (e) {
      var opener = e.target.closest("[data-review-open]");
      if (!opener) return;
      e.preventDefault();
      openReviewDialog();
    });
    if ((location.hash || "") === "#leave-review") {
      openReviewDialog();
    }
    window.addEventListener("hashchange", function () {
      if ((location.hash || "") === "#leave-review") openReviewDialog();
    });
  }

  initGoogleSignIn();
  loadReviews();
})();
