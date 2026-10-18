document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.querySelector("#project-grid");
  const message = document.querySelector("#project-grid-message");

  if (!grid) return;

  const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);

  try {
    const response = await fetch("data/projects.json");

    if (!response.ok) {
      throw new Error("Unable to load projects.json");
    }

    const projects = await response.json();

    if (!Array.isArray(projects)) {
      throw new Error("Project data must be a JSON array");
    }

    const validProjects = projects.filter((project) =>
      project &&
      /^[a-z0-9-]+$/.test(project.id || "") &&
      project.name
    );

    if (validProjects.length === 0) {
      grid.innerHTML = "";
      if (message) message.textContent = "No projects have been added yet.";
      return;
    }

    grid.innerHTML = validProjects.map((project) => {
      const href = `projects/${project.id}/`;
      const image = typeof project.image === "string"
        ? project.image.trim()
        : "";

      const safeImage = /^(https?:\/\/|[a-zA-Z0-9_./-]+$)/.test(image)
        ? image
        : "";

      const artwork = safeImage
        ? `<img src="${escapeHTML(safeImage)}"
                alt="${escapeHTML(project.name)} project preview"
                loading="lazy">`
        : `<span class="project-symbol"
                 aria-hidden="true">${escapeHTML(project.symbol || "P")}</span>`;

      const technologies = Array.isArray(project.technologies)
        ? project.technologies
            .slice(0, 4)
            .map((technology) =>
              `<span class="tech-tag">${escapeHTML(technology)}</span>`
            )
            .join("")
        : "";

      return `
        <a class="project-card project-card-link"
           href="${href}"
           aria-label="View details for ${escapeHTML(project.name)}">

          <div class="project-art">
            ${artwork}
          </div>

          <div class="project-content">
            <p class="eyebrow">${escapeHTML(project.category || "PROJECT")}</p>
            <h2>${escapeHTML(project.name)}</h2>
            <p>${escapeHTML(project.description || "")}</p>

            <div class="tech-tags">${technologies}</div>

            <div class="project-card-bottom">
              <span class="project-status">
                ${escapeHTML(project.status || "In Progress")}
              </span>
              <span class="project-link">View project ↗</span>
            </div>
          </div>
        </a>
      `;
    }).join("");

    if (message) message.textContent = "";
  } catch (error) {
    console.error("Projects page error:", error);
    grid.innerHTML = "";

    if (message) {
      message.textContent =
        "Projects could not be loaded. Please check the project data and try again.";
    }
  }
});