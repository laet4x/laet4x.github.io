(function () {
  "use strict";

  /* Mobile nav toggle */
  var navToggle = document.querySelector(".nav-toggle");
  var navbar = document.querySelector(".navbar");
  if (navToggle && navbar) {
    navToggle.addEventListener("click", function () {
      var open = navbar.classList.toggle("is-open");
      navToggle.innerHTML = open
        ? '<i class="ri-close-line"></i>'
        : '<i class="ri-menu-line"></i>';
      navToggle.setAttribute("aria-expanded", open);
    });
    navbar.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navbar.classList.remove("is-open");
        navToggle.innerHTML = '<i class="ri-menu-line"></i>';
      });
    });
  }

  /* Header background on scroll + back-to-top visibility */
  var header = document.getElementById("header");
  var backToTop = document.querySelector(".back-to-top");
  var onScroll = function () {
    var scrolled = window.scrollY > 40;
    if (header) header.classList.toggle("is-scrolled", scrolled);
    if (backToTop) backToTop.classList.toggle("is-visible", window.scrollY > 500);
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* Active nav link tracking (single-page sections) */
  var sections = [].slice.call(document.querySelectorAll("main section[id]"));
  var navLinks = [].slice.call(document.querySelectorAll(".navbar a[href^='#']"));
  if (sections.length && navLinks.length && "IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (link) {
            link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach(function (s) {
      sectionObserver.observe(s);
    });
  }

  /* Scroll reveal */
  var revealEls = [].slice.call(document.querySelectorAll(".reveal"));
  if (revealEls.length) {
    if ("IntersectionObserver" in window) {
      var revealObserver = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      revealEls.forEach(function (el) {
        revealObserver.observe(el);
      });
    } else {
      revealEls.forEach(function (el) {
        el.classList.add("is-visible");
      });
    }
  }

  /* Count-up stats */
  var statEls = [].slice.call(document.querySelectorAll(".stat-box .num[data-count]"));
  if (statEls.length && "IntersectionObserver" in window) {
    var animateCount = function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      var duration = 900;
      var start = null;
      var step = function (ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    var statObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    statEls.forEach(function (el) {
      statObserver.observe(el);
    });
  }
})();
