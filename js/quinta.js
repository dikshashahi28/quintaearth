(function () {
  document.querySelectorAll("[data-placeholder]").forEach(function (el) {
    el.setAttribute("aria-describedby", "link-coming-soon");
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

  function industryGroupRoot() {
    return document.getElementById("oc-ind-groups");
  }

  function isIndustryGroupPanel(panel) {
    var root = industryGroupRoot();
    return !!(root && panel && panel.parentElement && panel.parentElement.parentElement === root);
  }

  function applyIndustryFocus(item) {
    var root = industryGroupRoot();
    if (!root) return;
    root.querySelectorAll(":scope > .accordion-item").forEach(function (other) {
      other.classList.toggle("is-focused", !!item && other === item);
    });
    root.classList.toggle("focus-nested", !!item);
  }

  function syncIndustryFocus() {
    var root = industryGroupRoot();
    if (!root) return;
    var openItem = null;
    root.querySelectorAll(":scope > .accordion-item").forEach(function (item) {
      var panel = item.querySelector(":scope > .accordion-collapse");
      if (panel && panel.classList.contains("show")) openItem = item;
    });
    applyIndustryFocus(openItem);
  }

  function hideCollapse(el) {
    if (!el || !window.bootstrap) return;
    var inst = bootstrap.Collapse.getInstance(el) || new bootstrap.Collapse(el, { toggle: false });
    inst.hide();
  }

  var oc = document.getElementById("siteOffcanvas");
  if (oc) {
    oc.addEventListener("show.bs.collapse", function (e) {
      if (isIndustryGroupPanel(e.target)) applyIndustryFocus(e.target.parentElement);
    });
    oc.addEventListener("shown.bs.collapse", syncIndustryFocus);
    oc.addEventListener("hidden.bs.collapse", syncIndustryFocus);
    oc.addEventListener("hidden.bs.offcanvas", function () {
      hideCollapse(document.getElementById("oc-ind-root"));
      hideCollapse(document.getElementById("oc-press-sub"));
      var root = industryGroupRoot();
      if (root) {
        root.querySelectorAll(".accordion-collapse.show").forEach(hideCollapse);
        applyIndustryFocus(null);
      }
    });
    syncIndustryFocus();
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
})();
