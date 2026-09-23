// STC — scripts. One IIFE per component, initialised by class / data-attribute.

// .header--overlay scrolls away with the hero it's laid over (see the CSS
// comment on .header--stuck) — past a few pixels of scroll it needs to
// become a plain fixed bar instead, so the rest of the page keeps a header.
(function () {
  var header = document.querySelector('.header--overlay');
  if (!header) return;

  var STUCK_AT = 4;
  var stuck = false;
  var ticking = false;

  function apply() {
    var shouldStick = window.scrollY > STUCK_AT;
    if (shouldStick !== stuck) {
      stuck = shouldStick;
      header.classList.toggle('header--stuck', stuck);
    }
    ticking = false;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(apply);
  }

  apply();
  window.addEventListener('scroll', onScroll, { passive: true });
})();
