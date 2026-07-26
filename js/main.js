(function () {
  var fine = matchMedia("(pointer:fine)").matches;
  var rm = matchMedia("(prefers-reduced-motion:reduce)").matches;

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

  /* Typewriter: innerer Monolog */
  var lines = [
    "Warum grüble ich eigentlich ständig?",
    "Ist das noch Stress — oder schon mehr?",
    "Mit wem soll ich darüber reden?",
    "Bin ich der Einzige, dem es so geht?",
    "Geht es hier um meine Psyche — oder um mehr?",
  ];
  var t = document.getElementById("type");
  if (t) {
    if (rm) {
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
              return setTimeout(tick, 1900);
            }
          } else {
            ci--;
            if (ci === 0) {
              del = false;
              li = (li + 1) % lines.length;
            }
          }
          setTimeout(tick, del ? 26 : 52);
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

  /* Selbst-Check */
  var Q = [
    {
      q: "Wie oft fühlst du dich innerlich überfordert oder rastlos?",
      o: [
        ["Fast täglich", "k"],
        ["Immer wieder in Phasen", "s"],
        ["Selten — ich will vorbeugen", "w"],
      ],
    },
    {
      q: "Wie gut kannst du einordnen, was in solchen Momenten in dir passiert?",
      o: [
        ["Gar nicht — es ist diffus", "k"],
        ["Teilweise, aber es hilft mir nicht", "s"],
        ["Ganz gut, ich will tiefer verstehen", "w"],
      ],
    },
    {
      q: "Hast du jemanden, mit dem du offen und ohne Bewertung reden kannst?",
      o: [
        ["Ehrlich gesagt: nein", "k"],
        ["Schon — aber niemand Objektiven", "s"],
        ["Ja, aber mir fehlt Struktur", "w"],
      ],
    },
    {
      q: "Hast du den Eindruck, dass es bei dir um mehr als „nur“ Gedanken geht?",
      o: [
        ["Ja, da ist auch eine geistliche Ebene", "g"],
        ["Vielleicht — ich bin offen", "g"],
        ["Nein, mir geht es um die mentale Seite", "m"],
      ],
    },
  ];
  var R = {
    k: {
      t: "FOKUS: KLARHEIT",
      h: "Erst verstehen, dann verändern.",
      p: "Deine Antworten deuten darauf hin, dass gerade vieles gleichzeitig auf dich einwirkt und schwer zu greifen ist. Genau dafür ist der Einstieg gedacht: Wir sortieren gemeinsam, was da eigentlich los ist — in deinem Tempo, ohne Etiketten. Der erste Schritt ist ein Gespräch.",
    },
    s: {
      t: "FOKUS: STABILITÄT",
      h: "Du kennst deine Baustellen — jetzt fehlt der Plan.",
      p: "Du nimmst dich selbst schon gut wahr, aber allein drehst du dich im Kreis. Mit Struktur, einem objektiven Gegenüber und konkreten Werkzeugen für Gedanken und Gefühle kommst du raus aus dem Grübeln und rein ins Arbeiten.",
    },
    w: {
      t: "FOKUS: WACHSTUM",
      h: "Dir geht es nicht schlecht — du willst mehr.",
      p: "Stark: Du wartest nicht, bis etwas kippt. Mentales Wachstum lässt sich trainieren wie ein Muskel — mit Plan, Material und jemandem, der dich fordert und begleitet. Lass uns schauen, wo dein nächstes Level liegt.",
    },
  };
  var body = document.getElementById("check-body");
  var count = document.getElementById("q-count");
  var i = 0;
  var score = { k: 0, s: 0, w: 0 };
  var geist = false;

  function q() {
    if (!body || !count) return;
    count.textContent = "FRAGE " + (i + 1) + " / " + Q.length;
    var d = document.createElement("div");
    d.className = "fade";
    d.innerHTML =
      '<div class="q-bar"><i style="width:' +
      (i / Q.length) * 100 +
      '%"></i></div><p class="q-title">' +
      Q[i].q +
      '</p><div class="q-opts"></div>';
    var o = d.querySelector(".q-opts");
    Q[i].o.forEach(function (pair) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "q-opt";
      b.textContent = pair[0];
      b.onclick = function () {
        var c = pair[1];
        if (c === "g") geist = true;
        else if (c !== "m") score[c]++;
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
    var best = "k";
    var m = -1;
    for (var key in score) {
      if (score[key] > m) {
        m = score[key];
        best = key;
      }
    }
    var r = R[best];
    var add = geist
      ? " Und weil du die geistliche Ebene angesprochen hast: Auch dafür ist hier ausdrücklich Raum — Seelsorge und Gebet gehören bei mir dazu, wenn du das möchtest."
      : "";
    body.innerHTML =
      '<div class="check-result fade"><span class="tag">' +
      r.t +
      "</span><h3>" +
      r.h +
      "</h3><p>" +
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
