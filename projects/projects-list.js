document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.querySelector("#project-grid");
  const message = document.querySelector("#project-grid-message");
  const searchInput = document.querySelector("#project-search");
  const filtersContainer = document.querySelector("#project-filters");
  const clearButton = document.querySelector("#clear-project-filters");
  const emptyClearButton = document.querySelector("#empty-clear-filters");
  const emptyState = document.querySelector("#project-empty-state");

  if (!grid) return;

  const state = {
    projects: [],
    category: "all",
    search: ""
  };

  const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);

  const normalise = (value) =>
    String(value ?? "").trim().toLowerCase();

  const asTextArray = (value) =>
    Array.isArray(value)
      ? value.filter((item) => typeof item === "string")
      : [];

  const getCategory = (project) =>
    String(project.category || "Other").trim() || "Other";

  const getSearchText = (project) => [
    project.name,
    project.description,
    project.category,
    project.status,
    project.summary,
    ...asTextArray(project.technologies),
    ...asTextArray(project.tags)
  ].join(" ").toLowerCase();

  const getProjectUrl = (id) => `projects/${encodeURIComponent(id)}/`;

  const getSafeImage = (image) => {
    if (typeof image !== "string" || !image.trim()) return "";

    const value = image.trim();

    // Permit normal relative asset paths and HTTP(S) image URLs only.
    if (/^https?:\/\/[^\s"'<>]+$/i.test(value)) return value;
    if (/^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[a-zA-Z0-9_./-]+$/.test(value)) {
      return value;
    }

    return "";
  };

  const renderFilters = () => {
    if (!filtersContainer) return;

    const categories = [...new Set(state.projects.map(getCategory))]
      .sort((a, b) => a.localeCompare(b));

    const allFilters = [
      { value: "all", label: "All projects" },
      ...categories.map((category) => ({
        value: category,
        label: category
      }))
    ];

    filtersContainer.innerHTML = allFilters.map((filter) => {
      const active = normalise(filter.value) === normalise(state.category);

      return `
        <button
          class="project-filter${active ? " is-active" : ""}"
          type="button"
          data-category="${escapeHTML(filter.value)}"
          aria-pressed="${active ? "true" : "false"}">
          ${escapeHTML(filter.label)}
        </button>
      `;
    }).join("");
  };

  const renderCard = (project) => {
    const id = String(project.id || "");
    const name = String(project.name || "Untitled project");
    const image = getSafeImage(project.image);
    const symbol = String(project.symbol || name.charAt(0) || "P");
    const technologies = asTextArray(project.technologies).slice(0, 5);
    const status = String(project.status || "In progress");
    const category = getCategory(project);

    const artwork = image
      ? `<img
           src="${escapeHTML(image)}"
           alt="${escapeHTML(name)} project preview"
           loading="lazy"
           decoding="async"
           onerror="this.style.display='none'; this.nextElementSibling.hidden=false">
         <span class="project-symbol" aria-hidden="true" hidden>${escapeHTML(symbol)}</span>`
      : `<span class="project-symbol" aria-hidden="true">${escapeHTML(symbol)}</span>`;

    const tags = technologies.map((technology) =>
      `<span class="tech-tag">${escapeHTML(technology)}</span>`
    ).join("");

    return `
      <a class="project-card project-card-link"
         href="${getProjectUrl(id)}"
         aria-label="View details for ${escapeHTML(name)}"
         data-project-id="${escapeHTML(id)}">

        <div class="project-art">
          ${artwork}
        </div>

        <div class="project-content">
          <p class="eyebrow project-category">${escapeHTML(category)}</p>
          <h2>${escapeHTML(name)}</h2>
          <p class="project-description">${escapeHTML(project.description || "")}</p>

          ${tags ? `<div class="tech-tags">${tags}</div>` : ""}

          <div class="project-card-bottom">
            <span class="project-status">${escapeHTML(status)}</span>
            <span class="project-link">Explore project ↗</span>
          </div>
        </div>
      </a>
    `;
  };

  const applyFilters = () => {
    const query = normalise(state.search);

    const visibleProjects = state.projects.filter((project) => {
      const categoryMatches =
        state.category === "all" ||
        normalise(getCategory(project)) === normalise(state.category);

      const searchMatches =
        !query || getSearchText(project).includes(query);

      return categoryMatches && searchMatches;
    });

    grid.innerHTML = visibleProjects.map(renderCard).join("");

    if (message) {
      message.textContent =
        `Showing ${visibleProjects.length} of ${state.projects.length} projects`;
    }

    if (emptyState) {
      emptyState.hidden = visibleProjects.length !== 0;
    }

    grid.hidden = visibleProjects.length === 0;
  };

  const clearFilters = () => {
    state.category = "all";
    state.search = "";

    if (searchInput) searchInput.value = "";

    renderFilters();
    applyFilters();
  };

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      state.search = searchInput.value;
      applyFilters();
    });
  }

  if (filtersContainer) {
    filtersContainer.addEventListener("click", (event) => {
      const button = event.target.closest("[data-category]");
      if (!button) return;

      state.category = button.dataset.category || "all";
      renderFilters();
      applyFilters();
    });
  }

  clearButton?.addEventListener("click", clearFilters);
  emptyClearButton?.addEventListener("click", clearFilters);

  try {
    const response = await fetch("data/projects.json", {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Project data request failed (${response.status})`);
    }

    const projects = await response.json();

    if (!Array.isArray(projects)) {
      throw new Error("data/projects.json must contain an array");
    }

    state.projects = projects.filter((project) =>
      project &&
      typeof project === "object" &&
      /^[a-z0-9-]+$/.test(String(project.id || "")) &&
      typeof project.name === "string" &&
      project.name.trim().length > 0
    );

    if (state.projects.length === 0) {
      grid.hidden = true;
      if (message) message.textContent = "No projects have been added yet.";
      if (emptyState) {
        emptyState.hidden = false;
        emptyState.querySelector("h2").textContent = "No projects yet";
        emptyState.querySelector("p").textContent =
          "Projects will appear here when they are added.";
        emptyClearButton?.setAttribute("hidden", "");
      }
      return;
    }

    renderFilters();
    applyFilters();
  } catch (error) {
    console.error("Projects page error:", error);
    grid.innerHTML = "";
    grid.hidden = true;

    if (message) {
      message.textContent =
        "Projects could not be loaded. Check data/projects.json and try again.";
    }

    if (emptyState) {
      emptyState.hidden = false;
      emptyState.querySelector("h2").textContent = "Unable to load projects";
      emptyState.querySelector("p").textContent =
        "Check your connection and project data, then reload this page.";
      emptyClearButton?.setAttribute("hidden", "");
    }
  }
});