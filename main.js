document.addEventListener('DOMContentLoaded', async () => {

  // ==========================================
  // 1. CARGA DE PIEZAS DESDE JSON
  // ==========================================
  const container = document.getElementById('piezas-container');
  
  if (container) {
    try {
      const response = await fetch('data/piezas.json');
      if (!response.ok) throw new Error("No se encontró el archivo JSON");
      
      const piezas = await response.json();
      container.innerHTML = '';

      // A) Generamos todo el HTML primero
      piezas.forEach((pieza, index) => {
        const uniqueId = `modelo-${index}`; // ID único para cada visor

        const htmlPieza = `
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
                        shadow-intensity="1"
                        style="background-color: #111; width: 100%; height: 300px;">
                    </model-viewer>
                </div>
                <div class="display-box">
                    <h4>Plano Técnico</h4>
                    <img src="${pieza.planoImg}" class="plano-img" alt="Plano" style="width:100%; height:250px; object-fit:contain; background:white;">
                    <a href="${pieza.planoPdf}" class="btn-download" download style="display:block; text-align:center; background:#d90429; color:white; padding:10px; margin-top:10px; text-decoration:none; border-radius:4px;">Descargar PDF</a>
                </div>
                <div class="display-box">
                    <h4>Render de Movimiento</h4>
                    <video controls muted loop playsinline style="width:100%; height:300px; object-fit:cover;">
                        <source src="${pieza.videoRender}" type="video/mp4">
                    </video>
                </div>
            </div>
          </details>
        `;
        container.innerHTML += htmlPieza;
      });

      // B) APLICAR COLORES (La magia ocurre aquí)
      // Recorremos las piezas nuevamente para aplicar el color una vez que el HTML existe
      piezas.forEach((pieza, index) => {
        if (pieza.color) {
            const viewer = document.getElementById(`modelo-${index}`);
            
            // Esperamos a que el modelo cargue ('load') para pintar
            viewer.addEventListener('load', () => {
                const material = viewer.model.materials[0];
                if(material) {
                    material.pbrMetallicRoughness.setBaseColorFactor(pieza.color);
                }
            });
        }
      });

    } catch (error) {
      console.error("Error:", error);
      container.innerHTML = `<p style="color:white; text-align:center;">⚠️ Error cargando piezas. Revisa la consola.</p>`;
    }
  }

  // ==========================================
  // 2. FUNCIONALIDADES EXTRA (Scroll, Video)
  // ==========================================
  
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if(target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('on');
          io.unobserve(en.target);
        }
      });
  }, { threshold: 0.1 });
  revealEls.forEach(el => io.observe(el));

  const heroVideo = document.querySelector('.hero video');
  if (heroVideo) {
    heroVideo.play().catch(() => {
      heroVideo.muted = true;
      heroVideo.play();
    });
  }
});