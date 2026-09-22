// app.js
import { db } from "./firebase-config.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

async function loadProfile() {
  try {
    const profileRef = doc(db, "portfolio", "profile");
    const docSnap = await getDoc(profileRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if(data.name) document.getElementById('hero-name').innerText = data.name;
      if(data.title) document.getElementById('hero-title').innerText = data.title;
      if(data.about) document.getElementById('hero-about').innerText = data.about;
      if(data.profileUrl) document.getElementById('profile-img').src = data.profileUrl;

      // Skills
      const skillsContainer = document.getElementById('skills-list');
      skillsContainer.innerHTML = '';
      if(data.skills) {
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
        ${data.email ? `<a href="mailto:${data.email}" class="px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400 text-sm"><i class="fa-solid fa-envelope mr-2 text-cyan-400"></i>${data.email}</a>` : ''}
        ${data.whatsapp ? `<a href="https://wa.me/${data.whatsapp}" target="_blank" class="px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-400 text-sm"><i class="fa-brands fa-whatsapp mr-2 text-emerald-400"></i>WhatsApp</a>` : ''}
        ${data.github ? `<a href="${data.github}" target="_blank" class="px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-white text-sm"><i class="fa-brands fa-github mr-2"></i>GitHub</a>` : ''}
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

    snapshot.forEach(docSnap => {
      const p = docSnap.data();
      const firstImg = (p.images && p.images.length > 0) ? p.images[0] : 'https://via.placeholder.com/600x400';
      
      const card = document.createElement('div');
      card.className = "bg-slate-900/60 rounded-2xl overflow-hidden neon-border flex flex-col justify-between";
      card.innerHTML = `
        <div>
          <img src="${firstImg}" class="w-full h-48 object-cover cursor-pointer" onclick='openModal(${JSON.stringify(p.images || [])}, "${p.title}")' alt="${p.title}">
          <div class="p-6">
            <h4 class="text-xl font-bold mb-2 text-white">${p.title}</h4>
            <p class="text-slate-400 text-sm mb-4 line-clamp-3">${p.description}</p>
            <div class="flex flex-wrap gap-1.5 mb-4">
              ${(p.techStack || '').split(',').map(tag => `<span class="text-xs bg-slate-800 px-2 py-1 rounded text-cyan-400">${tag.trim()}</span>`).join('')}
            </div>
          </div>
        </div>
        <div class="p-6 pt-0 flex gap-3">
          ${p.apkUrl ? `<a href="${p.apkUrl}" download class="flex-1 text-center py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-sm transition"><i class="fa-brands fa-android mr-1"></i> Download APK</a>` : ''}
          ${p.images && p.images.length > 0 ? `<button onclick='openModal(${JSON.stringify(p.images)}, "${p.title}")' class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm"><i class="fa-solid fa-images"></i> (${p.images.length})</button>` : ''}
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Projects load error:", err);
  }
}

window.openModal = function(images, title) {
  const modal = document.getElementById('gallery-modal');
  const modalImages = document.getElementById('modal-images');
  document.getElementById('modal-title').innerText = title + " - App Screenshots";
  modalImages.innerHTML = '';

  images.forEach(url => {
    const img = document.createElement('img');
    img.src = url;
    img.className = "h-72 w-auto object-cover rounded-xl border border-slate-700 hover:scale-105 transition duration-300";
    modalImages.appendChild(img);
  });

  modal.classList.remove('hidden');
  modal.classList.add('flex');
};

loadProfile();
loadProjects();