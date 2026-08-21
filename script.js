// LocalStorage Keys
const STORAGE_KEY_TASKS = 'student_planner_tasks';
const STORAGE_KEY_USER = 'student_planner_user';

// State Variables
let tasks = [];
let currentFilter = 'all';
let editingTaskId = null;
let isReadingMode = false;

// DOM Elements
const studentNameInput = document.getElementById('student-name-input');
const continueBtn = document.getElementById('continue-btn');
const welcomeInputContainer = document.getElementById('welcome-input-container');
const welcomeBanner = document.getElementById('welcome-banner');
const welcomeMessage = document.getElementById('welcome-message');
const welcomeError = document.getElementById('welcome-error');

const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title');
const taskSubjectInput = document.getElementById('task-subject');
const taskError = document.getElementById('task-error');
const formTitle = document.getElementById('form-title');
const saveTaskBtn = document.getElementById('save-task-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const taskListContainer = document.getElementById('task-list');

const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const filterButtons = document.querySelectorAll('.filter-btn');

const paraCountBadge = document.getElementById('para-count-badge');
const readingModeBtn = document.getElementById('reading-mode-btn');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  loadUserData();
  loadTasksData();
  setupEventListeners();
  updateParagraphCount();
});

// --- Event Listeners Setup ---
function setupEventListeners() {
  // Student Welcome
  continueBtn.addEventListener('click', handleWelcomeSubmit);

  // Task Form Submit (Add/Edit)
  taskForm.addEventListener('submit', handleTaskFormSubmit);
  cancelEditBtn.addEventListener('click', resetTaskForm);

  // Tab Navigation
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Task Filters
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
  });

  // Reading Mode
  readingModeBtn.addEventListener('click', toggleReadingMode);
}

// --- 1. Student Welcome Module ---
function loadUserData() {
  const savedName = localStorage.getItem(STORAGE_KEY_USER);
  if (savedName) {
    displayWelcomeBanner(savedName);
  }
}

function handleWelcomeSubmit() {
  const nameValue = studentNameInput.value.trim();
  if (!nameValue) {
    welcomeError.textContent = 'Please enter your name to continue.';
    return;
  }
  welcomeError.textContent = '';
  localStorage.setItem(STORAGE_KEY_USER, nameValue);
  displayWelcomeBanner(nameValue);
  studentNameInput.value = '';
}

function displayWelcomeBanner(name) {
  welcomeInputContainer.classList.add('hidden');
  welcomeMessage.textContent = `Welcome, ${name}!`;
  welcomeBanner.classList.remove('hidden');
}

// --- 2 to 6. Task Management & Storage ---
function loadTasksData() {
  const storedTasks = localStorage.getItem(STORAGE_KEY_TASKS);
  tasks = storedTasks ? JSON.parse(storedTasks) : [];
  renderTasks();
}

function saveTasksData() {
  localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
}

function handleTaskFormSubmit(e) {
  e.preventDefault();
  const title = taskTitleInput.value.trim();
  const subject = taskSubjectInput.value.trim();

  if (!title || !subject) {
    taskError.textContent = 'Both Title and Subject fields are required.';
    return;
  }
  taskError.textContent = '';

  if (editingTaskId !== null) {
    // Edit existing task
    tasks = tasks.map(task => 
      task.id === editingTaskId ? { ...task, title, subject } : task
    );
  } else {
    // Add new task
    const newTask = {
      id: Date.now(),
      title,
      subject,
      status: 'pending'
    };
    tasks.push(newTask);
  }

  saveTasksData();
  resetTaskForm();
  renderTasks();
}

function resetTaskForm() {
  editingTaskId = null;
  taskTitleInput.value = '';
  taskSubjectInput.value = '';
  taskError.textContent = '';
  formTitle.textContent = 'Add New Study Task';
  saveTaskBtn.textContent = 'Save Task';
  cancelEditBtn.classList.add('hidden');
}

function editTask(id) {
  const taskToEdit = tasks.find(t => t.id === id);
  if (!taskToEdit) return;

  editingTaskId = id;
  taskTitleInput.value = taskToEdit.title;
  taskSubjectInput.value = taskToEdit.subject;
  formTitle.textContent = 'Edit Study Task';
  saveTaskBtn.textContent = 'Update Task';
  cancelEditBtn.classList.remove('hidden');
  taskTitleInput.focus();
}

function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasksData();
  renderTasks();
}

function toggleTaskStatus(id) {
  tasks = tasks.map(task => {
    if (task.id === id) {
      return { ...task, status: task.status === 'pending' ? 'completed' : 'pending' };
    }
    return task;
  });
  saveTasksData();
  renderTasks();
}

// --- 7. Task Filters & Render Engine ---
function setFilter(filterType) {
  currentFilter = filterType;
  filterButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filterType);
  });
  renderTasks();
}

function renderTasks() {
  taskListContainer.innerHTML = '';

  const filteredTasks = tasks.filter(task => {
    if (currentFilter === 'pending') return task.status === 'pending';
    if (currentFilter === 'completed') return task.status === 'completed';
    return true; // 'all'
  });

  if (filteredTasks.length === 0) {
    taskListContainer.innerHTML = `
      <div class="no-tasks">
        <p>No tasks available under this filter.</p>
      </div>
    `;
    updateParagraphCount();
    return;
  }

  filteredTasks.forEach(task => {
    const taskCard = document.createElement('div');
    taskCard.className = `task-item ${task.status === 'completed' ? 'completed' : ''}`;
    
    taskCard.innerHTML = `
      <div class="task-details">
        <div class="task-title">${escapeHTML(task.title)}</div>
        <div class="task-subject">${escapeHTML(task.subject)} • <strong>${task.status.toUpperCase()}</strong></div>
      </div>
      <div class="task-actions">
        <button class="btn btn-sm ${task.status === 'completed' ? 'btn-secondary' : 'btn-success'}" onclick="toggleTaskStatus(${task.id})">
          ${task.status === 'completed' ? 'Mark Pending' : 'Mark Complete'}
        </button>
        <button class="btn btn-sm btn-primary" onclick="editTask(${task.id})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteTask(${task.id})">Delete</button>
      </div>
    `;

    taskListContainer.appendChild(taskCard);
  });

  updateParagraphCount();
}

// Helper to escape HTML and prevent XSS
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// --- 8. Tabbed Interface ---
function switchTab(targetTabId) {
  tabButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === targetTabId);
  });

  tabContents.forEach(content => {
    content.classList.toggle('active', content.id === targetTabId);
  });

  updateParagraphCount();
}

// --- 9. Study Information & Paragraph Counter ---
function updateParagraphCount() {
  const allParagraphs = document.querySelectorAll('p');
  const count = allParagraphs.length;

  paraCountBadge.textContent = `Paragraphs: ${count}`;
  console.log(`Total Paragraphs Count on Page: ${count}`);

  // Re-apply reading mode to dynamically added paragraphs if active
  allParagraphs.forEach(p => {
    if (isReadingMode) {
      p.classList.add('reading-mode');
    } else {
      p.classList.remove('reading-mode');
    }
  });
}

// --- 10. Reading Mode Module ---
function toggleReadingMode() {
  isReadingMode = !isReadingMode;
  const allParagraphs = document.querySelectorAll('p');

  allParagraphs.forEach(p => {
    p.classList.toggle('reading-mode', isReadingMode);
  });

  if (isReadingMode) {
    readingModeBtn.textContent = 'Disable Reading Mode';
    readingModeBtn.classList.replace('btn-secondary', 'btn-primary');
  } else {
    readingModeBtn.textContent = 'Enable Reading Mode';
    readingModeBtn.classList.replace('btn-primary', 'btn-secondary');
  }
}