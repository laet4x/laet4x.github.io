(() => {
  'use strict';

  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const button = document.querySelector('.motion-toggle');
  const fields = [];
  const onScreen = new Set();
  const storageKey = 'laet4x-motion';
  let choice = null;
  let paused = true;
  let frame = 0;
  let lastFrame = 0;
  let elapsed = 0;

  try { choice = localStorage.getItem(storageKey); } catch { /* Private browsing. */ }

  function heroPoint(u, v, t, width, height) {
    const mobile = width < 701;
    const twist = Math.sin(u * 7.8 - t * .35 + .6);
    const crest = Math.sin(u * 9.1 + t * .31 + v * .64);
    const centre = (mobile ? .83 : .84) - Math.sin(u * 4.4 - 1.3) * .12;
    const spread = (.043 + .072 * twist) * v;
    return [u * width, height * (centre + .072 * crest + spread)];
  }

  function paintHero(ctx, width, height, t) {
    const ink = ctx.createLinearGradient(0, 0, width, 0);
    ink.addColorStop(0, '#9ed978');
    ink.addColorStop(.24, '#5fa773');
    ink.addColorStop(.56, '#abf193');
    ink.addColorStop(1, '#499d74');
    ctx.strokeStyle = ink;
    const strands = width < 701 ? 24 : 34;
    const samples = Math.ceil(width / 13);

    for (let row = 0; row < strands; row++) {
      const v = row / (strands - 1) * 2 - 1;
      ctx.globalAlpha = row % 7 === 0 ? .69 : .29 + .10 * Math.cos(v * 3);
      ctx.lineWidth = row % 7 === 0 ? 1.1 : .8;
      ctx.beginPath();
      for (let i = 0; i <= samples; i++) {
        const p = heroPoint(i / samples, v, t, width, height);
        if (i === 0) ctx.moveTo(...p);
        else ctx.lineTo(...p);
      }
      ctx.stroke();
    }

    // Short cross-lines expose the twist as the ribbon turns toward the viewer.
    ctx.globalAlpha = .18;
    ctx.lineWidth = .65;
    ctx.beginPath();
    for (let column = 0; column <= samples; column += 2) {
      const u = column / samples;
      for (let j = 0; j <= 8; j++) {
        const p = heroPoint(u, j / 4 - 1, t, width, height);
        if (j === 0) ctx.moveTo(...p);
        else ctx.lineTo(...p);
      }
    }
    ctx.stroke();

    // Tracers follow individual strands along the surface.
    for (let tracer = 0; tracer < 5; tracer++) {
      const u = (t * (.035 + tracer * .002) + tracer * .217) % 1;
      const v = -.84 + tracer * .41;
      const [x, y] = heroPoint(u, v, t, width, height);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 9);
      glow.addColorStop(0, '#caffaad9');
      glow.addColorStop(.28, '#a5ff8c83');
      glow.addColorStop(1, '#90ff7c00');
      ctx.globalAlpha = .95;
      ctx.fillStyle = glow;
      ctx.fillRect(x - 9, y - 9, 18, 18);
      ctx.fillStyle = '#e5ffd3';
      ctx.fillRect(x - 1.3, y - 1.3, 2.6, 2.6);
    }

    // Sparse registration marks stay behind the heading and portrait.
    ctx.fillStyle = '#9ec182';
    for (let i = 0; i < 44; i++) {
      const x = ((i * .618034 + .023) % 1) * width;
      const y = ((i * .414214 + .043 + t * .0012) % 1) * height;
      ctx.globalAlpha = .19 + .13 * Math.sin(i + t * .41);
      ctx.fillRect(x, y, i % 8 === 0 ? 5 : 1.4, 1.2);
      if (i % 8 === 0) ctx.fillRect(x + 2, y - 2, 1, 5);
    }
  }

  function paintContours(ctx, width, height, t, variant) {
    const phase = variant * 1.37 + t * .19;
    const swells = 8;
    const points = Math.ceil(width / 15);
    function level(u, row) {
      return height * (.40 + .19 * Math.sin(u * 5.1 + phase + row * .10)
        + .09 * Math.cos(u * 11 - phase * .5) + row * .045);
    }
    for (let row = 0; row < swells; row++) {
      ctx.strokeStyle = row === 3 ? '#75a35d' : '#537c50';
      ctx.globalAlpha = row === 3 ? .42 : .29;
      ctx.lineWidth = .8;
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const u = i / points;
        const y = level(u, row);
        if (i === 0) ctx.moveTo(0, y);
        else ctx.lineTo(width * u, y);
      }
      ctx.stroke();
    }
    const u = (t * .037 + variant * .171) % 1;
    ctx.globalAlpha = .75;
    ctx.fillStyle = '#c4eb95';
    ctx.fillRect(width * u - 1.6, level(u, 3) - 1.6, 3.2, 3.2);
  }

  function paint(field) {
    const {context, width, height, hero, index} = field;
    if (!width || !height) return;
    context.clearRect(0, 0, width, height);
    if (hero) paintHero(context, width, height, elapsed);
    else paintContours(context, width, height, elapsed, index);
    context.globalAlpha = 1;
  }

  function resize(field) {
    const width = field.canvas.clientWidth;
    const height = field.canvas.clientHeight;
    const density = Math.min(window.devicePixelRatio || 1, 1.5);
    field.canvas.width = Math.round(width * density);
    field.canvas.height = Math.round(height * density);
    field.width = width;
    field.height = height;
    field.context.setTransform(density, 0, 0, density, 0, 0);
    paint(field);
  }

  function animate(now) {
    frame = requestAnimationFrame(animate);
    if (lastFrame && now - lastFrame < 1000 / 30) return;
    elapsed += lastFrame ? Math.min(now - lastFrame, 120) / 1000 : 0;
    lastFrame = now;
    for (const field of onScreen) paint(field);
  }

  function schedule() {
    if (!paused && onScreen.size && !document.hidden) {
      if (!frame) frame = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      lastFrame = 0;
    }
  }

  function applyPreference() {
    paused = choice === 'paused' || (choice !== 'playing' && preference.matches);
    document.documentElement.dataset.motion = paused ? 'paused' : 'playing';
    const label = paused ? 'Play motion' : 'Pause motion';
    button.querySelector('.motion-label').textContent = label;
    button.title = label;
    schedule();
  }

  for (const [index, canvas] of document.querySelectorAll('.signal-field').entries()) {
    const context = canvas.getContext('2d');
    if (!context) continue;
    const field = {canvas, context, index, hero: canvas.classList.contains('hero-field')};
    fields.push(field);
    resize(field);
  }
  if (!fields.length) return;

  const byCanvas = new Map(fields.map(field => [field.canvas, field]));
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const field = byCanvas.get(entry.target);
      if (entry.isIntersecting) onScreen.add(field);
      else onScreen.delete(field);
      if (field.hero) field.canvas.parentElement.toggleAttribute('data-optics-idle', !entry.isIntersecting);
    }
    schedule();
  });
  const sizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) resize(byCanvas.get(entry.target));
  });
  for (const field of fields) {
    observer.observe(field.canvas);
    sizeObserver.observe(field.canvas);
  }
  button.hidden = false;
  button.addEventListener('click', () => {
    choice = paused ? 'playing' : 'paused';
    try { localStorage.setItem(storageKey, choice); } catch { /* Keep the choice for this visit. */ }
    applyPreference();
  });
  preference.addEventListener('change', applyPreference);
  document.addEventListener('visibilitychange', schedule);
  applyPreference();
})();
