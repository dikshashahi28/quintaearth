(function () {
  "use strict";

  window.addEventListener("scroll", function () {
    var wrap = document.querySelector(".fixed-top .container");
    if (!wrap) return;
    if (window.scrollY > 300) {
      wrap.classList.add("shadow-sm");
      wrap.style.maxWidth = "100%";
    } else {
      wrap.classList.remove("shadow-sm");
      wrap.style.maxWidth = "";
    }
    var top = document.querySelector(".back-to-top");
    if (top) top.style.display = window.scrollY > 300 ? "flex" : "none";
  });

  var topBtn = document.querySelector(".back-to-top");
  if (topBtn) {
    topBtn.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();
