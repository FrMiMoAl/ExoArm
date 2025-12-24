document.addEventListener('DOMContentLoaded', async () => {

  // --- 1. FUNCIÓN PARA MOSTRAR/OCULTAR RENDERS ---
  window.toggleRenders = function(id) {
      const galeria = document.getElementById(id);
      const btn = document.getElementById('btn-' + id);
      
      if (!galeria || !btn) return;

      if (galeria.style.display === 'none' || galeria.style.display === '') {
          galeria.style.display = 'grid';
          btn.innerHTML = '🔼 Ocultar Renders';
          btn.style.background = '#333';
      } else {
          galeria.style.display = 'none';
          btn.innerHTML = '📸 Ver Renders Fotorrealistas';
          btn.style.background = '#d90429';
      }
  };

  // --- 2. CARGA DE DATOS DESDE JSON ---
  const container = document.getElementById('piezas-container');
  
  if (container) {
    try {
      const response = await fetch('data/piezas.json');
      if (!response.ok) throw new Error("No se encontró data/piezas.json");
      
      const piezas = await response.json();
      container.innerHTML = ''; // Limpiar contenedor

      // Generar HTML pieza por pieza
      piezas.forEach((pieza, index) => {
        const uniqueId = `modelo-${index}`;
        const galleryId = `gallery-${index}`;

        // Preparar HTML de la galería (si existe en el JSON)
        let htmlGaleria = '';
        let htmlBoton = '';

        if (pieza.renders && pieza.renders.length > 0) {
            // Crear imágenes
            const imagenes = pieza.renders.map(url => 
                `<img src="${url}" onclick="window.open(this.src)" style="width:100%; height:100px; object-fit:cover; border-radius:6px; cursor:zoom-in; border:1px solid #333;">`
            ).join('');

            // Botón
            htmlBoton = `
                <button id="btn-${galleryId}" onclick="toggleRenders('${galleryId}')" 
                    style="width:100%; padding:10px; margin-top:10px; background:#d90429; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">
                    📸 Ver Renders
                </button>
            `;

            // Contenedor oculto
            htmlGaleria = `
                <div id="${galleryId}" style="display:none; grid-template-columns: repeat(3, 1fr); gap:10px; margin-top:10px; animation: fadeIn 0.5s;">
                    ${imagenes}
                </div>
            `;
        }

        // Construir la tarjeta completa
        const html = `
          <details>
            <summary>${pieza.titulo}</summary>
            <div class="part-content">
                
                <div class="display-box">
                    <h4>Visualización CAD 3D</h4>
                    <model-viewer 
                        id="${uniqueId}" 
                        src="${pieza.modelo3d}" 
                        camera-controls auto-rotate ar shadow-intensity="1"
                        style="background-color: #111; width: 100%; height: 300px;">
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
        container.innerHTML += html;
      });

      // Aplicar colores después de cargar
      piezas.forEach((pieza, index) => {
        if (pieza.color) {
            const visor = document.getElementById(`modelo-${index}`);
            if (visor) {
                visor.addEventListener('load', () => {
                    const mat = visor.model.materials[0];
                    if(mat) mat.pbrMetallicRoughness.setBaseColorFactor(pieza.color);
                });
            }
        }
      });

    } catch (error) {
      console.error(error);
      container.innerHTML = `<h3 style="color:red; text-align:center;">⚠️ Error: ${error.message}</h3>`;
    }
  }

  // --- 3. EXTRAS (Video Hero, Scroll) ---
  const heroVideo = document.querySelector('.hero video');
  if (heroVideo) heroVideo.play().catch(()=>{ heroVideo.muted=true; heroVideo.play() });

  // Animación Reveal
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('on'); io.unobserve(en.target); }
      });
  });
  revealEls.forEach(el => io.observe(el));
});