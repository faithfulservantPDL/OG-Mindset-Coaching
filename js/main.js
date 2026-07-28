(function () {
  var fine = matchMedia("(pointer:fine)").matches;
  var rm = matchMedia("(prefers-reduced-motion:reduce)").matches;

  /* Video-Hero: Crossfade-Playlist aus mehreren Clips */
  (function initHeroVideo() {
    /* === Clips hier austauschen (eigene Dateien / URLs) === */
    var clips = [
      "assets/videos/clip-01-window.mp4", /* älterer Mann am Fenster */
      "assets/videos/clip-01-steam.mp4", /* Innehalten: dampfende Tasse */
      "assets/videos/clip-02-water.mp4", /* Natur-Metapher: ruhiges Wasser */
      "assets/videos/clip-03-room.mp4", /* geschützter Raum: sonniger Innenraum */
      "assets/videos/clip-04-candle.mp4", /* Detail/Ruhe: Kerzenlicht */
    ];
    var CLIP_MS = 5000; /* Anzeigedauer pro Clip in ms (vor Crossfade) */
    var FADE_MS = 1200; /* muss zur CSS-Transition (.hero-video__media) passen */

    var section = document.querySelector(".hero-video");
    var a = document.getElementById("heroVideoA");
    var b = document.getElementById("heroVideoB");
    var toggle = document.getElementById("heroVideoToggle");
    if (!section || !a || !b || !clips.length) return;

    var players = [a, b];
    var active = 0;
    var index = 0;
    var timer = null;
    var fading = false;
    var paused = false;
    var started = false;

    function setUiPlaying(playing) {
      if (!toggle) return;
      toggle.hidden = false;
      toggle.setAttribute("aria-pressed", playing ? "false" : "true");
      toggle.setAttribute("aria-label", playing ? "Video pausieren" : "Video abspielen");
    }

    function clearTimer() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }

    function scheduleNext() {
      clearTimer();
      if (paused || rm) return;
      var following = (index + 1) % clips.length;
      ensureLoaded(players[1 - active], clips[following]);
      timer = setTimeout(function () {
        crossfadeTo(following);
      }, CLIP_MS);
    }

    function loadInto(video, src) {
      return new Promise(function (resolve) {
        var settled = false;
        var done = function () {
          if (settled) return;
          settled = true;
          video.removeEventListener("loadeddata", done);
          video.removeEventListener("canplay", done);
          video.removeEventListener("error", done);
          video.setAttribute("data-src", src);
          resolve();
        };
        video.addEventListener("loadeddata", done);
        video.addEventListener("canplay", done);
        video.addEventListener("error", done);
        video.src = src;
        video.load();
        if (video.readyState >= 3) done();
      });
    }

    function ensureLoaded(video, src) {
      if (video.getAttribute("data-src") === src && video.readyState >= 2) {
        return Promise.resolve();
      }
      return loadInto(video, src);
    }

    function playSafe(video) {
      video.muted = true;
      var p = video.play();
      if (p && typeof p.then === "function") {
        return p.catch(function () {});
      }
      return Promise.resolve();
    }

    function waitForFrame(video) {
      return new Promise(function (resolve) {
        var settled = false;
        var finish = function () {
          if (settled) return;
          settled = true;
          resolve();
        };
        if (typeof video.requestVideoFrameCallback === "function") {
          video.requestVideoFrameCallback(function () {
            finish();
          });
        } else {
          requestAnimationFrame(function () {
            requestAnimationFrame(finish);
          });
        }
        setTimeout(finish, 400);
      });
    }

    function crossfadeTo(nextIndex) {
      if (fading || paused || rm) return;
      fading = true;
      clearTimer();
      var nextPlayer = 1 - active;
      var incoming = players[nextPlayer];
      var outgoing = players[active];

      /* Ausgehend bleibt voll sichtbar (is-active), bis Incoming darüber eingeblendet ist */
      incoming.classList.remove("is-active", "is-top");

      ensureLoaded(incoming, clips[nextIndex])
        .then(function () {
          if (paused) {
            fading = false;
            return null;
          }
          try {
            incoming.currentTime = 0;
          } catch (e) {}
          return playSafe(incoming).then(function () {
            return waitForFrame(incoming);
          });
        })
        .then(function (ready) {
          if (ready === null || paused) {
            fading = false;
            return;
          }
          incoming.classList.add("is-top");
          void incoming.offsetWidth;
          incoming.classList.add("is-active");
          setTimeout(function () {
            outgoing.classList.remove("is-active", "is-top");
            outgoing.pause();
            incoming.classList.remove("is-top");
            active = nextPlayer;
            index = nextIndex;
            fading = false;
            scheduleNext();
          }, FADE_MS);
        });
    }

    function onEnded() {
      /* Sicherheit: Wechsel vor dunklem Endframe / natürlichem Ende */
      if (paused || fading || rm) return;
      crossfadeTo((index + 1) % clips.length);
    }

    a.addEventListener("ended", onEnded);
    b.addEventListener("ended", onEnded);

    if (rm) {
      section.classList.add("is-reduced");
      a.removeAttribute("autoplay");
      a.pause();
      b.pause();
      if (toggle) toggle.hidden = true;
      return;
    }

    ensureLoaded(a, clips[0]).then(function () {
      a.setAttribute("autoplay", "");
      a.classList.add("is-active");
      playSafe(a).then(function () {
        return waitForFrame(a);
      }).then(function () {
        started = true;
        setUiPlaying(true);
        scheduleNext();
      });
    });

    if (toggle) {
      toggle.addEventListener("click", function () {
        if (!started) return;
        if (paused) {
          paused = false;
          playSafe(players[active]).then(function () {
            setUiPlaying(true);
            scheduleNext();
          });
        } else {
          paused = true;
          clearTimer();
          players[0].pause();
          players[1].pause();
          setUiPlaying(false);
        }
      });
    }
  })();

  /* Reveal */
  var els = document.querySelectorAll(".rev");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );
    els.forEach(function (el) {
      io.observe(el);
    });
  } else {
    els.forEach(function (el) {
      el.classList.add("in");
    });
  }

  /* Scroll-Progress + Sticky CTA */
  var prog = document.getElementById("prog");
  var sticky = document.getElementById("sticky-cta");
  var kontakt = document.getElementById("kontakt");
  addEventListener(
    "scroll",
    function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      var y = scrollY;
      if (prog) prog.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
      var nearContact = kontakt && kontakt.getBoundingClientRect().top < innerHeight;
      if (sticky) sticky.classList.toggle("on", y > innerHeight * 1.4 && !nearContact);
    },
    { passive: true }
  );

  /* Cursor-Glow */
  if (fine && !rm) {
    var g = document.getElementById("glow");
    if (g) {
      addEventListener(
        "mousemove",
        function (e) {
          g.style.left = e.clientX + "px";
          g.style.top = e.clientY + "px";
        },
        { passive: true }
      );
    }
  }

  /* Magnetische Buttons */
  if (fine && !rm) {
    document.querySelectorAll(".mag").forEach(function (b) {
      b.addEventListener("mousemove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform =
          "translate(" +
          (e.clientX - r.left - r.width / 2) * 0.18 +
          "px," +
          (e.clientY - r.top - r.height / 2) * 0.28 +
          "px)";
      });
      b.addEventListener("mouseleave", function () {
        b.style.transform = "";
      });
    });
  }

  /* Tilt-Karten */
  if (fine && !rm) {
    document.querySelectorAll(".tilt").forEach(function (c) {
      c.addEventListener("mousemove", function (e) {
        var r = c.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        c.style.transform =
          "perspective(700px) rotateX(" +
          -y * 6 +
          "deg) rotateY(" +
          x * 8 +
          "deg) translateY(-4px)";
      });
      c.addEventListener("mouseleave", function () {
        c.style.transform = "";
      });
    });
  }

  /* Typewriter: eine Frage nach der anderen (tippen → Pause → löschen → nächste) */
  /* Fragen-Array zum Austauschen: steht in der nächsten Zeile (var lines) */
  var lines = [
    "Warum denke ich, wie ich denke?",
    "Wie kann ich mein Mindset verändern?",
    "Warum bin ich immer gestresst?",
    "Kann ich meine Gefühle beeinflussen?",
    "Mit wem soll ich darüber reden?",
  ];
  var TYPE_MS = 50; /* Tippen: ca. 45–55 ms pro Zeichen */
  var DELETE_MS = 28; /* Löschen etwas schneller */
  var HOLD_MS = 1800; /* Pause bei fertiger Frage */
  var t = document.getElementById("type");
  if (t) {
    if (rm) {
      /* prefers-reduced-motion: erste Frage statisch, ohne Animation */
      t.textContent = lines[0];
    } else {
      (function () {
        var li = 0;
        var ci = 0;
        var del = false;
        function tick() {
          var s = lines[li];
          t.textContent = s.slice(0, ci);
          if (!del) {
            ci++;
            if (ci > s.length) {
              del = true;
              return setTimeout(tick, HOLD_MS);
            }
            setTimeout(tick, TYPE_MS);
          } else {
            ci--;
            if (ci === 0) {
              del = false;
              li = (li + 1) % lines.length;
            }
            setTimeout(tick, DELETE_MS);
          }
        }
        tick();
      })();
    }
  }

  /* Zähler */
  var nio = new IntersectionObserver(
    function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        nio.unobserve(e.target);
        var el = e.target;
        var end = +el.dataset.count;
        var t0 = null;
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min(1, (ts - t0) / 900);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        }
        if (rm) el.textContent = end;
        else requestAnimationFrame(step);
      });
    },
    { threshold: 0.6 }
  );
  document.querySelectorAll("[data-count]").forEach(function (el) {
    nio.observe(el);
  });

  /* Sphären-Schalter */
  var pill = document.getElementById("pill");
  var tp = document.getElementById("tb-p");
  var tg = document.getElementById("tb-g");
  var sp = document.getElementById("sp-p");
  var sg = document.getElementById("sp-g");
  function sw(gg) {
    if (pill) pill.style.transform = gg ? "translateX(100%)" : "";
    if (tp) {
      tp.classList.toggle("on", !gg);
      tp.setAttribute("aria-selected", !gg);
    }
    if (tg) {
      tg.classList.toggle("on", gg);
      tg.setAttribute("aria-selected", gg);
    }
    if (sp) sp.classList.toggle("on", !gg);
    if (sg) sg.classList.toggle("on", gg);
  }
  if (tp) tp.onclick = function () {
    sw(false);
  };
  if (tg) tg.onclick = function () {
    sw(true);
  };

  /* Selbst-Check: Ja / Manchmal / Nein mit Punktelogik */
  var Q = [
    "Fühlst du dich oft innerlich überfordert oder rastlos?",
    "Ist es schwer für dich einzuordnen, was in solchen Momenten in dir passiert?",
    "Fehlt dir jemand, mit dem du offen und ohne Bewertung reden kannst?",
    "Bleibst du in Gedankenkreisen hängen, aus denen du allein kaum herauskommst?",
    "Spürst du Stress auch körperlich — etwa als Anspannung, Unruhe oder schlechten Schlaf?",
    "Fällt es dir schwer, Gedanken und Gefühle bewusst zu beeinflussen?",
    "Vermeidest du Themen, die dich innerlich belasten?",
    "Hast du das Gefühl, dass „irgendwann“ für deine Psyche nie kommt?",
    "Wünschst du dir mehr Struktur und ein klares Gegenüber für das, was in dir passiert?",
    "Spürst du, dass es bei dir um mehr geht als „nur“ Gedanken — auch um eine geistliche Ebene?",
  ];
  /* Gewichtung: Ja = 1, Manchmal = 0,5, Nein = 0 — Summe 0–10 */
  var OPTS = [
    ["Ja", 1],
    ["Manchmal", 0.5],
    ["Nein", 0],
  ];
  var R = {
    k: {
      t: "FOKUS: KLARHEIT",
      h: "Erst verstehen, dann verändern.",
      p: "Deine Antworten deuten darauf hin, dass gerade vieles gleichzeitig auf dich einwirkt und schwer zu greifen ist. Genau dafür ist der Einstieg gedacht: Wir sortieren gemeinsam, was da eigentlich los ist — in deinem Tempo, ohne Etiketten. Der erste Schritt ist ein Gespräch.",
      range: "8–10",
    },
    s: {
      t: "FOKUS: STABILITÄT",
      h: "Du kennst deine Baustellen — jetzt fehlt der Plan.",
      p: "Du nimmst dich selbst schon gut wahr, aber allein drehst du dich im Kreis. Mit Struktur, einem objektiven Gegenüber und konkreten Werkzeugen für Gedanken und Gefühle kommst du raus aus dem Grübeln und rein ins Arbeiten.",
      range: "4–7",
    },
    w: {
      t: "FOKUS: WACHSTUM",
      h: "Dir geht es nicht schlecht — du willst mehr.",
      p: "Stark: Du wartest nicht, bis etwas kippt. Mentales Wachstum lässt sich trainieren wie ein Muskel — mit Plan, Material und jemandem, der dich fordert und begleitet. Lass uns schauen, wo dein nächstes Level liegt.",
      range: "0–3",
    },
  };
  var body = document.getElementById("check-body");
  var count = document.getElementById("q-count");
  var i = 0;
  var points = 0;
  var geist = false;

  function formatPts(n) {
    return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");
  }

  function stageFor(pts) {
    if (pts >= 8) return "k"; /* Stufe 8–10 */
    if (pts > 3) return "s"; /* Stufe 4–7 (inkl. 3,5) */
    return "w"; /* Stufe 0–3 */
  }

  function q() {
    if (!body || !count) return;
    count.textContent = "FRAGE " + (i + 1) + " / " + Q.length;
    var d = document.createElement("div");
    d.className = "fade";
    d.innerHTML =
      '<div class="q-bar"><i style="width:' +
      (i / Q.length) * 100 +
      '%"></i></div><p class="q-title"></p><div class="q-opts"></div>';
    d.querySelector(".q-title").textContent = Q[i];
    var o = d.querySelector(".q-opts");
    OPTS.forEach(function (pair) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "q-opt";
      b.textContent = pair[0];
      b.onclick = function () {
        points += pair[1];
        /* Letzte Frage: Ja/Manchmal = geistliche Ebene angesprochen */
        if (i === Q.length - 1 && pair[1] > 0) geist = true;
        i++;
        if (i < Q.length) q();
        else res();
      };
      o.appendChild(b);
    });
    body.innerHTML = "";
    body.appendChild(d);
    requestAnimationFrame(function () {
      var bar = d.querySelector(".q-bar i");
      if (bar) bar.style.width = (i / Q.length) * 100 + "%";
    });
  }

  function res() {
    if (!body || !count) return;
    count.textContent = "DEIN ERGEBNIS";
    var best = stageFor(points);
    var r = R[best];
    var add = geist
      ? " Und weil du die geistliche Ebene angesprochen hast: Auch dafür ist hier ausdrücklich Raum — Seelsorge und Gebet gehören bei mir dazu, wenn du das möchtest."
      : "";
    var scoreLine =
      "Deine Antworten ergeben <b>" +
      formatPts(points) +
      " Punkte</b> (Stufe " +
      r.range +
      "). ";
    body.innerHTML =
      '<div class="check-result fade"><span class="tag">' +
      r.t +
      "</span><h3>" +
      r.h +
      "</h3><p>" +
      scoreLine +
      r.p +
      add +
      "</p>" +
      '<a class="btn btn--fill mag" href="#kontakt" style="margin-top:10px">Erstgespräch zu diesem Thema sichern</a>' +
      '<p class="check-note">Der Check ist eine Orientierung, keine Diagnose. Wenn es dir akut schlecht geht, findest du unten auf der Seite sofortige Anlaufstellen.</p></div>';
  }
  q();

  /* Menü + Formular + Jahr */
  var btn = document.getElementById("menuBtn");
  var nav = document.getElementById("nav");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var o = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", o);
      btn.textContent = o ? "Schließen" : "Menü";
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        btn.textContent = "Menü";
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  var form = document.getElementById("anfrage");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = function (id) {
        return document.getElementById(id).value.trim();
      };
      var b = [
        "Name: " + v("f-name"),
        "E-Mail: " + v("f-mail"),
        "Format: " + v("f-format"),
        "Ebene: " + v("f-ebene"),
        "",
        "Anliegen:",
        v("f-text"),
      ].join("\n");
      location.href =
        "mailto:ephraimcoaching@gmail.com?subject=" +
        encodeURIComponent("Coaching-Anfrage von " + v("f-name")) +
        "&body=" +
        encodeURIComponent(b);
    });
  }

  var yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();
})();

/*
  === Hero-Video-Zusammenschnitt anpassen ===
  - clips-Array:          js/main.js, Zeile ~8 (Pfade zu MP4-Dateien hinzufügen/ersetzen/entfernen)
  - Clip-Anzahl:          einfach Einträge im Array ändern — Loop läuft automatisch über clips.length
  - Anzeigedauer/Clip:    CLIP_MS in js/main.js, Zeile ~15 (Standard: 5000 ms; kürzer setzen, falls ein Clip am Ende dunkel wird)
  - Crossfade-Dauer:      FADE_MS (~16) und CSS transition opacity 1.2s in css/styles.css (.hero-video__media)
  - Poster-Fallback:      index.html, Attribut poster an #heroVideoA
  - Qualität:             Clips möglichst ≥1920×1080 (bzw. 1080×1920 Hochformat), H.264/MP4, ca. 3–4 MB/Datei
  - Typewriter-Fragen:    Array `lines` in js/main.js (direkt unter dem Kommentar „Fragen-Array zum Austauschen“)
*/
