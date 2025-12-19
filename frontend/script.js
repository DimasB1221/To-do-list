// --- Constants & State ---
const TASKS_KEY = "mission4_tasks";
const PROFILE_KEY = "mission4_profile";

let tasks = [];
let userProfile = {
  name: "",
  job: "",
};

// --- DOM Elements ---
const dateElement = document.getElementById("current-date");
const dayElement = document.getElementById("current-day");
const taskInput = document.getElementById("task-input");
const submitBtn = document.getElementById("submit-btn");
const todoList = document.getElementById("todo-list");
const doneList = document.getElementById("done-list");
const todoCount = document.getElementById("todo-count");
const doneCount = document.getElementById("done-count");
const deleteAllBtn = document.getElementById("delete-all-btn");

const profileName = document.getElementById("user-name");
const profileJob = document.getElementById("user-job");
const profileModal = document.getElementById("profile-modal");
const modalNameInput = document.getElementById("modal-name");
const modalJobInput = document.getElementById("modal-job");
const saveProfileBtn = document.getElementById("save-profile-btn");
const editProfileBtn = document.getElementById("edit-profile-btn");

// --- Initialization ---
function init() {
  loadDate();
  loadProfile();
  loadTasks();
  renderTasks();
}

function loadDate() {
  const now = new Date();
  const options = { year: "numeric", month: "long", day: "numeric" };
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });

  dayElement.textContent = dayName;
  dateElement.textContent = now.toLocaleDateString("en-US", options);
}

// --- Profile Management ---
function loadProfile() {
  const storedProfile = localStorage.getItem(PROFILE_KEY);
  if (storedProfile) {
    userProfile = JSON.parse(storedProfile);
    updateProfileUI();
  } else {
    // Show modal if no profile exists
    profileModal.classList.remove("hidden");
  }
}

function updateProfileUI() {
  profileName.textContent = userProfile.name || "Guest";
  profileJob.textContent = userProfile.job || "Dreamer";
}

function saveProfile() {
  const name = modalNameInput.value.trim();
  const job = modalJobInput.value.trim();

  if (name) {
    userProfile = { name, job };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
    updateProfileUI();
    profileModal.classList.add("hidden");
  } else {
    alert("Please enter at least your name!");
  }
}

// --- Task Management ---
function loadTasks() {
  const storedTasks = localStorage.getItem(TASKS_KEY);
  if (storedTasks) {
    tasks = JSON.parse(storedTasks);
  }
}

function saveTasks() {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  renderTasks();
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) {
    alert("Please write something before adding!");
    return;
  }

  const priorityInput = document.querySelector(
    'input[name="priority"]:checked'
  );
  const priority = priorityInput ? priorityInput.value : "low";

  // Create new task object
  const newTask = {
    id: Date.now(),
    text: text,
    priority: priority,
    isDone: false,
    createdAt: new Date().toISOString(), // Store ISO date for comparison
  };

  tasks.unshift(newTask); // Add to top
  saveTasks();

  // Reset input
  taskInput.value = "";
}

function toggleTask(id) {
  const taskIndex = tasks.findIndex((t) => t.id === id);
  if (taskIndex > -1) {
    tasks[taskIndex].isDone = !tasks[taskIndex].isDone;
    // If done, move to bottom of its list (optional, but good UX)
    // For now just re-saving will trigger re-render which sorts by standard logic if we implemented sorting
    saveTasks();
  }
}

function deleteTask(id) {
  if (confirm("Are you sure you want to delete this task?")) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
  }
}

function deleteAll() {
  if (tasks.length === 0) return;

  if (confirm("Warning: This will delete ALL tasks. Are you sure?")) {
    tasks = [];
    saveTasks();
  }
}

function isOverdue(isoString) {
  const createdDate = new Date(isoString);
  const today = new Date();

  // Reset hours to compare just the calendar day
  createdDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  // If created before today, it's overdue (simple logic)
  return createdDate < today;
}

// --- Rendering ---
function renderTasks() {
  // Clear lists
  todoList.innerHTML = "";
  doneList.innerHTML = "";

  let todoCountVal = 0;
  let doneCountVal = 0;

  tasks.forEach((task) => {
    const taskEl = createTaskElement(task);

    if (task.isDone) {
      doneList.appendChild(taskEl);
      doneCountVal++;
    } else {
      todoList.appendChild(taskEl);
      todoCountVal++;
    }
  });

  // Update counts
  todoCount.textContent = todoCountVal;
  doneCount.textContent = doneCountVal;

  // Show empty state if no todos
  if (todoCountVal === 0) {
    todoList.innerHTML = `
            <div class="empty-state">
                <i class="ph ph-list-checks"></i>
                <p>No tasks yet. Start by adding one!</p>
            </div>
        `;
  }
}

function createTaskElement(task) {
  const el = document.createElement("div");
  el.className = "task-card";
  el.setAttribute("data-priority", task.priority);

  // Check overdue
  if (!task.isDone && task.createdAt && isOverdue(task.createdAt)) {
    el.classList.add("overdue");
  }

  const displayDate = new Date(task.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  el.innerHTML = `
        <div class="task-checkbox-wrapper">
            <input type="checkbox" class="task-checkbox" 
                ${task.isDone ? "checked" : ""} 
                onchange="toggleTask(${task.id})">
        </div>
        <div class="task-content">
            <p class="task-text">${escapeHtml(task.text)}</p>
            <div class="task-meta">
                <span class="prio-badge ${task.priority}">${
    task.priority
  }</span>
                <span class="task-date"><i class="ph ph-calendar-blank"></i> ${displayDate}</span>
                ${
                  el.classList.contains("overdue")
                    ? '<span style="color:var(--danger-color); font-weight:bold;">(Late)</span>'
                    : ""
                }
            </div>
        </div>
        <button class="delete-task-btn" onclick="deleteTask(${task.id})">
            <i class="ph ph-trash"></i>
        </button>
    `;

  return el;
}

// Helper to prevent XSS
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// --- Event Listeners ---
submitBtn.addEventListener("click", addTask);
deleteAllBtn.addEventListener("click", deleteAll);
saveProfileBtn.addEventListener("click", saveProfile);
editProfileBtn.addEventListener("click", () => {
  modalNameInput.value = userProfile.name;
  modalJobInput.value = userProfile.job;
  profileModal.classList.remove("hidden");
});

// Run
document.addEventListener("DOMContentLoaded", init);
