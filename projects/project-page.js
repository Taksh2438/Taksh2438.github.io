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

  const safeMediaSource = (value = "") => {
    const source = String(value).trim();

    try {
      const url = new URL(source);

      if (["https:", "http:"].includes(url.protocol)) {
        return url.href;
      }

      return "";
    } catch {
      const isLocalPath =
        /^[a-zA-Z0-9_./-]+$/.test(source) &&
        !source.split("/").includes("..") &&
        !source.startsWith("/");

      return isLocalPath ? source : "";
    }
  };

  const renderGalleryGroups = (groups = []) => {
    if (!Array.isArray(groups) || groups.length === 0) return "";

    return groups.map((group) => {
      if (!group || !Array.isArray(group.media)) return "";

      const validMedia = group.media
        .filter((item) =>
          item &&
          ["image", "video"].includes(item.type) &&
          typeof item.src === "string"
        )
        .map((item) => ({
          ...item,
          src: safeMediaSource(item.src)
        }))
        .filter((item) => item.src);

      if (validMedia.length === 0) return "";

      return `
        <section class="detail-section gallery-group">
          <h2>${escapeHTML(group.title || "Gallery")}</h2>

          <div class="project-gallery-carousel">
            <button type="button"
                    class="gallery-arrow gallery-prev"
                    aria-label="Previous media"
                    data-gallery-prev>
              &#8592;
            </button>

            <div class="gallery-viewport"
                tabindex="0"
                aria-label="${escapeHTML(group.title || "Project gallery")}">
              <div class="gallery-track">
                ${validMedia.map((item, index) => {
                  const src = escapeHTML(item.src);
                  const caption = escapeHTML(item.caption || "");
                  const label = item.type === "video" ? "VIDEO" : "PHOTO";

                  const content = item.type === "video"
                    ? `<video controls preload="metadata" playsinline>
                        <source src="${src}">
                        Your browser does not support video playback.
                      </video>`
                    : `<img src="${src}"
                            alt="${caption || "Project photo"}"
                            loading="lazy">`;

                  return `
                    <figure class="gallery-slide">
                      <span class="media-type-label">${label}</span>
                      ${content}
                      ${caption
                        ? `<figcaption>${caption}</figcaption>`
                        : ""}
                      <span class="gallery-counter">
                        ${index + 1} / ${validMedia.length}
                      </span>
                    </figure>
                  `;
                }).join("")}
              </div>
            </div>

            <button type="button"
                    class="gallery-arrow gallery-next"
                    aria-label="Next media"
                    data-gallery-next>
              &#8594;
            </button>
          </div>
        </section>
      `;
    }).join("");
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
          ${renderGalleryGroups(
            project.galleryGroups ||
            (project.media?.length
              ? [{ title: "Gallery", media: project.media }]
              : [])
          )}
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

    root.querySelectorAll(".project-gallery-carousel").forEach((carousel) => {
      const viewport = carousel.querySelector(".gallery-viewport");
      const previous = carousel.querySelector("[data-gallery-prev]");
      const next = carousel.querySelector("[data-gallery-next]");

      if (!viewport || !previous || !next) return;

      const move = (direction) => {
        const slide = viewport.querySelector(".gallery-slide");
        if (!slide) return;

        const gap = 0;
        const distance = slide.getBoundingClientRect().width + gap;

        viewport.scrollBy({
          left: direction * distance,
          behavior: "smooth"
        });
      };

      previous.addEventListener("click", () => move(-1));
      next.addEventListener("click", () => move(1));
    });
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