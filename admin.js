// admin.js
import { db, auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Check Login State
onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = 'login.html';
  else loadExistingProfile();
});

document.getElementById('logout-btn').addEventListener('click', () => {
  signOut(auth).then(() => window.location.href = 'login.html');
});

// Helper: Free ImgBB Upload Function
async function uploadToImgBB(file) {
  const apiKey = "2d8f6f592237eb3b723528f117c76882"; // Public ImgBB API key
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

// Load current profile
async function loadExistingProfile() {
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
}

// Save Profile
document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const status = document.getElementById('profile-status');
  status.innerText = "Saving profile...";

  try {
    const fileInput = document.getElementById('prof-image-file');
    let profileUrl = null;

    if (fileInput.files.length > 0) {
      status.innerText = "Uploading profile image...";
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
  } catch (err) {
    status.innerText = "Error: " + err.message;
  }
});

// Upload Android Project
document.getElementById('project-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const status = document.getElementById('upload-status');
  status.innerText = "Uploading screenshots, please wait...";

  try {
    const imageFiles = document.getElementById('proj-images').files;
    let imageUrls = [];
    const maxFiles = Math.min(imageFiles.length, 20);

    for (let i = 0; i < maxFiles; i++) {
      status.innerText = `Uploading image ${i + 1} of ${maxFiles}...`;
      const url = await uploadToImgBB(imageFiles[i]);
      imageUrls.push(url);
    }

    status.innerText = "Saving project details...";
    await addDoc(collection(db, "projects"), {
      title: document.getElementById('proj-title').value,
      description: document.getElementById('proj-desc').value,
      techStack: document.getElementById('proj-tech').value,
      apkUrl: document.getElementById('proj-apk-link').value,
      images: imageUrls,
      createdAt: new Date()
    });

    status.innerText = "Project uploaded successfully!";
    document.getElementById('project-form').reset();
  } catch (err) {
    status.innerText = "Upload failed: " + err.message;
  }
});