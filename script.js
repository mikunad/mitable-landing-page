/* ============ Mitable landing — interactions & looping animations ============ */

// ---------- Nav background on scroll ----------
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 10);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ---------- Reveal on scroll ----------
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = Number(entry.target.dataset.delay || 0);
        setTimeout(() => entry.target.classList.add("visible"), delay);
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

// ---------- Helper: run a looping animation only while visible ----------
function loopWhileVisible(el, runLoop) {
  let timers = [];
  let running = false;

  const schedule = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  };
  const clearAll = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !running) {
          running = true;
          runLoop(schedule, () => running);
        } else if (!entry.isIntersecting && running) {
          running = false;
          clearAll();
        }
      });
    },
    { threshold: 0.3 }
  );
  observer.observe(el);
}

// ---------- Hero demo loop ----------
// type prompt -> AI answers -> Mitable card slides in -> switch -> success -> reset
(() => {
  const demo = document.getElementById("heroDemo");
  if (!demo) return;

  const typed = document.getElementById("heroTyped");
  const aiRow = document.getElementById("heroAiRow");
  const prompts = [
    "Refactor the auth logic across all our services…",
    "Turn these 40 customer interviews into themes…",
    "Update the pricing table in 12 places…",
  ];
  let promptIndex = 0;

  loopWhileVisible(demo, function run(schedule, isRunning) {
    const text = prompts[promptIndex % prompts.length];
    promptIndex++;

    // reset
    demo.classList.remove("state-card", "state-success");
    aiRow.classList.remove("show");
    typed.textContent = "";

    // 1. type the prompt
    let i = 0;
    const typeNext = () => {
      if (!isRunning()) return;
      typed.textContent = text.slice(0, ++i);
      if (i < text.length) schedule(typeNext, 26);
      else afterTyping();
    };
    schedule(typeNext, 500);

    // 2. AI starts answering, then Mitable steps in
    const afterTyping = () => {
      schedule(() => aiRow.classList.add("show"), 400);
      schedule(() => demo.classList.add("state-card"), 1600);
      schedule(() => {
        demo.classList.remove("state-card");
        demo.classList.add("state-success");
      }, 5400);
      schedule(() => {
        if (isRunning()) run(schedule, isRunning);
      }, 8200);
    };
  });
})();

// ---------- Section 2: timeline loop ----------
(() => {
  const panel = document.getElementById("timelinePanel");
  if (!panel) return;
  const items = panel.querySelectorAll(".timeline-item");

  loopWhileVisible(panel, function run(schedule, isRunning) {
    items.forEach((item) => item.classList.remove("active"));
    items.forEach((item, i) => {
      schedule(() => item.classList.add("active"), 600 + i * 700);
    });
    // hold, then restart
    schedule(() => {
      if (isRunning()) run(schedule, isRunning);
    }, 600 + items.length * 700 + 2600);
  });
})();

// ---------- Section 3: philosophy card loops ----------
// Quiet demo: answer appears -> check appears -> hold -> reset
(() => {
  const demo = document.getElementById("quietDemo");
  if (!demo) return;
  const stages = {
    answer: demo.querySelector('[data-stage="answer"]'),
    check: demo.querySelector('[data-stage="check"]'),
  };

  loopWhileVisible(demo, function run(schedule, isRunning) {
    stages.answer.classList.remove("on");
    stages.check.classList.remove("on");
    schedule(() => stages.answer.classList.add("on"), 700);
    schedule(() => stages.check.classList.add("on"), 1900);
    schedule(() => {
      if (isRunning()) run(schedule, isRunning);
    }, 6400);
  });
})();

// Step-in demo: Mitable card appears -> "Cursor opened" -> hold -> reset
(() => {
  const demo = document.getElementById("stepDemo");
  if (!demo) return;
  const stages = {
    card: demo.querySelector('[data-stage="card"]'),
    open: demo.querySelector('[data-stage="open"]'),
  };

  loopWhileVisible(demo, function run(schedule, isRunning) {
    stages.card.classList.remove("on");
    stages.open.classList.remove("on");
    schedule(() => stages.card.classList.add("on"), 900);
    schedule(() => stages.open.classList.add("on"), 3200);
    schedule(() => {
      if (isRunning()) run(schedule, isRunning);
    }, 7000);
  });
})();

// ---------- CTA form (front-end only) ----------
(() => {
  const form = document.getElementById("ctaForm");
  const note = document.getElementById("ctaNote");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = form.querySelector("input").value.trim();
    if (!email) return;
    form.style.display = "none";
    note.textContent = "You're on the list — we'll be in touch soon. ✓";
    note.style.color = "#4ade80";
  });
})();
