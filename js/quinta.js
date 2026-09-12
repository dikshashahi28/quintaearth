(function () {
  document.querySelectorAll("[data-placeholder]").forEach(function (el) {
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
    oc.querySelectorAll(".nav-toggle").forEach(function (toggle) {
      toggle.addEventListener("keydown", function (e) {
        if (e.key === " ") {
          e.preventDefault();
          toggle.click();
        }
      });
      toggle.addEventListener("click", function (e) {
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
})();
