import * as THREE from "three";

document.addEventListener("DOMContentLoaded", loadHomePage);

async function loadHomePage() {
  const root = document.querySelector("#home-content");
  if (!root) return;

  const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  const safeImageSource = (value = "") => {
    const source = String(value).trim();

    try {
      const url = new URL(source);
      return ["https:", "http:"].includes(url.protocol)
        ? url.href
        : "";
    } catch {
      return /^[a-zA-Z0-9_./-]+$/.test(source) &&
        !source.split("/").includes("..") &&
        !source.startsWith("/")
        ? source
        : "";
    }
  };

  try {
    const [profileResponse, projectsResponse] = await Promise.all([
      fetch("data/profile.json"),
      fetch("data/projects.json")
    ]);

    if (!profileResponse.ok || !projectsResponse.ok) {
      throw new Error("Could not load portfolio data.");
    }

    const profile = await profileResponse.json();
    const projects = await projectsResponse.json();

    if (!Array.isArray(projects)) {
      throw new Error("Project data must be an array.");
    }

    const activeStatuses = [
      "in progress",
      "ongoing",
      "currently working"
    ];

    const activeProjects = projects.filter((project) =>
      project.featured === true &&
      project.showOnHome === true &&
      activeStatuses.includes(
        String(project.status || "").trim().toLowerCase()
      )
    );

    const cards = activeProjects.map((project) => {
      const image = safeImageSource(project.image || "");

      const artwork = image
        ? `<img src="${escapeHTML(image)}"
                alt="${escapeHTML(project.name)} preview"
                loading="lazy">`
        : `<span class="project-symbol" aria-hidden="true">
             ${escapeHTML(project.symbol || "P")}
           </span>`;

      const tags = Array.isArray(project.technologies)
        ? project.technologies.slice(0, 3).map((technology) =>
            `<span class="tech-tag">${escapeHTML(technology)}</span>`
          ).join("")
        : "";

      return `
        <a class="featured-card project-card-link"
           href="projects/${encodeURIComponent(project.id)}/">
          <div class="project-art">${artwork}</div>
          <div class="project-content">
            <p class="eyebrow">
              ${escapeHTML(project.category || "PROJECT")}
            </p>
            <h3>${escapeHTML(project.name || "Untitled Project")}</h3>
            <p class="project-description">
              ${escapeHTML(project.description || "")}
            </p>
            <div class="tech-tags">${tags}</div>
            <div class="project-card-bottom">
              <span class="project-status">
                ${escapeHTML(project.status)}
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
          <p class="about-location">
            ${escapeHTML(profile.location || "")}
          </p>
        </div>

        <div class="hero-visual" aria-label="Engineering-inspired visual">
          <div class="visual-ring visual-ring-one"></div>
          <div class="visual-ring visual-ring-two"></div>            
          <div class="visual-core sculpture-core" aria-label="Animated 3D Möbius strip">
            <canvas id="mobius-canvas"></canvas>
          </div>
        </div>
      </section>

      <section class="quick-facts">
        <div><strong>50+</strong><span>CAD Models</span></div>
        <div><strong>3rd</strong><span>Robot Competition</span></div>
        <div><strong>01</strong><span>App in Development</span></div>
      </section>

      <section class="featured-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">CURRENTLY IN DEVELOPMENT</p>
            <h2>Projects I'm Building</h2>
          </div>
          <div class="carousel-controls">
            <button class="carousel-arrow" type="button"
              data-project-prev aria-label="Previous projects">
              &#8592;
            </button>
            <button class="carousel-arrow" type="button"
              data-project-next aria-label="Next projects">
              &#8594;
            </button>
          </div>
        </div>

        ${
          activeProjects.length
            ? `<div class="featured-carousel">
                 <div class="featured-track" id="featured-track"
                   tabindex="0" aria-label="Current projects">
                   ${cards}
                 </div>
               </div>`
            : `<p class="empty-projects">
                 No active projects selected yet. Update the project
                 settings in data/projects.json.
               </p>`
        }

        <div class="carousel-footer">
          <span>${activeProjects.length} active project(s)</span>
          <a class="text-link" href="projects.html">View all projects ↗</a>
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
        <a class="text-link" href="about.html">
          More about my journey ↗
        </a>
      </section>
    `;

    const track = root.querySelector("#featured-track");
    const previous = root.querySelector("[data-project-prev]");
    const next = root.querySelector("[data-project-next]");

    if (track && previous && next) {
      const updateButtons = () => {
        const maxScroll = track.scrollWidth - track.clientWidth;
        previous.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft >= maxScroll - 2;
      };

      const move = (direction) => {
        const card = track.querySelector(".featured-card");
        if (!card) return;

        const gap = parseFloat(getComputedStyle(track).gap) || 0;

        track.scrollBy({
          left: direction * (card.getBoundingClientRect().width + gap),
          behavior: "smooth"
        });
      };

      previous.addEventListener("click", () => move(-1));
      next.addEventListener("click", () => move(1));
      track.addEventListener("scroll", updateButtons, { passive: true });
      window.addEventListener("resize", updateButtons);
      updateButtons();
    }
  } catch (error) {
    console.error("Homepage error:", error);
    root.innerHTML = `
      <section class="detail-error">
        <h1>Portfolio unavailable</h1>
        <p>Check data/profile.json and data/projects.json, then refresh.</p>
      </section>
    `;
  }
}

function initMobiusSculpture() {
  const canvas = document.getElementById("mobius-canvas");
  if (!canvas) {
    console.error("Möbius canvas not found!");
    return;
  }
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.z = 7;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  // Create a technical surface texture
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 1024;
  textureCanvas.height = 512;

  const ctx = textureCanvas.getContext("2d");
  ctx.fillStyle = "#243746";
  ctx.fillRect(0, 0, 1024, 512);

  ctx.strokeStyle = "rgba(100, 210, 255, 0.2)";
  ctx.lineWidth = 1;

  for (let x = 0; x < 1024; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }

  for (let y = 0; y < 512; y += 16) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  for (let i = 0; i < 100; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;

    ctx.strokeStyle = i % 3 === 0
      ? "#ffb65c"
      : "#69dfff";

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 30 + Math.random() * 50, y);
    ctx.lineTo(x + 30 + Math.random() * 50, y + 12);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  // Generate the Möbius strip geometry
  const positions = [];
  const uvs = [];
  const indices = [];

  const segments = 240;
  const widthSegments = 32;
  const radius = 1.4;
  const halfWidth = 0.48;

  for (let i = 0; i <= segments; i++) {
    const u = (i / segments) * Math.PI * 2;

    for (let j = 0; j <= widthSegments; j++) {
      const v = (j / widthSegments * 2 - 1) * halfWidth;
      const twist = u / 2;
      const r = radius + v * Math.cos(twist);

      positions.push(
        r * Math.cos(u),
        r * Math.sin(u),
        v * Math.sin(twist)
      );

      uvs.push(i / segments, j / widthSegments);
    }
  }

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < widthSegments; j++) {
      const a = i * (widthSegments + 1) + j;
      const b = a + widthSegments + 1;

      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(uvs, 2)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    metalness: 0.85,
    roughness: 0.25,
    side: THREE.DoubleSide
  });

  const mobius = new THREE.Mesh(geometry, material);
  scene.add(mobius);

  scene.add(new THREE.AmbientLight(0xffffff, 1.5));

  const blueLight = new THREE.PointLight(0x39aaff, 45);
  blueLight.position.set(-3, 2, 4);
  scene.add(blueLight);

  const goldLight = new THREE.PointLight(0xffad55, 30);
  goldLight.position.set(3, -2, 2);
  scene.add(goldLight);

  const whiteLight = new THREE.DirectionalLight(0xffffff, 3);
  whiteLight.position.set(1, 4, 5);
  scene.add(whiteLight);

  function resize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (!width || !height) return;

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  function animate() {
    requestAnimationFrame(animate);
    mobius.rotation.x = -0.3;
    mobius.rotation.y += 0.004;
    renderer.render(scene, camera);
  }

  animate();
}

document.addEventListener("DOMContentLoaded", () => {
  initMobiusSculpture();
});