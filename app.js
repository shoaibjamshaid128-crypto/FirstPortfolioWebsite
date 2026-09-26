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
        const heroName = document.getElementById('hero-name');
        const navName = document.getElementById('nav-name');
        const aboutCardName = document.getElementById('about-card-name');
        if (heroName) heroName.innerText = data.name;
        if (navName) navName.innerText = data.name;
        if (aboutCardName) aboutCardName.innerText = data.name;
      }

      // Title
      if (data.title) {
        const heroTitle = document.getElementById('hero-title');
        const navTitle = document.getElementById('nav-title');
        const aboutCardTitle = document.getElementById('about-card-title');
        if (heroTitle) heroTitle.innerText = data.title;
        if (navTitle) navTitle.innerText = data.title;
        if (aboutCardTitle) aboutCardTitle.innerText = data.title;
      }

      // About Text
      if (data.about) {
        const aboutText = document.getElementById('about-detailed-text');
        if (aboutText) aboutText.innerText = data.about;
      }

      // Skills
      const skillsContainer = document.getElementById('skills-list');
      if (skillsContainer) {
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
      }

      // Profile DP
      if (data.profileUrl) {
        const navDp = document.getElementById('nav-dp');
        const aboutDp = document.getElementById('about-portrait-img');
        if (navDp) navDp.src = data.profileUrl;
        if (aboutDp) aboutDp.src = data.profileUrl;
      }

      // WhatsApp CTAs
      if (data.whatsapp) {
        const waLink = `https://wa.me/${data.whatsapp}?text=Hello%20${encodeURIComponent(data.name || 'Shoaib')},%20let%27s%20discuss%20an%20Android%20Architecture%20Project`;
        const heroWa = document.getElementById('hero-whatsapp');
        const aboutWa = document.getElementById('about-chat-btn');
        const ctaWa = document.getElementById('cta-whatsapp-btn');
        if (heroWa) heroWa.href = waLink;
        if (aboutWa) aboutWa.href = waLink;
        if (ctaWa) ctaWa.href = waLink;
      }

      // Email CTA
      if (data.email) {
        const ctaEmail = document.getElementById('cta-email-btn');
        if (ctaEmail) ctaEmail.href = `mailto:${data.email}`;
      }

      // Nav and Footer Links
      if (data.github) {
        const navGit = document.getElementById('nav-github');
        const footerGit = document.getElementById('footer-github');
        if (navGit) navGit.href = data.github;
        if (footerGit) footerGit.href = data.github;
      }
      if (data.linkedin) {
        const navIn = document.getElementById('nav-linkedin');
        const footerIn = document.getElementById('footer-linkedin');
        if (navIn) navIn.href = data.linkedin;
        if (footerIn) footerIn.href = data.linkedin;
      }

      // Contact Buttons
      const contactContainer = document.getElementById('contact-info');
      if (contactContainer) {
        contactContainer.innerHTML = `
          ${data.email ? `<span class="bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800"><i class="fa-solid fa-envelope text-cyan-400 mr-1.5"></i>${data.email}</span>` : ''}
          ${data.whatsapp ? `<span class="bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800"><i class="fa-brands fa-whatsapp text-emerald-400 mr-1.5"></i>WhatsApp Available</span>` : ''}
          ${data.github ? `<span class="bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800"><i class="fa-brands fa-github text-white mr-1.5"></i>GitHub Verified</span>` : ''}
        `;
      }
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
    if (!container) return;
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
      card.className = "project-card glass-card rounded-3xl p-4 sm:p-5 border border-slate-800 hover:border-cyan-400/40 transition group flex flex-col justify-between";
      card.setAttribute('data-category', category);

      card.innerHTML = `
        <div>
          <!-- REALISTIC ANDROID DEVICE FRAME CONTAINER -->
          <div class="android-phone-mockup relative w-full mx-auto mb-5">
            
            <!-- Phone Outer Chasis -->
            <div class="phone-chassis relative bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#090d16] p-[9px] rounded-[42px] shadow-2xl border border-slate-700/60">
              
              <!-- Left Volume & Power Side Accents -->
              <span class="phone-button-left-vol"></span>
              <span class="phone-button-right-pwr"></span>

              <!-- Phone Screen -->
              <div class="relative w-full h-[470px] sm:h-[500px] rounded-[34px] overflow-hidden bg-black flex flex-col justify-between border border-slate-900/90 shadow-inner group/screen">
                
                <!-- Android Status Bar with Dynamic Punch-hole -->
                <div class="absolute top-0 inset-x-0 z-30 px-5 pt-2.5 pb-1 flex justify-between items-center text-[10px] font-mono text-slate-300/90 pointer-events-none bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                  <span class="font-bold tracking-tight">09:41</span>
                  
                  <!-- Android Center Punch-Hole Camera -->
                  <div class="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-800/90 flex items-center justify-center -mt-1 shadow-sm">
                    <span class="w-1.5 h-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/40"></span>
                  </div>

                  <div class="flex items-center gap-1.5 text-[9px]">
                    <i class="fa-solid fa-wifi text-[9px]"></i>
                    <i class="fa-solid fa-signal text-[9px]"></i>
                    <i class="fa-solid fa-battery-full text-[10px] text-emerald-400"></i>
                  </div>
                </div>

                <!-- Active App Screenshot -->
                <div class="w-full h-full relative overflow-hidden bg-slate-950 flex items-center justify-center">
                  <img id="slide-img-${id}" 
                       src="${images[0]}" 
                       alt="${p.title}" 
                       class="w-full h-full object-cover sm:object-contain p-1 cursor-pointer transition-transform duration-500 group-hover/screen:scale-105"
                       title="Click to zoom current image"
                       onclick="viewActiveImage('${id}')">

                  <!-- Zoom Overlay Hint -->
                  <div class="absolute bottom-6 right-3 px-2 py-0.5 rounded-full bg-slate-950/80 border border-cyan-500/40 text-[9px] text-cyan-300 font-mono flex items-center gap-1 shadow-lg pointer-events-none backdrop-blur-md">
                    <i class="fa-solid fa-expand text-[8px]"></i> Zoom
                  </div>

                  <!-- Android Bottom Navigation Gesture Bar -->
                  <div class="absolute bottom-1.5 inset-x-0 flex justify-center pointer-events-none z-30">
                    <div class="w-24 h-1 bg-white/40 rounded-full"></div>
                  </div>
                </div>

                <!-- Navigation Slider Arrows -->
                ${images.length > 1 ? `
                  <button type="button" onclick="changeSlide('${id}', -1)" 
                          class="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950/80 hover:bg-cyan-500 hover:text-slate-950 text-white border border-slate-700/80 flex items-center justify-center text-[10px] transition shadow-xl z-20 backdrop-blur-sm">
                    <i class="fa-solid fa-chevron-left"></i>
                  </button>
                  <button type="button" onclick="changeSlide('${id}', 1)" 
                          class="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950/80 hover:bg-cyan-500 hover:text-slate-950 text-white border border-slate-700/80 flex items-center justify-center text-[10px] transition shadow-xl z-20 backdrop-blur-sm">
                    <i class="fa-solid fa-chevron-right"></i>
                  </button>
                ` : ''}

                <!-- Image Counter Badge -->
                <div class="absolute top-9 right-3 bg-slate-950/80 border border-slate-700/80 px-2 py-0.5 rounded-full text-[9px] text-cyan-300 font-mono z-20 backdrop-blur-sm">
                  <span id="slide-index-${id}">1</span>/${images.length}
                </div>

              </div>
            </div>
          </div>

          <!-- Project Details -->
          <div class="space-y-2 px-1">
            <div class="flex justify-between items-center text-[10px] font-mono">
              <span class="text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded font-bold uppercase">${category}</span>
              <span class="text-emerald-400 flex items-center gap-1"><i class="fa-solid fa-circle text-[7px]"></i>Production Live</span>
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
              ${(p.techStack || '').split(',').map(tag => tag.trim() ? `<span class="bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">${tag.trim()}</span>` : '').join('')}
            </div>
          </div>
        </div>

        <!-- Download APK / App Link Button -->
        <div class="pt-4 px-1">
          ${p.apkUrl ? `
            <a href="${p.apkUrl}" target="_blank" download class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20">
              <i class="fa-brands fa-android text-sm"></i> Download APK
            </a>
          ` : `
            <button onclick="viewActiveImage('${id}')" class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400 text-slate-300 hover:text-white font-bold text-xs transition">
              <i class="fa-solid fa-mobile-screen text-xs text-cyan-400"></i> View App Screenshots
            </button>
          `}
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
  if (imgEl) imgEl.src = state.images[state.currentIndex];
  if (counterEl) counterEl.innerText = state.currentIndex + 1;
};

window.viewActiveImage = function(projectId) {
  const state = projectSliderState[projectId];
  if (!state) return;

  const currentImgUrl = state.images[state.currentIndex];
  if (typeof openViewer === 'function') {
    openViewer(currentImgUrl, `${state.title} (${state.currentIndex + 1} of ${state.images.length})`);
  }
};

loadProfile();
loadProjects();
