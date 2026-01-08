document.addEventListener("DOMContentLoaded", async () => {

  const container = document.getElementById("piezas-container");

  try {
    const response = await fetch("data/piezas.json");
    if (!response.ok) throw new Error("No se pudo cargar piezas.json");

    const piezas = await response.json();
    container.innerHTML = "";

    piezas.forEach((pieza, index) => {

      container.innerHTML += `
        <details>
          <summary>${pieza.titulo}</summary>

          <div class="part-content">

            <!-- MODELO 3D -->
            <div class="display-box">
              <h4>Modelo 3D</h4>
              <model-viewer
                src="${pieza.modelo3d}"
                camera-controls
                auto-rotate
                exposure="0.8"
                shadow-intensity="0.6"
                environment-image="neutral">
              </model-viewer>
            </div>

            <!-- PLANO -->
            <div class="display-box">
              <h4>Plano Técnico</h4>
              <img src="${pieza.planoImg}" class="plano-img">
              <a href="${pieza.planoPdf}" class="btn-download" download>
                Descargar plano (PDF)
              </a>
            </div>

          </div>
        </details>
      `;
    });

  } catch (error) {
    container.innerHTML =
      `<p style="color:red; text-align:center;">Error: ${error.message}</p>`;
  }
});
