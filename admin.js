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

// Cache for loaded projects
let projectsCache = {};

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

// ImgBB Upload
async function uploadToImgBB(file) {
  const apiKey = "2d8f6f592237eb3b723528f117c76882";
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: formData
  });
  const data = await res.json();
  if (data.success) return data.data.url;
  throw new Error("Image upload failed");
}

// Display selected Profile image file name
document.getElementById('prof-image-file').addEventListener('change', (e) => {
  const label = document.getElementById('prof-file-name');
  if (e.target.files.length > 0) {
    label.innerText = `Selected: ${e.target.files[0].name}`;
    label.classList.remove('italic', 'text-slate-400');
    label.classList.add('text-emerald-400');
  } else {
    label.innerText = 'No file selected';
    label.classList.remove('text-emerald-400');
    label.classList.add('italic', 'text-slate-400');
  }
});

// Display selected Project screenshots file names
document.getElementById('proj-images').addEventListener('change', (e) => {
  const container = document.getElementById('proj-files-container');
  container.innerHTML = '';
  const files = Array.from(e.target.files).slice(0, 20);

  if (files.length === 0) {
    container.innerHTML = '<span class="italic text-slate-500">No files selected</span>';
    return;
  }

  files.forEach(file => {
    const badge = document.createElement('span');
    badge.className = 'px-2.5 py-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded-lg text-xs truncate max-w-[200px]';
    badge.innerText = file.name;
    container.appendChild(badge);
  });
});

// Load profile data
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
    }
  } catch (err) {
    console.error("Error loading profile:", err);
  }
}

// Save Profile Form
document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const status = document.getElementById('profile-status');
  status.innerText = "Saving profile...";

  try {
    const fileInput = document.getElementById('prof-image-file');
    let profileUrl = null;

    if (fileInput.files.length > 0) {
      status.innerText = "Uploading image...";
      profileUrl = await uploadToImgBB(fileInput.files[0]);
    }

    const profileData = {
      name: document.getElementById('prof-name').value,
      title: document.getElementById('prof-title').value,
      about: document.getElementById('prof-about').value,
      skills: document.getElementById('prof-skills').value,
      email: document.getElementById('prof-email').value,
      whatsapp: document.getElementById('prof-whatsapp').value,
      github: document.getElementById('prof-github').value,
    };
    if (profileUrl) profileData.profileUrl = profileUrl;

    await setDoc(doc(db, "portfolio", "profile"), profileData, { merge: true });
    status.innerText = "Profile updated successfully!";
    setTimeout(() => { status.innerText = ''; }, 3000);
  } catch (err) {
    status.innerText = "Error: " + err.message;
  }
});

// Realtime Listener for vertical left sidebar projects
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
          <p class="text-xs text-slate-500 truncate">${p.techStack || 'No tech specified'}</p>
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

// Global Edit Handler
window.editProject = function(id) {
  const p = projectsCache[id];
  if (!p) return;

  document.getElementById('editing-proj-id').value = id;
  document.getElementById('proj-title').value = p.title || '';
  document.getElementById('proj-desc').value = p.description || '';
  document.getElementById('proj-tech').value = p.techStack || '';
  document.getElementById('proj-apk-link').value = p.apkUrl || '';

  // Update UI State for Edit Mode
  document.getElementById('project-form-heading').innerText = "Edit Project";
  document.getElementById('proj-submit-btn').innerText = "Save Changes";
  document.getElementById('cancel-edit-btn').classList.remove('hidden');

  const container = document.getElementById('proj-files-container');
  if (p.images && p.images.length > 0) {
    container.innerHTML = `<span class="text-xs text-cyan-400">${p.images.length} existing screenshot(s) preserved. Choose new to replace.</span>`;
  } else {
    container.innerHTML = '<span class="italic text-slate-500">No images attached</span>';
  }

  window.scrollTo({ top: document.getElementById('project-form').offsetTop - 100, behavior: 'smooth' });
};

// Global Delete Handler
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

// Cancel Edit Button
document.getElementById('cancel-edit-btn').addEventListener('click', resetProjectForm);

function resetProjectForm() {
  document.getElementById('editing-proj-id').value = '';
  document.getElementById('project-form').reset();
  document.getElementById('project-form-heading').innerText = "Add New Android Project";
  document.getElementById('proj-submit-btn').innerText = "Upload Project";
  document.getElementById('cancel-edit-btn').classList.add('hidden');
  document.getElementById('proj-files-container').innerHTML = '<span class="italic text-slate-500">No files selected</span>';
  document.getElementById('upload-status').innerText = '';
}

// Upload / Update Project Submit Handler
document.getElementById('project-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const status = document.getElementById('upload-status');
  const editId = document.getElementById('editing-proj-id').value;
  const isEditing = Boolean(editId);

  status.innerText = "Processing...";

  try {
    const imageFiles = document.getElementById('proj-images').files;
    let finalImages = isEditing && projectsCache[editId]?.images ? [...projectsCache[editId].images] : [];

    // If new images were selected, upload them
    if (imageFiles.length > 0) {
      finalImages = [];
      const maxFiles = Math.min(imageFiles.length, 20);
      for (let i = 0; i < maxFiles; i++) {
        status.innerText = `Uploading image ${i + 1} of ${maxFiles}...`;
        const url = await uploadToImgBB(imageFiles[i]);
        finalImages.push(url);
      }
    }

    const payload = {
      title: document.getElementById('proj-title').value,
      description: document.getElementById('proj-desc').value,
      techStack: document.getElementById('proj-tech').value,
      apkUrl: document.getElementById('proj-apk-link').value,
      images: finalImages,
      updatedAt: new Date()
    };

    if (isEditing) {
      status.innerText = "Saving changes...";
      await updateDoc(doc(db, "projects", editId), payload);
      status.innerText = "Project updated successfully!";
    } else {
      status.innerText = "Saving new project...";
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
