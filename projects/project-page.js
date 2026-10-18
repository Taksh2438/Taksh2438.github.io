async function loadProjectPage() {
  const root = document.querySelector("#project-detail");
  if (!root) return;

  const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);

  const listItems = (items = []) =>
    items.map((item) => `<li>${escapeHTML(item)}</li>`).join("");

  const renderListSection = (title, items, className = "") => {
    if (!Array.isArray(items) || items.length === 0) return "";

    return `
      <section class="detail-section ${className}">
        <h2>${escapeHTML(title)}</h2>
        <ul class="detail-list">${listItems(items)}</ul>
      </section>
    `;
  };

  const renderTextSection = (title, value) => {
    if (!value || !String(value).trim()) return "";

    return `
      <section class="detail-section">
        <h2>${escapeHTML(title)}</h2>
        <p>${escapeHTML(value)}</p>
      </section>
    `;
  };

  const safeExternalLink = (url) => {
    try {
      const parsed = new URL(url);
      return ["https:", "http:"].includes(parsed.protocol)
        ? parsed.href
        : "";
    } catch {
      return "";
    }
  };

  const renderMedia = (media = []) => {
    if (!Array.isArray(media) || media.length === 0) return "";

    const validMedia = media.filter((item) =>
      item && ["image", "video"].includes(item.type) && item.src
    );

    if (validMedia.length === 0) return "";

    return `
      <section class="detail-section">
        <h2>Gallery</h2>
        <div class="project-gallery">
          ${validMedia.map((item) => {
            const src = escapeHTML(item.src);
            const caption = escapeHTML(item.caption || "");

            if (item.type === "video") {
              return `
                <figure class="gallery-item">
                  <video controls preload="metadata">
                    <source src="${src}">
                    Your browser does not support video playback.
                  </video>
                  ${caption ? `<figcaption>${caption}</figcaption>` : ""}
                </figure>
              `;
            }

            return `
              <figure class="gallery-item">
                <img src="${src}" alt="${caption || "Project photo"}"
                     loading="lazy">
                ${caption ? `<figcaption>${caption}</figcaption>` : ""}
              </figure>
            `;
          }).join("")}
        </div>
      </section>
    `;
  };

  try {
    const response = await fetch("./project.json");

    if (!response.ok) {
      throw new Error(`Could not load project.json (${response.status})`);
    }

    const project = await response.json();

    if (!project.name || !project.id) {
      throw new Error("The project data is missing its name or ID.");
    }

    document.title = `${project.name} | Taksh Mehta`;

    const technologies = (project.technologies || [])
      .map((tech) => `<span class="tech-tag">${escapeHTML(tech)}</span>`)
      .join("");

    const links = [
      {
        label: "View Repository",
        url: safeExternalLink(project.links?.repository)
      },
      {
        label: "View Demo",
        url: safeExternalLink(project.links?.demo)
      }
    ].filter((link) => link.url);

    root.innerHTML = `
      <header class="detail-hero">
        <a class="back-link" href="../../projects.html">
          ← Back to Projects
        </a>

        <p class="eyebrow">${escapeHTML(project.category || "PROJECT")}</p>
        <h1>${escapeHTML(project.name)}</h1>
        <p class="detail-lead">
          ${escapeHTML(project.shortDescription || "")}
        </p>
        <span class="project-status">
          ${escapeHTML(project.status || "In Progress")}
        </span>

        ${technologies
          ? `<div class="tech-tags">${technologies}</div>`
          : ""}
      </header>

      <div class="detail-layout">
        <div class="detail-main">
          ${renderTextSection("Project Overview", project.overview)}
          ${renderListSection("Objectives", project.objectives)}
          ${renderListSection("Key Features", project.features)}
          ${renderListSection("My Role", project.role)}
          ${renderListSection("Challenges & Solutions", project.challenges)}
          ${renderListSection("What I Learned", project.learnings)}
          ${renderTextSection("Results", project.results)}
          ${renderMedia(project.media)}
        </div>

        <aside class="detail-sidebar">
          <h2>Project Details</h2>
          <p><strong>Category</strong><br>
            ${escapeHTML(project.category || "Not specified")}</p>
          <p><strong>Status</strong><br>
            ${escapeHTML(project.status || "Not specified")}</p>
          ${technologies
            ? `<div><strong>Technologies</strong>
                <div class="tech-tags">${technologies}</div>
              </div>`
            : ""}
          ${links.length
            ? `<div class="detail-links">
                ${links.map((link) => `
                  <a class="button button-secondary"
                     href="${escapeHTML(link.url)}"
                     target="_blank" rel="noopener noreferrer">
                    ${escapeHTML(link.label)} ↗
                  </a>
                `).join("")}
              </div>`
            : ""}
        </aside>
      </div>
    `;
  } catch (error) {
    console.error("Project page error:", error);
    root.innerHTML = `
      <section class="detail-error">
        <h1>Project details unavailable</h1>
        <p>Check that this folder contains a valid project.json file.</p>
        <a href="../../projects.html">Return to Projects</a>
      </section>
    `;
  }
}

document.addEventListener("DOMContentLoaded", loadProjectPage);