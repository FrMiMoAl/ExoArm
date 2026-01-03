// ============================
// HEX -> [r,g,b,a] en 0..1
// ============================
function hexToRgbaFactor(hex) {
  if (typeof hex !== "string") return null;
  hex = hex.trim().replace("#", "");

  if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");

  let a = 1;
  if (hex.length === 8) {
    a = parseInt(hex.substring(6, 8), 16) / 255;
    hex = hex.substring(0, 6);
  }

  if (hex.length !== 6) return null;

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  if (![r, g, b, a].every(n => Number.isFinite(n))) return null;
  return [r, g, b, a];
}

function normalizeColorToFactorArray(color) {
  if (!color) return null;
  if (typeof color === "string") return hexToRgbaFactor(color);
  if (Array.isArray(color)) {
    if (color.length === 3) return [color[0], color[1], color[2], 1];
    if (color.length === 4) return color;
  }
  return null;
}

// ============================
// Crea una "textura sólida" 1x1 para forzar color
// Devuelve dataURL
// ============================
function solidColorDataURL([r, g, b, a]) {
  const c = document.createElement("canvas");
  c.width = 1; c.height = 1;
  const ctx = c.getContext("2d");

  // pasar 0..1 a 0..255
  const rr = Math.round(r * 255);
  const gg = Math.round(g * 255);
  const bb = Math.round(b * 255);

  ctx.fillStyle = `rgba(${rr},${gg},${bb},${a})`;
  ctx.fillRect(0, 0, 1, 1);

  return c.toDataURL("image/png");
}

// ============================
// Aplica color a TODOS los materiales de un model-viewer
// Estrategia:
// 1) setBaseColorFactor (siempre)
// 2) si existe setBaseColorTexture, forzar textura 1x1 del color (ULTRA robusto)
// ============================
async function forceColorOnViewer(visor, colorArray) {
  if (!visor || !colorArray) return;
  if (!visor.model || !visor.model.materials) return;

  // 1) aplicar factor (por si ya funciona con eso)
  visor.model.materials.forEach(mat => {
    if (mat?.pbrMetallicRoughness) {
      mat.pbrMetallicRoughness.setBaseColorFactor(colorArray);
      mat.pbrMetallicRoughness.setMetallicFactor(0.1);
      mat.pbrMetallicRoughness.setRoughnessFactor(0.75);
    }
    // para que no se “queme” en blanco por iluminación
    if (typeof mat.setEmissiveFactor === "function") {
      mat.setEmissiveFactor([colorArray[0] * 0.15, colorArray[1] * 0.15, colorArray[2] * 0.15]);
    }
  });

  // 2) FORZAR textura sólida (esto es lo que hace que “acepte cualquier color”)
  // model-viewer tiene createTexture(); la usamos con dataURL
  try {
    const dataURL = solidColorDataURL(colorArray);
    const tex = await visor.createTexture(dataURL);

    visor.model.materials.forEach(mat => {
      const mr = mat?.pbrMetallicRoughness;
      if (!mr) return;

      // Algunos builds de model-viewer exponen setBaseColorTexture()
      if (typeof mr.setBaseColorTexture === "function") {
        mr.setBaseColorTexture(tex);
        // cuando la textura manda, dejamos el factor en blanco para no alterar el tono
        mr.setBaseColorFactor([1, 1, 1, 1]);
      } else {
        // Fallback: si no existe el setter, por lo menos ya quedó el factor aplicado arriba
      }
    });
  } catch (e) {
    // Si createTexture falla, igual queda aplicado el factor del paso 1.
    console.warn("No se pudo forzar textura sólida, usando solo BaseColorFactor:", e);
  }
}

// ============================
// Espera a que el modelo esté listo y aplica color
// ============================
function applyColorWhenReady(visor, colorArray) {
  if (!visor || !colorArray) return;

  const run = async () => {
    if (!visor.model) return;
    await forceColorOnViewer(visor, colorArray);
  };

  if (visor.model) {
    run();
    return;
  }

  const onReady = () => {
    run();
    visor.removeEventListener("load", onReady);
    visor.removeEventListener("scene-graph-ready", onReady);
  };

  visor.addEventListener("load", onReady);
  visor.addEventListener("scene-graph-ready", onReady);
}

// ============================
// MAIN
// ============================
document.addEventListener("DOMContentLoaded", async () => {

  // --- 1. FUNCIÓN PARA MOSTRAR/OCULTAR RENDERS ---
  window.toggleRenders = function (id) {
    const galeria = document.getElementById(id);
    const btn = document.getElementById("btn-" + id);
    if (!galeria || !btn) return;

    if (galeria.style.display === "none" || galeria.style.display === "") {
      galeria.style.display = "grid";
      btn.innerHTML = "🔼 Ocultar Renders";
      btn.style.background = "#333";
    } else {
      galeria.style.display = "none";
      btn.innerHTML = "📸 Ver Renders Fotorrealistas";
      btn.style.background = "#d90429";
    }
  };

  // --- 2. CARGA DE DATOS DESDE JSON ---
  const container = document.getElementById("piezas-container");

  if (container) {
    try {
      const response = await fetch("data/piezas.json");
      if (!response.ok) throw new Error("No se encontró data/piezas.json");

      const piezas = await response.json();
      container.innerHTML = "";

      piezas.forEach((pieza, index) => {
        const uniqueId = `modelo-${index}`;
        const galleryId = `gallery-${index}`;

        let htmlGaleria = "";
        let htmlBoton = "";

        if (pieza.renders && pieza.renders.length > 0) {
          const imagenes = pieza.renders
            .map(url =>
              `<img src="${url}" onclick="window.open(this.src)" style="width:100%; height:100px; object-fit:cover; border-radius:6px; cursor:zoom-in; border:1px solid #333;">`
            ).join("");

          htmlBoton = `
            <button id="btn-${galleryId}" onclick="toggleRenders('${galleryId}')"
              style="width:100%; padding:10px; margin-top:10px; background:#d90429; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">
              📸 Ver Renders
            </button>
          `;

          htmlGaleria = `
            <div id="${galleryId}" style="display:none; grid-template-columns: repeat(3, 1fr); gap:10px; margin-top:10px;">
              ${imagenes}
            </div>
          `;
        }

        container.innerHTML += `
          <details>
            <summary>${pieza.titulo}</summary>
            <div class="part-content">

              <div class="display-box">
                <h4>Visualización CAD 3D</h4>
                <model-viewer
                  id="${uniqueId}"
                  src="${pieza.modelo3d}"
                  camera-controls
                  auto-rotate
                  ar
                  exposure="0.8"
                  shadow-intensity="0.6"
                  environment-image="neutral"
                  style="background-color:#111; width:100%; height:300px;">
                </model-viewer>
              </div>

              <div class="display-box">
                <h4>Plano Técnico</h4>
                <img src="${pieza.planoImg}" style="width:100%; height:250px; object-fit:contain; background:white;">
                <a href="${pieza.planoPdf}" class="btn-download" download
                  style="display:block; text-align:center; background:#222; color:white; padding:10px; margin-top:10px; text-decoration:none; border-radius:4px;">
                  Descargar PDF
                </a>
              </div>

              <div class="display-box">
                <h4>Análisis y Simulación</h4>
                <video controls muted loop playsinline style="width:100%; height:300px; object-fit:cover;">
                  <source src="${pieza.videoRender}" type="video/mp4">
                </video>

                ${htmlBoton}
                ${htmlGaleria}
              </div>

            </div>
          </details>
        `;
      });

      // --- 3. APLICAR COLORES (robusto) ---
      piezas.forEach((pieza, index) => {
        const visor = document.getElementById(`modelo-${index}`);
        if (!visor) return;

        const colorFinal = normalizeColorToFactorArray(pieza.color);
        if (!colorFinal) return;

        applyColorWhenReady(visor, colorFinal);
      });

    } catch (error) {
      console.error(error);
      container.innerHTML = `<h3 style="color:red; text-align:center;">⚠️ Error: ${error.message}</h3>`;
    }
  }

  // --- 4. EXTRAS ---
  const heroVideo = document.querySelector(".hero video");
  if (heroVideo) heroVideo.play().catch(() => { heroVideo.muted = true; heroVideo.play(); });

  const revealEls = document.querySelectorAll(".reveal");
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add("on"); io.unobserve(en.target); }
    });
  });
  revealEls.forEach(el => io.observe(el));
});
