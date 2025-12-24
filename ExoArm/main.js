document.addEventListener('DOMContentLoaded', async () => {
  
  // 1. CARGA DINÁMICA DE PIEZAS DESDE JSON
  const container = document.getElementById('piezas-container');
  
  if (container) {
    try {
      const response = await fetch('data/piezas.json');
      const piezas = await response.json();

      piezas.forEach(pieza => {
        // Creamos el HTML para cada pieza usando Template Strings
        const htmlPieza = `
          <details>
            <summary>${pieza.titulo}</summary>
            <div class="part-content">
                <div class="display-box">
                    <h4>Visualización CAD 3D</h4>
                    <model-viewer 
                        src="${pieza.modelo3d}" 
                        camera-controls 
                        auto-rotate 
                        ar 
                        shadow-intensity="1"
                        loading="lazy"> </model-viewer>
                </div>
                <div class="display-box">
                    <h4>Plano Técnico</h4>
                    <img src="${pieza.planoImg}" class="plano-img" alt="Plano ${pieza.titulo}" loading="lazy">
                    <a href="${pieza.planoPdf}" class="btn-download" download>Descargar PDF</a>
                </div>
                <div class="display-box">
                    <h4>Render de Movimiento</h4>
                    <video class="video-render" controls muted loop playsinline preload="none" poster="${pieza.planoImg}">
                        <source src="${pieza.videoRender}" type="video/mp4">
                    </video>
                </div>
            </div>
          </details>
        `;
        // Inyectamos el HTML en el contenedor
        container.innerHTML += htmlPieza;
      });

    } catch (error) {
      console.error("Error cargando las piezas:", error);
      container.innerHTML = `<p style="color:var(--acc); text-align:center;">Error cargando los datos del proyecto.</p>`;
    }
  }

  // 2. FUNCIONALIDADES ANTERIORES (Scroll, Reveal, Video Hero)
  
  // Fallback CSS
  const root = document.documentElement;
  if (!getComputedStyle(root).getPropertyValue('--card2').trim()) {
    root.style.setProperty('--card2', '#0c0f14');
  }

  // Scroll suave
  document.querySelectorAll('.menu a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id && id.startsWith('#')) {
        const el = document.querySelector(id);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // Reveal animation
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('on');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.1 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('on'));
  }

  // Autoplay Hero Video
  const heroVideo = document.querySelector('.hero-video');
  if (heroVideo) {
    heroVideo.play().catch(() => {
      heroVideo.muted = true;
      heroVideo.play();
    });
  }
});