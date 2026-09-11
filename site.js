// Fill BRAINERD_INVITE_URL with the WhatsApp invite when confirmed.
// Until then the Community CTA asks via Contact. Keep the QR as a scan option.
// Fill CONTACT_ENDPOINT with the form endpoint when it exists.
const BRAINERD_INVITE_URL = "";
const CONTACT_ENDPOINT = "";

const lang = document.documentElement.lang;
const de = lang === "de";
const dialog = document.getElementById("index");
const openBtn = document.querySelector(".index-btn");
const closeBtn = document.getElementById("close-index");
const cta = document.getElementById("brainerd-cta");
const ctaNote = document.getElementById("brainerd-note");
const form = document.getElementById("contact-form");
const formSlot = document.getElementById("contact-slot");
const topicField = document.getElementById("contact-topic");

if (openBtn && dialog && closeBtn) {
  openBtn.addEventListener("click", () => {
    dialog.showModal();
    openBtn.setAttribute("aria-expanded", "true");
  });
  closeBtn.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => openBtn.setAttribute("aria-expanded", "false"));
  dialog.addEventListener("click", (e) => {
    if (e.target.closest("a")) dialog.close();
  });
}

if (cta && BRAINERD_INVITE_URL) {
  cta.href = BRAINERD_INVITE_URL;
  cta.textContent = de ? "Brainerd auf WhatsApp beitreten" : "Join Brainerd on WhatsApp";
  cta.rel = "noopener";
  cta.target = "_blank";
  if (ctaNote) {
    ctaNote.hidden = false;
    ctaNote.textContent = de ? "öffnet WhatsApp" : "opens WhatsApp";
  }
}

function topicFromUrl() {
  const fromSearch = new URLSearchParams(location.search).get("topic");
  if (fromSearch) return fromSearch;
  const q = location.hash.indexOf("?");
  if (q === -1) return "";
  return new URLSearchParams(location.hash.slice(q + 1)).get("topic") || "";
}

function scrollHashTarget() {
  const id = location.hash.replace(/^#/, "").split("?")[0];
  const el = id && document.getElementById(id);
  if (el) el.scrollIntoView();
}

function applyTopic() {
  const topic = topicFromUrl();
  if (topic && topicField) topicField.value = topic;
}

applyTopic();
if (location.hash.includes("?")) scrollHashTarget();
window.addEventListener("hashchange", () => {
  applyTopic();
  scrollHashTarget();
});

if (CONTACT_ENDPOINT && form) {
  form.hidden = false;
  if (formSlot) formSlot.hidden = true;
  const status = document.getElementById("form-status");
  const submit = form.querySelector("[type=submit]");
  let dirty = false;
  form.addEventListener("input", () => { dirty = true; });
  window.addEventListener("beforeunload", (e) => {
    if (dirty) e.preventDefault();
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      topic: form.topic.value.trim(),
      note: form.note.value.trim(),
    };
    submit.disabled = true;
    status.textContent = de ? "Wird gesendet…" : "Sending…";
    try {
      const res = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("failed");
      status.textContent = de ? "Notiz gesendet." : "Note sent.";
      form.reset();
      dirty = false;
    } catch {
      status.textContent = de
        ? "Senden fehlgeschlagen. Bitte erneut versuchen oder später die Adresse nutzen."
        : "Sending failed. Try again, or wait and use the address once it is listed.";
    } finally {
      submit.disabled = false;
    }
  });
  form.note.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) form.requestSubmit();
  });
}

const discussionForm = document.getElementById("discussion-form");
const discussionStatus = document.getElementById("form-status");
const shareBtn = document.getElementById("share-btn");

if (discussionForm && discussionStatus && shareBtn && !form) {
  discussionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    discussionStatus.textContent =
      "Thank you. Sharing is not live yet — your note stays on this device for now.";
    shareBtn.disabled = true;
    window.setTimeout(() => {
      shareBtn.disabled = false;
    }, 1200);
  });
}
