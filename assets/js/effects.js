(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*<>/\\|";

  /* ---------------------------------------------------------
   * Text scramble / decode-in
   * ------------------------------------------------------- */
  function scrambleText(el, finalText, duration, onDone) {
    var len = finalText.length;
    var totalFrames = Math.max(1, Math.round(duration / 16));
    var frame = 0;

    function step() {
      var revealCount = Math.floor((frame / totalFrames) * len);
      var out = "";
      for (var i = 0; i < len; i++) {
        var ch = finalText[i];
        if (ch === " " || i < revealCount) {
          out += ch;
        } else {
          out += SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
        }
      }
      el.textContent = out;
      frame++;
      if (frame <= totalFrames) {
        requestAnimationFrame(step);
      } else {
        el.textContent = finalText;
        if (onDone) onDone();
      }
    }
    step();
  }

  function flashGlitch(el, duration) {
    el.classList.add("is-glitching");
    setTimeout(function () {
      el.classList.remove("is-glitching");
    }, duration || 360);
  }

  function initScrambleTargets() {
    var targets = [].slice.call(document.querySelectorAll(".scramble-target"));
    if (!targets.length) return;

    targets.forEach(function (el) {
      var text = el.textContent.trim();
      el.dataset.text = text;
      if (prefersReducedMotion) return;

      if (!("IntersectionObserver" in window)) return;

      var observer = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            scrambleText(el, text, 550, function () {
              flashGlitch(el);
            });
            obs.unobserve(el);
          });
        },
        { threshold: 0.4 }
      );
      observer.observe(el);
    });
  }

  /* ---------------------------------------------------------
   * Idle glitch flicker on the hero name
   * ------------------------------------------------------- */
  function initHeroIdleGlitch() {
    var heroName = document.getElementById("heroName");
    var hero = document.getElementById("hero");
    if (!heroName || !hero || prefersReducedMotion) return;

    var heroVisible = false;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          heroVisible = entry.isIntersecting;
        });
      }).observe(hero);
    } else {
      heroVisible = true;
    }

    function scheduleNext() {
      var delay = 6000 + Math.random() * 5000;
      setTimeout(function () {
        if (heroVisible && !document.hidden) flashGlitch(heroName);
        scheduleNext();
      }, delay);
    }
    scheduleNext();
  }

  /* ---------------------------------------------------------
   * Hero intro (runs immediately on load, no boot screen)
   * ------------------------------------------------------- */
  function runHeroIntro() {
    var heroName = document.getElementById("heroName");
    if (!heroName) return;
    var text = heroName.textContent.trim();
    heroName.dataset.text = text;
    if (prefersReducedMotion) return;
    scrambleText(heroName, text, 500, function () {
      flashGlitch(heroName, 380);
      initHeroIdleGlitch();
    });
  }

  /* ---------------------------------------------------------
   * Custom cursor + magnetic buttons
   * ------------------------------------------------------- */
  function initCursorAndMagnetic() {
    if (!canHover || prefersReducedMotion) return;

    var dot = document.getElementById("cursorDot");
    var ring = document.getElementById("cursorRing");
    if (dot && ring) {
      var mouseX = 0, mouseY = 0;
      var ringX = 0, ringY = 0;
      var active = false;

      function showCursor() {
        if (active) return;
        active = true;
        document.body.classList.add("custom-cursor");
        dot.classList.add("is-active");
        ring.classList.add("is-active");
      }

      function hideCursor() {
        if (!active) return;
        active = false;
        document.body.classList.remove("custom-cursor");
        dot.classList.remove("is-active");
        ring.classList.remove("is-active");
      }

      document.addEventListener("mousemove", function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        showCursor();
        dot.style.transform = "translate(" + mouseX + "px," + mouseY + "px) translate(-50%,-50%)";
      });

      // Leaving the viewport (to browser chrome, another app, or off-screen)
      // must restore the real system cursor — otherwise cursor:none sticks
      // and nothing is visible at all until the mouse moves again inside.
      document.addEventListener("mouseout", function (e) {
        if (!e.relatedTarget && !e.toElement) hideCursor();
      });
      document.addEventListener("mouseleave", hideCursor);
      window.addEventListener("blur", hideCursor);

      (function ringLoop() {
        ringX += (mouseX - ringX) * 0.18;
        ringY += (mouseY - ringY) * 0.18;
        ring.style.transform = "translate(" + ringX + "px," + ringY + "px) translate(-50%,-50%)";
        requestAnimationFrame(ringLoop);
      })();

      var hoverables = "a, button, .btn, .cert-card, .project-card, .teaser-card, .timeline-year summary, input, textarea";
      document.addEventListener("mouseover", function (e) {
        if (e.target.closest && e.target.closest(hoverables)) {
          ring.classList.add("is-hovering");
        }
      });
      document.addEventListener("mouseout", function (e) {
        if (e.target.closest && e.target.closest(hoverables)) {
          ring.classList.remove("is-hovering");
        }
      });
    }

    var magnets = [].slice.call(document.querySelectorAll(".btn, .social-links a"));
    magnets.forEach(function (el) {
      var targetX = 0, targetY = 0, curX = 0, curY = 0;
      var hovering = false;

      el.addEventListener("mousemove", function (e) {
        var rect = el.getBoundingClientRect();
        var relX = e.clientX - (rect.left + rect.width / 2);
        var relY = e.clientY - (rect.top + rect.height / 2);
        targetX = Math.max(-8, Math.min(8, relX * 0.35));
        targetY = Math.max(-8, Math.min(8, relY * 0.35));
        hovering = true;
      });

      el.addEventListener("mouseleave", function () {
        hovering = false;
        targetX = 0;
        targetY = 0;
      });

      (function magLoop() {
        curX += (targetX - curX) * 0.2;
        curY += (targetY - curY) * 0.2;
        if (Math.abs(curX) > 0.05 || Math.abs(curY) > 0.05 || hovering) {
          el.style.transform = "translate(" + curX.toFixed(2) + "px," + curY.toFixed(2) + "px)";
        }
        requestAnimationFrame(magLoop);
      })();
    });
  }

  /* ---------------------------------------------------------
   * Init
   * ------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    runHeroIntro();
    initScrambleTargets();
    initCursorAndMagnetic();
  });
})();
