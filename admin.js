// admin.js
import { db, auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let projectsCache = {};
let currentProjectImages = [];
let croppedProfileDataUrl = null;
let cropperInstance = null;

// Auth check
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = 'login.html';
  } else {
    loadExistingProfile();
    listenToProjects();
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  signOut(auth).then(() => window.location.href = 'login.html');
});

// Auto-compress & Resize Image (Firestore 1MB limit bypass)
function compressAndConvertImage(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/* IMAGE VIEWER MODAL */
window.openImageViewer = function(url) {
  const modal = document.getElementById('image-viewer-modal');
  document.getElementById('modal-full-img').src = url;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
};

window.closeImageViewer = function() {
  const modal = document.getElementById('image-viewer-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
};

/* PROFILE DP CROPPING */
const profFileInput = document.getElementById('prof-image-file');
const cropperImg = document.getElementById('cropper-image');
const cropModal = document.getElementById('crop-modal');

document.getElementById('prof-preview-container').addEventListener('click', () => {
  profFileInput.click();
});

profFileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files.length > 0) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      openCropper(event.target.result);
    };
    reader.readAsDataURL(file);
  }
});

function openCropper(imageSrc) {
  cropperImg.src = imageSrc;
  cropModal.classList.remove('hidden');
  cropModal.classList.add('flex');

  if (cropperInstance) cropperInstance.destroy();

  cropperInstance = new Cropper(cropperImg, {
    aspectRatio: 1,
    viewMode: 2,
    autoCropArea: 0.9,
    responsive: true
  });
}

window.closeCropModal = function() {
  cropModal.classList.add('hidden');
  cropModal.classList.remove('flex');
  if (cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
  }
  profFileInput.value = '';
};

document.getElementById('apply-crop-btn').addEventListener('click', () => {
  if (!cropperInstance) return;

  const canvas = cropperInstance.getCroppedCanvas({
    width: 250,
    height: 250
  });

  croppedProfileDataUrl = canvas.toDataURL('image/jpeg', 0.8);
  document.getElementById('prof-preview-img').src = croppedProfileDataUrl;
  closeCropModal();
});

// Load Profile
async function loadExistingProfile() {
  try {
    const snap = await getDoc(doc(db, "portfolio", "profile"));
    if (snap.exists()) {
      const d = snap.data();
      document.getElementById('prof-name').value = d.name || '';
      document.getElementById('prof-title').value = d.title || '';
      document.getElementById('prof-about').value = d.about || '';
      document.getElementById('prof-skills').value = d.skills || '';
      document.getElementById('prof-email').value = d.email || '';
      document.getElementById('prof-whatsapp').value = d.whatsapp || '';
      document.getElementById('prof-github').value = d.github || '';
      if (document.getElementById('prof-linkedin')) {
        document.getElementById('prof-linkedin').value = d.linkedin || '';
      }
      if (d.profileUrl) {
        document.getElementById('prof-preview-img').src = d.profileUrl;
      }
    }
  } catch (err) {
    console.error("Profile load error:", err);
  }
}

// Save Profile
document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const status = document.getElementById('profile-status');
  status.innerText = "Saving profile...";

  try {
    const profileData = {
      name: document.getElementById('prof-name').value,
      title: document.getElementById('prof-title').value,
      about: document.getElementById('prof-about').value,
      skills: document.getElementById('prof-skills').value,
      email: document.getElementById('prof-email').value,
      whatsapp: document.getElementById('prof-whatsapp').value,
      github: document.getElementById('prof-github').value,
      linkedin: document.getElementById('prof-linkedin') ? document.getElementById('prof-linkedin').value : '',
    };

    if (croppedProfileDataUrl) {
      profileData.profileUrl = croppedProfileDataUrl;
    }

    await setDoc(doc(db, "portfolio", "profile"), profileData, { merge: true });
    status.innerText = "Profile updated successfully!";
    setTimeout(() => { status.innerText = ''; }, 3000);
  } catch (err) {
    status.innerText = "Error: " + err.message;
  }
});

/* PROJECT SCREENSHOTS GRID (150x150) */
const projImagesInput = document.getElementById('proj-images');

projImagesInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);
  const status = document.getElementById('upload-status');
  status.innerText = "Optimizing images...";

  for (let i = 0; i < files.length; i++) {
    const compressedUrl = await compressAndConvertImage(files[i], 800, 0.7);
    currentProjectImages.push({
      type: 'base64',
      url: compressedUrl
    });
  }
  
  status.innerText = "";
  renderProjectScreenshots();
  projImagesInput.value = '';
});

function renderProjectScreenshots() {
  const grid = document.getElementById('proj-images-grid');
  grid.innerHTML = '';

  if (currentProjectImages.length === 0) {
    grid.innerHTML = '<p id="no-images-placeholder" class="text-xs text-slate-500 m-auto">No screenshots selected yet.</p>';
    return;
  }

  currentProjectImages.forEach((imgObj, index) => {
    const box = document.createElement('div');
    box.className = "relative group w-[150px] h-[150px] rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-md flex-shrink-0 cursor-pointer";

    box.innerHTML = `
      <img src="${imgObj.url}" alt="Screenshot" class="w-full h-full object-cover transition duration-300 group-hover:scale-105">
      <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
        <span class="text-xs text-white font-medium bg-black/60 px-2 py-1 rounded-md"><i class="fa-solid fa-eye mr-1"></i> View</span>
      </div>
      <button type="button" class="delete-btn absolute top-2 right-2 w-7 h-7 bg-red-600/90 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-xs shadow-lg transition z-10" title="Delete image">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    box.addEventListener('click', (e) => {
      if (!e.target.closest('.delete-btn')) {
        openImageViewer(imgObj.url);
      }
    });

    box.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      currentProjectImages.splice(index, 1);
      renderProjectScreenshots();
    });

    grid.appendChild(box);
  });
}

/* VERTICAL PROJECTS LIST */
function listenToProjects() {
  const listEl = document.getElementById('admin-projects-list');
  const countBadge = document.getElementById('project-count');

  onSnapshot(collection(db, "projects"), (snapshot) => {
    listEl.innerHTML = '';
    projectsCache = {};
    countBadge.innerText = snapshot.size;

    if (snapshot.empty) {
      listEl.innerHTML = '<p class="text-xs text-slate-500 text-center py-6">No projects uploaded yet.</p>';
      return;
    }

    snapshot.forEach((docSnap) => {
      const p = docSnap.data();
      const id = docSnap.id;
      projectsCache[id] = p;

      const item = document.createElement('div');
      item.className = "p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between gap-3";
      item.innerHTML = `
        <div class="min-w-0 flex-1">
          <h4 class="text-sm font-semibold text-white truncate">${p.title}</h4>
          <p class="text-xs text-slate-500 truncate">${p.category ? p.category.toUpperCase() : 'APP'} &bull; ${p.techStack || 'No tech specified'}</p>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button onclick="editProject('${id}')" class="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-xs transition" title="Edit">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button onclick="deleteProject('${id}')" class="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs transition" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `;
      listEl.appendChild(item);
    });
  });
}

window.editProject = function(id) {
  const p = projectsCache[id];
  if (!p) return;

  document.getElementById('editing-proj-id').value = id;
  document.getElementById('proj-title').value = p.title || '';
  document.getElementById('proj-category').value = p.category || 'fintech';
  document.getElementById('proj-desc').value = p.description || '';
  document.getElementById('proj-tech').value = p.techStack || '';
  document.getElementById('proj-apk-link').value = p.apkUrl || '';

  document.getElementById('project-form-heading').innerText = "Edit Project";
  document.getElementById('proj-submit-btn').innerText = "Save Changes";
  document.getElementById('cancel-edit-btn').classList.remove('hidden');

  currentProjectImages = (p.images || []).map(url => ({
    type: 'base64',
    url: url
  }));
  renderProjectScreenshots();

  window.scrollTo({ top: document.getElementById('project-form').offsetTop - 100, behavior: 'smooth' });
};

window.deleteProject = async function(id) {
  if (confirm("Are you sure you want to delete this project?")) {
    try {
      await deleteDoc(doc(db, "projects", id));
      if (document.getElementById('editing-proj-id').value === id) {
        resetProjectForm();
      }
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  }
};

document.getElementById('cancel-edit-btn').addEventListener('click', resetProjectForm);

function resetProjectForm() {
  document.getElementById('editing-proj-id').value = '';
  document.getElementById('project-form').reset();
  document.getElementById('project-form-heading').innerText = "Add New Android Project";
  document.getElementById('proj-submit-btn').innerText = "Upload Project";
  document.getElementById('cancel-edit-btn').classList.add('hidden');
  currentProjectImages = [];
  renderProjectScreenshots();
  document.getElementById('upload-status').innerText = '';
}

// Project Submit (Instant Lightweight Save)
document.getElementById('project-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const status = document.getElementById('upload-status');
  const editId = document.getElementById('editing-proj-id').value;
  const isEditing = Boolean(editId);

  status.innerText = "Saving project...";

  try {
    const finalImageUrls = currentProjectImages.map(item => item.url);

    const payload = {
      title: document.getElementById('proj-title').value,
      category: document.getElementById('proj-category').value,
      description: document.getElementById('proj-desc').value,
      techStack: document.getElementById('proj-tech').value,
      apkUrl: document.getElementById('proj-apk-link').value,
      images: finalImageUrls,
      updatedAt: new Date()
    };

    if (isEditing) {
      await updateDoc(doc(db, "projects", editId), payload);
      status.innerText = "Project updated successfully!";
    } else {
      payload.createdAt = new Date();
      await addDoc(collection(db, "projects"), payload);
      status.innerText = "Project uploaded successfully!";
    }

    setTimeout(() => {
      resetProjectForm();
    }, 1500);

  } catch (err) {
    status.innerText = "Operation failed: " + err.message;
  }
});
