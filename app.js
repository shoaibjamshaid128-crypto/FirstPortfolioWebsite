// app.js
import { db } from "./firebase-config.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const projectSliderState = {};

async function loadProfile() {
  try {
    const profileRef = doc(db, "portfolio", "profile");
    const docSnap = await getDoc(profileRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Names
      if (data.name) {
        document.getElementById('hero-name').innerText = data.name;
        document.getElementById('nav-name').innerText = data.name;
        document.getElementById('about-card-name').innerText = data.name;
      }

      // Title
      if (data.title) {
        document.getElementById('hero-title').innerText = data.title;
        document.getElementById('nav-title').innerText = data.title;
        document.getElementById('about-card-title').innerText = data.title;
      }

      // About Text
      if (data.about) {
        document.getElementById('about-detailed-text').innerText = data.about;
      }

      // Skills
      const skillsContainer = document.getElementById('skills-list');
      skillsContainer.innerHTML = '';
      if (data.skills) {
        data.skills.split(',').forEach(skill => {
          const item = skill.trim();
          if (item) {
            const span = document.createElement('span');
            span.className = 'flex items-center gap-1.5';
            span.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> ${item}`;
            skillsContainer.appendChild(span);
          }
        });
      }

      // Profile DP (All images updated simultaneously)
      if (data.profileUrl) {
        document.getElementById('nav-dp').src = data.profileUrl;
        document.getElementById('about-portrait-img').src = data.profileUrl;
      }

      // WhatsApp CTAs
      if (data.whatsapp) {
        const waLink = `https://wa.me/${data.whatsapp}?text=Hello%20${encodeURIComponent(data.name || 'Shoaib')},%20let%27s%20discuss%20an%20Android%20Architecture%20Project`;
        document.getElementById('hero-whatsapp').href = waLink;
        document.getElementById('about-chat-btn').href = waLink;
        document.getElementById('cta-whatsapp-btn').href = waLink;
      }

      // Email CTA
      if (data.email) {
        document.getElementById('cta-email-btn').href = `mailto:${data.email}`;
      }

      // Nav and Footer Links
      if (data.github) {
        document.getElementById('nav-github').href = data.github;
        document.getElementById('footer-github').href = data.github;
      }
      if (data.linkedin) {
        document.getElementById('nav-linkedin').href = data.linkedin;
        document.getElementById('footer-linkedin').href = data.linkedin;
      }

      // Contact Buttons
      const contactContainer = document.getElementById('contact-info');
      contactContainer.innerHTML = `
        ${data.email ? `<span class="bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800"><i class="fa-solid fa-envelope text-cyan-400 mr-1.5"></i>${data.email}</span>` : ''}
        ${data.whatsapp ? `<span class="bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800"><i class="fa-brands fa-whatsapp text-emerald-400 mr-1.5"></i>WhatsApp Available</span>` : ''}
        ${data.github ? `<span class="bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800"><i class="fa-brands fa-github text-white mr-1.5"></i>GitHub Verified</span>` : ''}
      `;
    }
  } catch (err) {
    console.error("Profile load error:", err);
  }
}

async function loadProjects() {
  try {
    const projectsCol = collection(db, "projects");
    const snapshot = await getDocs(projectsCol);
    const container = document.getElementById('projects-container');
    container.innerHTML = '';

    if (snapshot.empty) {
      container.innerHTML = '<p class="col-span-full text-center text-slate-500 py-12">No projects uploaded yet. Add from Admin Dashboard.</p>';
      return;
    }

    snapshot.forEach(docSnap => {
      const p = docSnap.data();
      const id = docSnap.id;
      const images = (p.images && p.images.length > 0) ? p.images : ['https://via.placeholder.com/600x1200?text=No+Image'];
      const category = (p.category || 'fintech').toLowerCase();

      projectSliderState[id] = {
        images: images,
        currentIndex: 0,
        title: p.title || 'App Screenshot'
      };

      const card = document.createElement('div');
      card.className = "project-card glass-card rounded-3xl p-5 border border-slate-800 hover:border-cyan-400/40 transition group flex flex-col justify-between";
      card.setAttribute('data-category', category);

      card.innerHTML = `
        <div>
          <!-- Slider Frame -->
          <div class="relative w-full h-[520px] rounded-2xl overflow-hidden bg-slate-950 mb-4 border border-slate-800/80 group">
            
            <img id="slide-img-${id}" 
                 src="${images[0]}" 
                 alt="${p.title}" 
                 class="w-full h-full object-contain p-2 cursor-pointer transition-transform duration-300 group-hover:scale-[1.02]"
                 title="Click to zoom current image"
                 onclick="viewActiveImage('${id}')">

            <!-- Click indicator -->
            <div class="absolute bottom-3 right-3 px-2 py-1 rounded bg-slate-900/90 border border-slate-700 text-[10px] text-cyan-300 font-mono flex items-center gap-1">
              <i class="fa-solid fa-magnifying-glass-plus"></i> Tap to Zoom
            </div>

            <!-- Left Slide Arrow -->
            ${images.length > 1 ? `
              <button onclick="changeSlide('${id}', -1)" 
                      class="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/90 hover:bg-cyan-500 hover:text-slate-950 text-white border border-slate-700 flex items-center justify-center text-xs transition shadow-lg z-10">
                <i class="fa-solid fa-chevron-left"></i>
              </button>
            ` : ''}

            <!-- Right Slide Arrow -->
            ${images.length > 1 ? `
              <button onclick="changeSlide('${id}', 1)" 
                      class="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/90 hover:bg-cyan-500 hover:text-slate-950 text-white border border-slate-700 flex items-center justify-center text-xs transition shadow-lg z-10">
                <i class="fa-solid fa-chevron-right"></i>
              </button>
            ` : ''}

            <!-- Counter Badge -->
            <div class="absolute top-3 right-3 bg-slate-950/80 border border-slate-800 px-2.5 py-0.5 rounded-full text-[10px] text-slate-300 font-mono">
              <span id="slide-index-${id}">1</span>/${images.length}
            </div>
          </div>

          <!-- Project Details with Expandable Description -->
          <div class="space-y-2">
            <div class="flex justify-between items-center text-[10px] font-mono">
              <span class="text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded font-bold uppercase">${category}</span>
              <span class="text-emerald-400"><i class="fa-solid fa-circle text-[8px] mr-1"></i>Production Live</span>
            </div>

            <h4 class="text-base font-extrabold text-white group-hover:text-cyan-400 transition">${p.title}</h4>
            
            <div class="mb-3">
              <p id="desc-${id}" 
                 onclick="toggleDescription('${id}')" 
                 class="text-slate-400 text-xs leading-relaxed line-clamp-3 cursor-pointer hover:text-slate-200 transition" 
                 title="Click to view full description">
                ${p.description}
              </p>
              <button type="button" 
                      id="desc-btn-${id}" 
                      onclick="toggleDescription('${id}')" 
                      class="text-[11px] text-cyan-400 hover:text-cyan-300 mt-1 font-medium flex items-center gap-1 transition">
                <span>Read more</span> <i class="fa-solid fa-angle-down text-[9px]"></i>
              </button>
            </div>

            <div class="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono text-slate-300">
              ${(p.techStack || '').split(',').map(tag => tag.trim() ? `<span class="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">${tag.trim()}</span>` : '').join('')}
            </div>
          </div>
        </div>

        <!-- Download APK Button -->
        <div class="pt-4">
          ${p.apkUrl ? `
            <a href="${p.apkUrl}" target="_blank" download class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20">
              <i class="fa-brands fa-android text-sm"></i> Download APK
            </a>
          ` : ''}
        </div>
      `;

      container.appendChild(card);
    });
  } catch (err) {
    console.error("Projects load error:", err);
  }
}

// Global Filter Projects Handler
window.filterProjects = function(category) {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    if (btn.getAttribute('data-filter') === category) {
      btn.classList.add('bg-cyan-500', 'text-slate-950', 'border-cyan-400');
      btn.classList.remove('bg-slate-900', 'text-slate-300', 'border-slate-800');
    } else {
      btn.classList.remove('bg-cyan-500', 'text-slate-950', 'border-cyan-400');
      btn.classList.add('bg-slate-900', 'text-slate-300', 'border-slate-800');
    }
  });

  const cards = document.querySelectorAll('.project-card');
  cards.forEach(card => {
    if (category === 'all' || card.getAttribute('data-category') === category) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
};

window.toggleDescription = function(id) {
  const descEl = document.getElementById(`desc-${id}`);
  const btnEl = document.getElementById(`desc-btn-${id}`);
  if (!descEl || !btnEl) return;

  const isCollapsed = descEl.classList.contains('line-clamp-3');
  if (isCollapsed) {
    descEl.classList.remove('line-clamp-3');
    btnEl.innerHTML = `<span>Show less</span> <i class="fa-solid fa-angle-up text-[9px]"></i>`;
  } else {
    descEl.classList.add('line-clamp-3');
    btnEl.innerHTML = `<span>Read more</span> <i class="fa-solid fa-angle-down text-[9px]"></i>`;
  }
};

window.changeSlide = function(projectId, direction) {
  const state = projectSliderState[projectId];
  if (!state || state.images.length <= 1) return;

  state.currentIndex += direction;
  if (state.currentIndex < 0) state.currentIndex = state.images.length - 1;
  else if (state.currentIndex >= state.images.length) state.currentIndex = 0;

  const imgEl = document.getElementById(`slide-img-${projectId}`);
  const counterEl = document.getElementById(`slide-index-${projectId}`);
  imgEl.src = state.images[state.currentIndex];
  counterEl.innerText = state.currentIndex + 1;
};

window.viewActiveImage = function(projectId) {
  const state = projectSliderState[projectId];
  if (!state) return;

  const currentImgUrl = state.images[state.currentIndex];
  openViewer(currentImgUrl, `${state.title} (${state.currentIndex + 1} of ${state.images.length})`);
};

loadProfile();
loadProjects();
