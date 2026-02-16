import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCC4EyZh_q-c1qAh-vgS0_PVG4lJFPIhEI",
  authDomain: "progress-bar-todo-list-dynamic.firebaseapp.com",
  projectId: "progress-bar-todo-list-dynamic",
  storageBucket: "progress-bar-todo-list-dynamic.appspot.com",
  messagingSenderId: "575737944981",
  appId: "1:575737944981:web:b6b54008bbbe4b89a1b49c",
  measurementId: "G-WWLBSP63MG",
};

// Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  const taskInput = document.getElementById("task-input");
  const addTaskBtn = document.getElementById("add-task-btn");
  const tasklist = document.getElementById("task-list");
  const emptyImage = document.querySelector(".empty-image");
  const errorMessage = document.getElementById("error-message");
  const progressBar = document.getElementById("progress");
  const progressNumber = document.getElementById("number");
  const completedMessage = document.getElementById("completed-message");

  const toggleEmptyState = () => {
    const hasTasks = tasklist.children.length > 0;
    emptyImage.style.display = hasTasks ? "none" : "block";
    tasklist.style.width = hasTasks ? "100%" : "0%";
  };

  const updateProgress = (checkCompletion = true) => {
    const totalTasks = tasklist.children.length;
    const completedTasks = tasklist.querySelectorAll(
      ".task-checkbox:checked",
    ).length;

    progressBar.style.width = totalTasks
      ? `${(completedTasks / totalTasks) * 100}%`
      : "0%";
    progressNumber.textContent = `${completedTasks} / ${totalTasks}`;

    if (checkCompletion && totalTasks > 0 && completedTasks === totalTasks) {
      confettiOptions();
      completedMessage.textContent = "Congratulations! All tasks completed!";
      completedMessage.classList.add("show");
      setTimeout(() => {
        completedMessage.classList.remove("show");
        completedMessage.textContent = "";
      }, 3000);
    }
  };

  // --- FIREBASE: Data Load kora ---
  const loadTasksFromFirebase = async () => {
    try {
      // console.log("loadTasksFromFirebase: currentUser =", auth?.currentUser);
      tasklist.innerHTML = ""; // Purono list clear kora
      const q = query(collection(db, "tasks"), orderBy("createdAt", "asc"));
      let querySnapshot = await getDocs(q);
      // console.log(
      //   "loadTasksFromFirebase: ordered query returned",
      //   querySnapshot.size,
      //   "docs",
      // );

      // Fallback: if nothing returned with orderBy, try without ordering
      if (!querySnapshot.size) {
        console.log(
          "No documents returned with orderBy(createdAt). Trying without orderBy.",
        );
        querySnapshot = await getDocs(collection(db, "tasks"));
        console.log(
          "loadTasksFromFirebase: fallback query returned",
          querySnapshot.size,
          "docs",
        );
      }

      querySnapshot.docs.reverse().forEach((docSnap) => {
        const data = docSnap.data() || {};
        // console.log("doc:", docSnap.id, data);
        const li = renderTask(data.text || "(no text)", !!data.completed, docSnap.id);
        tasklist.appendChild(li);
      });
      toggleEmptyState();
      updateProgress(false);
    } catch (err) {
      // console.error("loadTasksFromFirebase error:", err);
    }
  };
  const auth = getAuth(app);

  // --- UI: Screen e Task dekhano ---
  const renderTask = (text, completed, id) => {
    const li = document.createElement("li");
    li.setAttribute("data-id", id);
    if (completed) li.classList.add("completed");

    li.innerHTML = ` 
          <input type="checkbox" class="task-checkbox" ${completed ? "checked" : ""}>
          <span class="task-text">${text}</span>
          <div class="task-buttons">
            <button class="edit-btn"><i class="fas fa-edit"></i></button>
            <button class="delete-btn"><i class="fas fa-trash"></i></button>
          </div>
      `;

    const checkbox = li.querySelector(".task-checkbox");
    const editBtn = li.querySelector(".edit-btn");
    const deleteBtn = li.querySelector(".delete-btn");

    // Ensure initial UI matches `completed` state on render/reload
    checkbox.checked = !!completed;
    editBtn.disabled = !!completed;
    editBtn.classList.toggle('isChecked', !!completed);

    // Checkbox update in Firebase
    checkbox.addEventListener("change", async () => {
      const isChecked = checkbox.checked;
      li.classList.toggle("completed", isChecked);
      editBtn.disabled = isChecked;
      editBtn.classList.toggle("isChecked", isChecked);

      const taskRef = doc(db, "tasks", id);
      await updateDoc(taskRef, { completed: isChecked });
      updateProgress();
    });

    // Delete from Firebase
    deleteBtn.addEventListener("click", async () => {
      await deleteDoc(doc(db, "tasks", id));
      li.remove();
      toggleEmptyState();
      updateProgress();
    });

    // Edit logic
    editBtn.addEventListener("click", () => {
      taskInput.value = text;
      deleteBtn.click(); // Delete old, save as new later
    });

    return li;
  };

  // --- FIREBASE: Notun Task Add kora ---
  const addTask = async () => {
    const taskText = taskInput.value.trim();
    if (!taskText) {
      errorMessage.textContent = "Please enter a task.";
      errorMessage.style.display = "block";
      errorMessage.classList.add("show");
      setTimeout(() => {
        errorMessage.classList.remove("show");
      }, 2000);
      return;
    }

    const docRef = await addDoc(collection(db, "tasks"), {
      text: taskText,
      completed: false,
      createdAt: serverTimestamp(),
    });

    const li = renderTask(taskText, false, docRef.id);
    tasklist.prepend(li);
    taskInput.value = "";
    toggleEmptyState();
    updateProgress();
  };

  addTaskBtn.addEventListener("click", addTask);
  taskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTask();
    }
  });

  // Sign in anonymously so Firestore requests are authenticated.
  // Make sure your Firestore rules allow authenticated reads/writes
  // (example rule: `allow read, write: if request.auth != null;`).
  signInAnonymously(auth).catch((err) => {
    console.error("Auth sign-in failed:", err);
  });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      // console.log("Signed in anonymously as", user.uid);
      loadTasksFromFirebase(); // now safe to access Firestore
    } else {
      console.log("No auth user");
    }
  });
});

const confettiOptions = () => {
  const defaults = {
    spread: 360,
    ticks: 100,
    gravity: 0,
    decay: 0.94,
    startVelocity: 30,
    shapes: ["heart"],
    colors: ["FFC0CB", "FF69B4", "FF1493", "C71585"],
  };

  confetti({
    ...defaults,
    particleCount: 50,
    scalar: 2,
  });

  confetti({
    ...defaults,
    particleCount: 25,
    scalar: 3,
  });

  confetti({
    ...defaults,
    particleCount: 10,
    scalar: 4,
  });
};
