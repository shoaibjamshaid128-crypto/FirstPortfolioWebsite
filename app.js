// app.js
import { db } from "./firebase-config.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Global slider indices store
const projectSliderState = {};

async function loadProfile() {
  try {
    const profileRef = doc(db, "portfolio", "profile");
    const docSnap = await getDoc(profileRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.name) document.getElementById('hero-name').innerText = data.name;
      if (data.title) document.getElementById('hero-title').innerText = data.title;
      if (data.about) document.getElementById('hero-about').innerText = data.about;
      if (data.profileUrl) document.getElementById('profile-img').src = data.profileUrl;

      // Skills
      const skillsContainer = document.getElementById('skills-list');
      skillsContainer.innerHTML = '';
      if (data.skills) {
        data.skills.split(',').forEach(skill => {
          const badge = document.createElement('span');
          badge.className = 'px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-cyan-300 font-medium text-sm neon-border';
          badge.innerText = skill.trim();
          skillsContainer.appendChild(badge);
        });
      }

      // Contact Links
      const contactContainer = document.getElementById('contact-info');
      contactContainer.innerHTML = `
        ${data.email ? `<a href="mailto:${data.email}" class="px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400 text-sm transition"><i class="fa-solid fa-envelope mr-2 text-cyan-400"></i>${data.email}</a>` : ''}
        ${data.whatsapp ? `<a href="https://wa.me/${data.whatsapp}" target="_blank" class="px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-400 text-sm transition"><i class="fa-brands fa-whatsapp mr-2 text-emerald-400"></i>WhatsApp</a>` : ''}
        ${data.github ? `<a href="${data.github}" target="_blank" class="px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-white text-sm transition"><i class="fa-brands fa-github mr-2"></i>GitHub</a>` : ''}
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
      container.innerHTML = '<p class="col-span-full text-center text-slate-500 py-12">No projects uploaded yet.</p>';
      return;
    }

    snapshot.forEach(docSnap => {
      const p = docSnap.data();
      const id = docSnap.id;
      const images = (p.images && p.images.length > 0) ? p.images : ['https://via.placeholder.com/600x1200?text=No+Image'];

      projectSliderState[id] = {
        images: images,
        currentIndex: 0,
        title: p.title || 'App Screenshot'
      };

      const card = document.createElement('div');
      card.className = "bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-xl";

      card.innerHTML = `
        <div>
          <!-- Slider Frame with exact 600px Height -->
          <div class="relative w-full h-[600px] bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800 group">
            
            <!-- Active Image (Click to View Full Size) -->
            <img id="slide-img-${id}" 
                 src="${images[0]}" 
                 alt="${p.title}" 
                 class="w-full h-full object-contain p-2 cursor-pointer transition-transform duration-300 group-hover:scale-[1.02]"
                 title="Click to zoom current image"
                 onclick="viewActiveImage('${id}')">

            <!-- Click indicator badge -->
            <div class="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition bg-black/70 px-3 py-1 rounded-full text-[11px] text-cyan-300 border border-cyan-500/30">
              <i class="fa-solid fa-magnifying-glass-plus mr-1"></i> Tap to view full size
            </div>

            <!-- Left Slide Arrow (shown if > 1 image) -->
            ${images.length > 1 ? `
              <button onclick="changeSlide('${id}', -1)" 
                      class="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-cyan-500 hover:text-slate-950 text-white border border-slate-700 flex items-center justify-center text-sm transition shadow-lg z-10">
                <i class="fa-solid fa-chevron-left"></i>
              </button>
            ` : ''}

            <!-- Right Slide Arrow (shown if > 1 image) -->
            ${images.length > 1 ? `
              <button onclick="changeSlide('${id}', 1)" 
                      class="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-cyan-500 hover:text-slate-950 text-white border border-slate-700 flex items-center justify-center text-sm transition shadow-lg z-10">
                <i class="fa-solid fa-chevron-right"></i>
              </button>
            ` : ''}

            <!-- Counter Badge -->
            <div class="absolute top-3 right-3 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-full text-[11px] text-slate-300">
              <span id="slide-index-${id}">1</span> / ${images.length}
            </div>
          </div>

          <!-- Project Details -->
          <div class="p-6">
            <h4 class="text-xl font-bold mb-2 text-white">${p.title}</h4>
            <p class="text-slate-400 text-sm mb-4 leading-relaxed line-clamp-3">${p.description}</p>
            <div class="flex flex-wrap gap-1.5 mb-2">
              ${(p.techStack || '').split(',').map(tag => tag.trim() ? `<span class="text-xs bg-slate-800/80 px-2.5 py-1 rounded-lg text-cyan-300 border border-slate-700">${tag.trim()}</span>` : '').join('')}
            </div>
          </div>
        </div>

        <!-- Download APK Button -->
        <div class="p-6 pt-0">
          ${p.apkUrl ? `
            <a href="${p.apkUrl}" target="_blank" download class="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20">
              <i class="fa-brands fa-android text-base"></i> Download APK
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

// Side Arrows Click Handler
window.changeSlide = function(projectId, direction) {
  const state = projectSliderState[projectId];
  if (!state || state.images.length <= 1) return;

  state.currentIndex += direction;
  if (state.currentIndex < 0) {
    state.currentIndex = state.images.length - 1; // loop to last
  } else if (state.currentIndex >= state.images.length) {
    state.currentIndex = 0; // loop to first
  }

  // Update image and counter
  const imgEl = document.getElementById(`slide-img-${projectId}`);
  const counterEl = document.getElementById(`slide-index-${projectId}`);

  imgEl.src = state.images[state.currentIndex];
  counterEl.innerText = state.currentIndex + 1;
};

// Current Active Image Full View Click Handler
window.viewActiveImage = function(projectId) {
  const state = projectSliderState[projectId];
  if (!state) return;

  const currentImgUrl = state.images[state.currentIndex];
  const modal = document.getElementById('image-viewer-modal');
  const viewerImg = document.getElementById('viewer-img');
  const caption = document.getElementById('viewer-caption');

  viewerImg.src = currentImgUrl;
  caption.innerText = `${state.title} (${state.currentIndex + 1} of ${state.images.length})`;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
};

loadProfile();
loadProjects();
