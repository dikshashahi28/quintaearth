(function () {
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
      nav.classList.toggle("is-open", !open);
    });

    nav.addEventListener("click", function (event) {
      var target = event.target;
      if (target && target.tagName === "A" && toggle.getAttribute("aria-expanded") === "true") {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      }
    });
  }

  var form = document.getElementById("discussion-form");
  var status = document.getElementById("form-status");
  var btn = document.getElementById("share-btn");

  if (form && status && btn) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      status.textContent =
        "Thank you. Sharing is not live yet — your note stays on this device for now.";
      btn.disabled = true;
      window.setTimeout(function () {
        btn.disabled = false;
      }, 1200);
    });
  }
})();
