document.addEventListener("DOMContentLoaded", loadProfilePage);

async function loadProfilePage() {
  const root = document.querySelector("#about-content");
  if (!root) return;

  const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);

  const safeExternalLink = (value = "") => {
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  };

  const renderCards = (items, className = "about-card") => {
    if (!Array.isArray(items) || items.length === 0) return "";

    return items.map((item) => `
      <article class="${className}">
        <h3>${escapeHTML(item.title || item.degree || item.category || "")}</h3>
        ${item.institution
          ? `<p class="card-subtitle">${escapeHTML(item.institution)}</p>`
          : ""}
        ${item.level
          ? `<p class="card-subtitle">${escapeHTML(item.level)}</p>`
          : ""}
        ${item.description
          ? `<p>${escapeHTML(item.description)}</p>`
          : ""}
        ${Array.isArray(item.items)
          ? `<div class="tech-tags">${item.items.map((skill) =>
              `<span class="tech-tag">${escapeHTML(skill)}</span>`
            ).join("")}</div>`
          : ""}
      </article>
    `).join("");
  };

  const renderSection = (title, content, id = "") => {
    if (!content) return "";

    return `
      <section class="about-section" ${id ? `id="${escapeHTML(id)}"` : ""}>
        <h2>${escapeHTML(title)}</h2>
        ${content}
      </section>
    `;
  };

  try {
    const response = await fetch("data/profile.json");

    if (!response.ok) {
      throw new Error(`Could not load profile data (${response.status})`);
    }

    const profile = await response.json();

    const aboutText = Array.isArray(profile.about)
      ? profile.about.map((paragraph) =>
          `<p>${escapeHTML(paragraph)}</p>`
        ).join("")
      : "";

    const education = renderCards(profile.education, "about-card");
    const skills = renderCards(profile.skills, "skill-card");
    const achievements = renderCards(profile.achievements, "about-card");
    const workshops = renderCards(profile.workshops, "learning-card");
    const qualities = renderCards(profile.qualities, "about-card");

    const interests = Array.isArray(profile.interests)
      ? `<div class="tech-tags">${profile.interests.map((interest) =>
          `<span class="tech-tag">${escapeHTML(interest)}</span>`
        ).join("")}</div>`
      : "";

    const socialLinks = Object.entries(profile.social || {})
      .map(([platform, value]) => {
        const url = safeExternalLink(value);
        if (!url) return "";

        return `<a class="button button-secondary"
                   href="${escapeHTML(url)}"
                   target="_blank"
                   rel="noopener noreferrer">
                  ${escapeHTML(platform.charAt(0).toUpperCase() + platform.slice(1))} ↗
                </a>`;
      })
      .join("");

    document.title = `About | ${escapeHTML(profile.name || "Portfolio")}`;

    root.innerHTML = `
      <section class="about-intro">
        <p class="eyebrow">GET TO KNOW ME</p>
        <h1>${escapeHTML(profile.name || "About Me")}</h1>
        <p class="about-headline">${escapeHTML(profile.headline || "")}</p>
        <p class="about-location">${escapeHTML(profile.location || "")}</p>
      </section>

      ${renderSection("A Little About Me", aboutText, "about-me")}

      ${renderSection(
        "Education",
        `<div class="skills-grid">${education}</div>`,
        "education"
      )}

      ${renderSection(
        "Technical Skills",
        `<div class="skills-grid">${skills}</div>`,
        "skills"
      )}

      ${renderSection(
        "Key Achievements",
        `<div class="skills-grid">${achievements}</div>`,
        "achievements"
      )}

      ${renderSection(
        "Workshops & Learning",
        `<div class="skills-grid">${workshops}</div>`,
        "workshops"
      )}

      ${renderSection(
        "How I Work",
        `<div class="skills-grid">${qualities}</div>`,
        "qualities"
      )}

      ${renderSection("Areas of Interest", interests, "interests")}

      ${renderSection(
        "Find Me Online",
        `<div class="hero-actions">${socialLinks}</div>`,
        "social"
      )}
    `;
  } catch (error) {
    console.error("Profile page error:", error);
    root.innerHTML = `
      <section class="detail-error">
        <h1>Profile unavailable</h1>
        <p>Check that data/profile.json contains valid JSON.</p>
      </section>
    `;
  }
}