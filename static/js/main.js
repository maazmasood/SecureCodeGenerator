/* ═══════════════════════════════════════════════════════════════════════════
   SecureQR — Main JavaScript
   ═══════════════════════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initParticles();
  initScrollReveal();
  initPasswordToggles();
  initGeneratorForm();
  initVerifyForm();
  initCopyButtons();
});

/* ─────────────────────────────────────────────────────────────────────────
   Navbar: scroll class + mobile toggle
   ───────────────────────────────────────────────────────────────────────── */
function initNavbar() {
  const navbar = document.getElementById("navbar");
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");

  if (!navbar) return;

  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 40);
  });

  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("open"));
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => links.classList.remove("open"))
    );
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   Hero particles
   ───────────────────────────────────────────────────────────────────────── */
function initParticles() {
  const container = document.getElementById("heroParticles");
  if (!container) return;

  for (let i = 0; i < 30; i++) {
    const p = document.createElement("span");
    p.classList.add("particle");
    const size = Math.random() * 4 + 2;
    p.style.width = size + "px";
    p.style.height = size + "px";
    p.style.left = Math.random() * 100 + "%";
    p.style.bottom = "-10px";
    p.style.animationDuration = Math.random() * 8 + 6 + "s";
    p.style.animationDelay = Math.random() * 6 + "s";
    container.appendChild(p);
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   Scroll‑reveal (fade‑in)
   ───────────────────────────────────────────────────────────────────────── */
function initScrollReveal() {
  const els = document.querySelectorAll(
    ".feature-card, .section-header, .glass-card, .history-card"
  );
  if (!els.length) return;

  els.forEach((el) => el.classList.add("fade-in"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          observer.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  els.forEach((el) => observer.observe(el));
}

/* ─────────────────────────────────────────────────────────────────────────
   Password visibility toggles
   ───────────────────────────────────────────────────────────────────────── */
function initPasswordToggles() {
  document.querySelectorAll(".input-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.parentElement.querySelector("input");
      if (!input) return;
      input.type = input.type === "password" ? "text" : "password";
    });
  });
}

/* ─────────────────────────────────────────────────────────────────────────
   Generator form (AJAX)
   ───────────────────────────────────────────────────────────────────────── */
function initGeneratorForm() {
  const form = document.getElementById("qrForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("generateBtn");
    const btnText = btn.querySelector(".btn-text");
    const btnLoader = btn.querySelector(".btn-loader");

    // Validate
    const key = form.key.value.trim();
    const prefix = form.prefix.value.trim();
    const baseUrl = form.base_url.value.trim();
    const start = parseInt(form.start.value, 10);
    const end = parseInt(form.end.value, 10);

    if (!key || !prefix) return showToast("Please fill all required fields.", "error");
    if (isNaN(start) || isNaN(end) || start > end) return showToast("Invalid code range.", "error");

    // Loading state
    btnText.hidden = true;
    btnLoader.hidden = false;
    btn.disabled = true;

    try {
      const res = await fetch("/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, prefix, base_url: baseUrl, start, end }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");

      renderPreviews(data.results);
      showToast(`${data.results.length} QR code(s) generated!`, "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      btnText.hidden = false;
      btnLoader.hidden = true;
      btn.disabled = false;
    }
  });
}

function renderPreviews(results) {
  const area = document.getElementById("previewArea");
  const badge = document.getElementById("previewCount");
  if (!area) return;

  area.innerHTML = "";
  badge.textContent = results.length + " code" + (results.length !== 1 ? "s" : "");

  results.forEach((r, i) => {
    const item = document.createElement("div");
    item.className = "qr-item";
    item.style.animationDelay = i * 0.06 + "s";
    item.innerHTML = `
      <img src="data:image/png;base64,${r.image}" alt="QR ${r.code}" />
      <div class="qr-item-info">
        <div class="qr-item-code">${r.code}</div>
        <div class="qr-item-url">${r.url}</div>
      </div>
      <div class="qr-item-actions">
        <a href="/download/${r.filename}" class="btn-icon" title="Download" download>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </a>
        <button type="button" class="btn-icon copy-url-btn" data-url="${r.url}" title="Copy URL">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
      </div>`;
    area.appendChild(item);
  });

  // Re-bind copy buttons for the new items
  initCopyButtons();
}

/* ─────────────────────────────────────────────────────────────────────────
   Verify form (AJAX)
   ───────────────────────────────────────────────────────────────────────── */
function initVerifyForm() {
  const form = document.getElementById("verifyForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("verifyBtn");
    const btnText = btn.querySelector(".btn-text");
    const btnLoader = btn.querySelector(".btn-loader");
    const resultCard = document.getElementById("resultCard");
    const errorCard = document.getElementById("errorCard");

    const hash = form.hash.value.trim();
    const key = form.key.value.trim();

    if (!hash || !key) return showToast("Please fill in both fields.", "error");

    btnText.hidden = true;
    btnLoader.hidden = false;
    btn.disabled = true;
    resultCard.hidden = true;
    errorCard.hidden = true;

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hash, key }),
      });

      const data = await res.json();

      if (!res.ok) {
        errorCard.hidden = false;
        document.getElementById("errorMessage").textContent =
          data.error || "Verification failed.";
        return;
      }

      resultCard.hidden = false;
      document.getElementById("resultStatus").textContent = "✓ Verified Successfully";
      document.getElementById("resultValue").textContent = data.plaintext;
      showToast("Decryption successful!", "success");
    } catch (err) {
      errorCard.hidden = false;
      document.getElementById("errorMessage").textContent = err.message;
    } finally {
      btnText.hidden = false;
      btnLoader.hidden = true;
      btn.disabled = false;
    }
  });
}

/* ─────────────────────────────────────────────────────────────────────────
   Copy to clipboard
   ───────────────────────────────────────────────────────────────────────── */
function initCopyButtons() {
  document.querySelectorAll(".copy-url-btn").forEach((btn) => {
    // Remove existing listeners by cloning
    const clone = btn.cloneNode(true);
    btn.parentNode.replaceChild(clone, btn);

    clone.addEventListener("click", () => {
      const url = clone.dataset.url;
      if (!url) return;
      navigator.clipboard.writeText(url).then(() => {
        showToast("URL copied to clipboard!", "success");
      });
    });
  });

  const copyResult = document.getElementById("copyResult");
  if (copyResult) {
    copyResult.addEventListener("click", () => {
      const val = document.getElementById("resultValue")?.textContent;
      if (!val) return;
      navigator.clipboard.writeText(val).then(() => {
        showToast("Copied!", "success");
      });
    });
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   Toast notifications
   ───────────────────────────────────────────────────────────────────────── */
function showToast(message, type = "info") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
