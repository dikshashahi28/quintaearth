(function () {
  document.querySelectorAll('[data-placeholder]').forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
    });
  });

  document.querySelectorAll("#siteOffcanvas a[href]:not([data-placeholder])").forEach(function (a) {
    a.addEventListener("click", function () {
      var oc = document.getElementById("siteOffcanvas");
      if (oc && window.bootstrap) {
        var inst = bootstrap.Offcanvas.getInstance(oc);
        if (inst) inst.hide();
      }
    });
  });

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
    cover.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        window.quintaPlayYt(e);
      }
    });
  }
})();
