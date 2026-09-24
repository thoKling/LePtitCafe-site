// Mobile navigation toggle
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("site-nav");
if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    nav.classList.toggle("is-open", !open);
  });
}

// Static site: forms open the visitor's mail client with a pre-filled message.
document.querySelectorAll("form[data-mailto]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const lines = [];
    for (const [key, value] of new FormData(form)) {
      if (String(value).trim()) lines.push(`${key} : ${value}`);
    }
    const subject = encodeURIComponent(form.dataset.subject);
    const body = encodeURIComponent(`Bonjour,\n\n${lines.join("\n")}\n\nMerci !`);
    window.location.href = `mailto:${form.dataset.mailto}?subject=${subject}&body=${body}`;
  });
});
