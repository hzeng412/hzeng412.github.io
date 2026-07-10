/* Home hero: on load, ink dots fly in from beyond the edges, assemble into a
   point cloud of the photograph, take on its real colors, then resolve into
   the photo itself. Also drives the transparent -> paper navigation bar.
   Dependency-free. */
(function () {
  var box = document.getElementById('hero-stage');

  /* --- nav: transparent while the hero fills the screen, paper after --- */
  var nav = document.querySelector('.nav.nav-overlay');
  if (nav) {
    var onScroll = function () {
      var limit = box ? box.offsetHeight - nav.offsetHeight - 8 : 24;
      nav.classList.toggle('scrolled', window.scrollY > limit);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  if (!box) return;

  var img = box.querySelector('.hero-photo');
  var canvas = box.querySelector('canvas.intro');

  var PAPER = '#f7f6f2';
  var INK = { r: 23, g: 22, b: 19 };
  var CROP_Y = 0.7;            /* matches CSS object-position 50% 70% */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function finish() {
    canvas.style.display = 'none';
    img.style.opacity = 1;
    box.classList.add('ready');
  }

  /* Sample the photo on a grid; keep dots where there is structure
     (gradient) or darkness, like a LiDAR return map. */
  function sampleDots() {
    var w = box.clientWidth, h = box.clientHeight;
    var iw = img.naturalWidth, ih = img.naturalHeight;
    if (!iw || !w) return null;

    var s = Math.max(w / iw, h / ih);
    var sw = w / s, sh = h / s;
    var sx = (iw - sw) / 2, sy = (ih - sh) * CROP_Y;

    var cols = Math.min(200, Math.max(110, Math.round(w / 7)));
    var rows = Math.max(1, Math.round(cols * h / w));
    var off = document.createElement('canvas');
    off.width = cols; off.height = rows;
    var octx = off.getContext('2d');
    octx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
    var data;
    try {
      data = octx.getImageData(0, 0, cols, rows).data;
    } catch (e) {
      return null; /* canvas tainted (e.g. file://) — skip the intro */
    }

    function lum(i, j) {
      i = Math.max(0, Math.min(cols - 1, i));
      j = Math.max(0, Math.min(rows - 1, j));
      var k = (j * cols + i) * 4;
      return (0.2126 * data[k] + 0.7152 * data[k + 1] + 0.0722 * data[k + 2]) / 255;
    }

    var cw = w / cols, ch = h / rows;
    var dots = [];
    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        var l = lum(i, j);
        var gx = lum(i + 1, j) - lum(i - 1, j);
        var gy = lum(i, j + 1) - lum(i, j - 1);
        var grad = Math.sqrt(gx * gx + gy * gy);
        var t = Math.min(1, 2.6 * grad + 0.55 * Math.pow(1 - l, 2.2));
        var r = Math.pow(t, 1.25) * cw * 0.6;
        if (r < 0.32) continue;
        var k = (j * cols + i) * 4;
        dots.push({
          x: (i + 0.5) * cw + Math.sin(i * 12.9898 + j * 78.233) * 1.1,
          y: (j + 0.5) * ch + Math.cos(i * 4.898 + j * 7.23) * 1.1,
          r: r,
          cr: data[k], cg: data[k + 1], cb: data[k + 2]
        });
      }
    }
    return { dots: dots, w: w, h: h };
  }

  function runIntro(sampled) {
    /* One continuous flow: every dot colorizes as IT lands (not in a global
       phase), and the photo starts rising under the cloud while the last
       dots are still flying, each dot dissolving into it on its own beat. */
    var FLY = 1600, COLOR = 750, REVEAL = 2000, STAGGER = 700;
    var REVEAL_START = STAGGER + FLY * 0.45;
    var TOTAL = REVEAL_START + REVEAL + 250;
    var w = sampled.w, h = sampled.h;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var dots = sampled.dots;

    /* cover-crop mapping for drawing the photo into the canvas */
    var iw = img.naturalWidth, ih = img.naturalHeight;
    var s = Math.max(w / iw, h / ih);
    var sw = w / s, sh = h / s;
    var sx = (iw - sw) / 2, sy = (ih - sh) * CROP_Y;

    for (var n = 0; n < dots.length; n++) {
      var d = dots[n];
      var ang = Math.sin(n * 91.7) * Math.PI * 2;
      var cx = Math.cos(ang), cy = Math.sin(ang);
      /* project from the target out past the screen edge along (cx, cy),
         so every dot starts fully off-screen */
      var tExit = Infinity;
      if (cx > 0.0001) tExit = Math.min(tExit, (w - d.x) / cx);
      else if (cx < -0.0001) tExit = Math.min(tExit, -d.x / cx);
      if (cy > 0.0001) tExit = Math.min(tExit, (h - d.y) / cy);
      else if (cy < -0.0001) tExit = Math.min(tExit, -d.y / cy);
      if (!isFinite(tExit)) { cx = 1; cy = 0; tExit = w - d.x; }
      var dist = tExit + 60 + Math.abs(Math.sin(n * 3.3)) * 500;
      d.sx = d.x + cx * dist;
      d.sy = d.y + cy * dist;
      d.delay = Math.abs(Math.sin(n * 7.13)) * STAGGER;
      d.fade = Math.abs(Math.sin(n * 5.7));      /* per-dot dissolve offset */
    }

    img.style.opacity = 0;

    var t0 = null;
    var done = false;

    /* If frames stop coming (hidden/throttled tab), land on the final state. */
    var watchdog = setTimeout(function () {
      if (done) return;
      done = true;
      finish();
    }, TOTAL + 1500);

    function ease(t) { return 1 - Math.pow(1 - t, 3); }
    function smooth(t) { return t * t * (3 - 2 * t); }

    function frame(now) {
      if (done) return;
      if (t0 === null) t0 = now;
      var el = now - t0;

      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, w, h);

      var revealK = Math.max(0, Math.min(1, (el - REVEAL_START) / REVEAL));

      if (revealK > 0) {
        ctx.globalAlpha = smooth(revealK);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
        ctx.globalAlpha = 1;
      }

      for (var n = 0; n < dots.length; n++) {
        var d = dots[n];
        /* each dot dissolves at its own moment across the reveal */
        var dotA = 1 - smooth(Math.max(0, Math.min(1,
          (revealK * 1.35 - d.fade * 0.5) / 0.85)));
        if (dotA <= 0.01) continue;
        var k = ease(Math.max(0, Math.min(1, (el - d.delay) / FLY)));
        /* this dot's own color ramp begins as it comes in to land */
        var colorK = smooth(Math.max(0, Math.min(1,
          (el - d.delay - FLY * 0.72) / COLOR)));
        var x = d.sx + (d.x - d.sx) * k;
        var y = d.sy + (d.y - d.sy) * k;
        var cr = INK.r + (d.cr - INK.r) * colorK;
        var cg = INK.g + (d.cg - INK.g) * colorK;
        var cb = INK.b + (d.cb - INK.b) * colorK;
        ctx.globalAlpha = dotA;
        ctx.fillStyle = 'rgb(' + (cr | 0) + ',' + (cg | 0) + ',' + (cb | 0) + ')';
        ctx.beginPath();
        ctx.arc(x, y, d.r * (0.55 + 0.45 * k), 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (el >= TOTAL) {
        done = true;
        clearTimeout(watchdog);
        finish();
        return;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var played = false;
  function init() {
    if (played) return;
    played = true;
    if (reduceMotion) { finish(); return; }
    var sampled = sampleDots();
    if (!sampled || !sampled.dots.length) { finish(); return; }
    runIntro(sampled);
  }

  if (img.complete && img.naturalWidth) init();
  else {
    img.addEventListener('load', init);
    img.addEventListener('error', finish);
  }
})();
