document.addEventListener("DOMContentLoaded", () => {
  const taskInput = document.getElementById("task-input");
  const addTaskBtn = document.getElementById("add-task-btn");
  const tasklist = document.getElementById("task-list");
  const emptyImage = document.querySelector(".empty-image");
  const errorMessage = document.getElementById("error-message");
  const progressBar = document.getElementById("progress");
  const progressNumber = document.getElementById("number");

  const toggleEmptyState = () => {
    const hasTasks = tasklist.children.length > 0;
    emptyImage.style.display = hasTasks ? "none" : "block";
    tasklist.style.width = hasTasks ? "100%" : "0%";
  };
  const updateProgress = (checkCompletion = true) => {
    const totalTasks = tasklist.children.length;
    const completedTaskes = tasklist.querySelectorAll(".task-checkbox:checked",).length;

    progressBar.style.width = totalTasks? `${(completedTaskes / totalTasks) * 100}%` : "0%";
    progressNumber.textContent = `${completedTaskes} / ${totalTasks}`;
    if (checkCompletion && totalTasks > 0 && completedTaskes === totalTasks) {
      confettiOptions();
    }     
  };
const saveTasksToLocalStorage = () => {
    const tasks = [];
    tasklist.querySelectorAll("li").forEach((li) => {
      const text = li.querySelector(".task-text").textContent;
      const completed = li.querySelector(".task-checkbox").checked;
      tasks.push({ text, completed });
    });
    localStorage.setItem("tasks", JSON.stringify(tasks));
};
const loadTasksFromLocalStorage = () => {
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.forEach((task) => addTask(task.text, task.completed, false));
    toggleEmptyState();
    updateProgress();
};
  const addTask = (text, completed = false, checkCompletion = true) => {
    const taskText = text || taskInput.value.trim();
    if (!taskText) {
      errorMessage.textContent = "Please enter a task.";
      errorMessage.style.display = "block";
      return;
    }
    taskInput.value = "";
    errorMessage.style.display = "none";
    const li = document.createElement("li");
    li.innerHTML = ` 
        <input type="checkbox" class="task-checkbox" ${completed ? "checked" : ""}>
        <span class="task-text">${taskText}</span>
        <div class="task-buttons">
          <button class="edit-btn"><i class="fas fa-edit"></i></button>
          <button class="delete-btn"><i class="fas fa-trash"></i></button>
        </div>
        `;
    const checkbox = li.querySelector(".task-checkbox");
    const editBtn = li.querySelector(".edit-btn");
    if (completed) {
      li.classList.add("completed");
      editBtn.disabled = true;
      editBtn.style.opacity = "0.5";
      editBtn.style.pointerEvents = "none";
    }
    checkbox.addEventListener("change", () => {
      const isChecked = checkbox.checked;
      li.classList.toggle("completed", isChecked);
      editBtn.disabled = isChecked;
      editBtn.style.opacity = isChecked ? "0.5" : "1";
      editBtn.style.pointerEvents = isChecked ? "none" : "auto";
      updateProgress();
      saveTasksToLocalStorage();
    });
    editBtn.addEventListener("click", () => {
      if (!checkbox.checked) {
        taskInput.value = li.querySelector("span").textContent;
        li.remove();
        toggleEmptyState();
        updateProgress(false);
        saveTasksToLocalStorage();
      }
    });

    li.querySelector(".delete-btn").addEventListener("click", () => {
      li.remove();
      toggleEmptyState();
      updateProgress();
      saveTasksToLocalStorage();
    });
    tasklist.appendChild(li);
    taskInput.value = "";
    toggleEmptyState();
    updateProgress(checkCompletion);
    saveTasksToLocalStorage();
  };
  addTaskBtn.addEventListener("click", () => addTask());
  taskInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addTask();
    }
  });
  loadTasksFromLocalStorage();
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