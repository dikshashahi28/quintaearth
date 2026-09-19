(function () {
  var reviewForm = document.getElementById("review-form");
  var reviewThanks = document.getElementById("review-thanks");
  var reviewRoom = document.getElementById("leave-review");
  var reviewSubmitError = document.getElementById("review-submit-error");
  var reviewSubmitBtn = reviewForm && reviewForm.querySelector('button[type="submit"]');
  var reviewCount = document.getElementById("review-count");
  var reviewSheetUrl = "";
  var reviewFieldIds = [
    "review-name",
    "review-designation",
    "review-company",
    "review-rating",
    "review-text"
  ];

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
    if (reviewRoom) reviewRoom.classList.add("is-thanks");
    if (reviewThanks) {
      reviewThanks.hidden = false;
      reviewThanks.focus();
    }
  }

  function submitReview() {
    if (reviewSubmitError) reviewSubmitError.hidden = true;
    if (!validateReviewForm()) return;

    var payload = {
      name: reviewForm.elements.name.value,
      designation: reviewForm.elements.designation.value,
      company: reviewForm.elements.company.value,
      rating: selectedRating(),
      review: reviewForm.elements.review.value
    };

    if (!reviewSheetUrl) {
      showReviewThanks();
      return;
    }

    if (reviewSubmitBtn) reviewSubmitBtn.disabled = true;
    fetch(reviewSheetUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).then(function () {
      showReviewThanks();
    }).catch(function () {
      if (reviewSubmitError) reviewSubmitError.hidden = false;
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
})();
