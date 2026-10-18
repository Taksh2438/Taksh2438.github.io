document.addEventListener("DOMContentLoaded", loadHomePage);

async function loadHomePage() {
  const root = document.querySelector("#home-content");
  if (!root) return;

  const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);

  try {
    const [profileResponse, projectsResponse] = await Promise.all([
      fetch("data/profile.json"),
      fetch("data/projects.json")
    ]);

    if (!profileResponse.ok || !projectsResponse.ok) {
      throw new Error("Could not load profile or project data.");
    }

    const profile = await profileResponse.json();
    const projects = await projectsResponse.json();

    if (!Array.isArray(projects)) {
      throw new Error("Project data must be a JSON array.");
    }

    const featuredProjects = projects.filter(
      (project) => project.featured === true && project.showOnHome === true
    );

    const projectCards = featuredProjects.map((project) => {
      const image = typeof project.image === "string"
        ? project.image.trim()
        : "";

      const safeImage = /^(https?:\/\/|[a-zA-Z0-9_./-]+$)/.test(image)
        ? image
        : "";

      const artwork = safeImage
        ? `<img src="${escapeHTML(safeImage)}"
                alt="${escapeHTML(project.name)} preview"
                loading="lazy">`
        : `<span class="project-symbol" aria-hidden="true">
             ${escapeHTML(project.symbol || "P")}
           </span>`;

      const technologies = Array.isArray(project.technologies)
        ? project.technologies.slice(0, 3).map((technology) =>
            `<span class="tech-tag">${escapeHTML(technology)}</span>`
          ).join("")
        : "";

      return `
        <a class="featured-card project-card-link"
           href="projects/${escapeHTML(project.id)}/">
          <div class="project-art">${artwork}</div>
          <div class="project-content">
            <p class="eyebrow">${escapeHTML(project.category || "PROJECT")}</p>
            <h3>${escapeHTML(project.name)}</h3>
            <p>${escapeHTML(project.description || "")}</p>
            <div class="tech-tags">${technologies}</div>
            <div class="project-card-bottom">
              <span class="project-status">
                ${escapeHTML(project.status || "In Progress")}
              </span>
              <span class="project-link">Explore project ↗</span>
            </div>
          </div>
        </a>
      `;
    }).join("");

    root.innerHTML = `
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">ENGINEERING · CODE · BUILD</p>
          <h1>Curious by nature.<br>Driven to <span>build.</span></h1>
          <p class="hero-description">
            ${escapeHTML(profile.intro || "")}
          </p>
          <div class="hero-actions">
            <a class="button button-primary" href="projects.html">
              Explore Projects ↗
            </a>
            <a class="button button-secondary" href="about.html">
              About Me
            </a>
          </div>
          <p class="about-location">${escapeHTML(profile.location || "")}</p>
        </div>

        <div class="hero-visual" aria-label="Engineering-inspired visual">
          <div class="visual-ring visual-ring-one"></div>
          <div class="visual-ring visual-ring-two"></div>
          <div class="visual-core">TM<span>.</span></div>
          <span class="visual-label visual-label-one">DESIGN</span>
          <span class="visual-label visual-label-two">BUILD</span>
          <span class="visual-label visual-label-three">IMPROVE</span>
        </div>
      </section>

      <section class="quick-facts">
        <div>
          <strong>50+</strong>
          <span>CAD Models</span>
        </div>
        <div>
          <strong>3rd</strong>
          <span>Robot Competition</span>
        </div>
        <div>
          <strong>01</strong>
          <span>App in Development</span>
        </div>
      </section>

      <section class="featured-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">SELECTED WORK</p>
            <h2>Projects I'm Building</h2>
          </div>
          <a class="text-link" href="projects.html">All projects ↗</a>
        </div>

        <div class="featured-grid">
          ${projectCards || "<p>Projects will appear here soon.</p>"}
        </div>
      </section>

      <section class="approach-section">
        <p class="eyebrow">MY APPROACH</p>
        <h2>Learn it. Build it. Improve it.</h2>
        <p>
          I learn by experimenting, solving problems, and turning ideas
          into practical projects across software, electronics, and
          mechanical design.
        </p>
        <a class="text-link" href="about.html">More about my journey ↗</a>
      </section>
    `;
  } catch (error) {
    console.error("Home page error:", error);
    root.innerHTML = `
      <section class="detail-error">
        <h1>Portfolio unavailable</h1>
        <p>Check data/profile.json and data/projects.json, then refresh.</p>
      </section>
    `;
  }
}