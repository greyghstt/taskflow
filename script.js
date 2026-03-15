const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskPriority = document.getElementById("task-priority");
const taskDueDate = document.getElementById("task-due-date");
const taskList = document.getElementById("task-list");
const taskCounter = document.getElementById("task-counter");
const emptyState = document.getElementById("empty-state");
const announcer = document.getElementById("announcer");
const filterButtons = document.querySelectorAll(".filter-btn");
const themeToggle = document.getElementById("theme-toggle");
const taskSearch = document.getElementById("task-search");
const taskSort = document.getElementById("task-sort");
const toggleAllButton = document.getElementById("toggle-all-btn");
const clearCompletedButton = document.getElementById("clear-completed-btn");
const addTaskButton = document.getElementById("add-task-btn");
const cancelEditButton = document.getElementById("cancel-edit-btn");

const TASKS_STORAGE_KEY = "taskflow-tasks";
const THEME_STORAGE_KEY = "taskflow-theme";
const PRIORITY_RANK = {
    high: 0,
    medium: 1,
    low: 2
};
const PRIORITY_LABEL = {
    high: "High Priority",
    medium: "Medium Priority",
    low: "Low Priority"
};

let tasks = [];
let currentFilter = "all";
let currentEditTaskId = null;

function getStoredValueSafely(key) {
    try {
        return localStorage.getItem(key);
    } catch (_error) {
        return null;
    }
}

function setStoredValueSafely(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (_error) {
        // Ignore storage failures and continue with in-memory state.
    }
}

function normalizeTaskText(text) {
    return text.trim().replace(/\s+/g, " ");
}

function sanitizePriority(priority) {
    if (priority === "high" || priority === "medium" || priority === "low") {
        return priority;
    }

    return "medium";
}

function sanitizeDueDate(dueDate) {
    if (!dueDate) {
        return "";
    }

    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(dueDate);
    return isValidDate ? dueDate : "";
}

function createTask(taskInputValue, priorityValue, dueDateValue) {
    const generatedId = globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    return {
        id: generatedId,
        text: normalizeTaskText(taskInputValue),
        priority: sanitizePriority(priorityValue),
        dueDate: sanitizeDueDate(dueDateValue),
        completed: false,
        createdAt: Date.now()
    };
}

function announce(message) {
    announcer.textContent = "";
    requestAnimationFrame(() => {
        announcer.textContent = message;
    });
}

function saveTasks() {
    setStoredValueSafely(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
    const rawValue = getStoredValueSafely(TASKS_STORAGE_KEY);
    if (!rawValue) {
        return [];
    }

    try {
        const parsedValue = JSON.parse(rawValue);
        if (!Array.isArray(parsedValue)) {
            return [];
        }

        return parsedValue
            .map((task) => ({
                id: typeof task.id === "string" ? task.id : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                text: normalizeTaskText(typeof task.text === "string" ? task.text : ""),
                priority: sanitizePriority(task.priority),
                dueDate: sanitizeDueDate(task.dueDate),
                completed: Boolean(task.completed),
                createdAt: typeof task.createdAt === "number" ? task.createdAt : Date.now()
            }))
            .filter((task) => Boolean(task.text));
    } catch (_error) {
        return [];
    }
}

function getStoredThemeSafely() {
    return getStoredValueSafely(THEME_STORAGE_KEY);
}

function setStoredThemeSafely(theme) {
    setStoredValueSafely(THEME_STORAGE_KEY, theme);
}

function applyTheme(theme) {
    const isDarkMode = theme === "dark";
    document.body.classList.toggle("dark-mode", isDarkMode);
    themeToggle.textContent = isDarkMode ? "Light Mode" : "Dark Mode";
    themeToggle.setAttribute("aria-pressed", String(isDarkMode));
    themeToggle.setAttribute(
        "aria-label",
        isDarkMode ? "Switch to light mode" : "Switch to dark mode"
    );
}

function initializeTheme() {
    const savedTheme = getStoredThemeSafely();
    if (savedTheme === "dark" || savedTheme === "light") {
        applyTheme(savedTheme);
        return;
    }

    const prefersDarkMode = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDarkMode ? "dark" : "light");
}

function isOverdue(task) {
    if (!task.dueDate || task.completed) {
        return false;
    }

    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dueDate = new Date(`${task.dueDate}T00:00:00`);
    return dueDate < todayDateOnly;
}

function formatDueDate(dueDate) {
    if (!dueDate) {
        return "";
    }

    const parsedDate = new Date(`${dueDate}T00:00:00`);
    return Number.isNaN(parsedDate.getTime())
        ? ""
        : parsedDate.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric"
          });
}

function isTaskVisible(task) {
    if (currentFilter === "completed" && !task.completed) {
        return false;
    }

    if (currentFilter === "pending" && task.completed) {
        return false;
    }

    const searchValue = normalizeTaskText(taskSearch.value).toLowerCase();
    if (searchValue && !task.text.toLowerCase().includes(searchValue)) {
        return false;
    }

    return true;
}

function getSortedTasks(taskItems) {
    const sortValue = taskSort.value;
    const sortedItems = [...taskItems];

    sortedItems.sort((firstTask, secondTask) => {
        if (sortValue === "oldest") {
            return firstTask.createdAt - secondTask.createdAt;
        }

        if (sortValue === "priority") {
            const priorityDifference = PRIORITY_RANK[firstTask.priority] - PRIORITY_RANK[secondTask.priority];
            return priorityDifference || secondTask.createdAt - firstTask.createdAt;
        }

        if (sortValue === "dueDate") {
            if (!firstTask.dueDate && !secondTask.dueDate) {
                return secondTask.createdAt - firstTask.createdAt;
            }

            if (!firstTask.dueDate) {
                return 1;
            }

            if (!secondTask.dueDate) {
                return -1;
            }

            const dateDifference = firstTask.dueDate.localeCompare(secondTask.dueDate);
            return dateDifference || secondTask.createdAt - firstTask.createdAt;
        }

        if (sortValue === "alphabetical") {
            const textDifference = firstTask.text.localeCompare(secondTask.text);
            return textDifference || secondTask.createdAt - firstTask.createdAt;
        }

        return secondTask.createdAt - firstTask.createdAt;
    });

    return sortedItems;
}

function updateFilterButtons() {
    filterButtons.forEach((button) => {
        const isActive = button.dataset.filter === currentFilter;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
}

function updateTaskStatus(visibleTaskCount) {
    const completedCount = tasks.filter((task) => task.completed).length;
    const overdueCount = tasks.filter((task) => isOverdue(task)).length;
    taskCounter.textContent = `${tasks.length} tasks total, ${completedCount} completed, ${overdueCount} overdue`;

    if (tasks.length === 0) {
        emptyState.textContent = "No tasks yet. Add one to get started.";
        emptyState.hidden = false;
        return;
    }

    if (visibleTaskCount === 0) {
        const hasSearchValue = Boolean(normalizeTaskText(taskSearch.value));
        if (hasSearchValue) {
            emptyState.textContent = "No tasks match your search.";
        } else if (currentFilter === "completed") {
            emptyState.textContent = "No completed tasks yet.";
        } else if (currentFilter === "pending") {
            emptyState.textContent = "No pending tasks right now.";
        } else {
            emptyState.textContent = "No tasks to show.";
        }
        emptyState.hidden = false;
        return;
    }

    emptyState.hidden = true;
}

function updateBulkActionState() {
    const hasTasks = tasks.length > 0;
    const hasCompletedTasks = tasks.some((task) => task.completed);
    const hasPendingTasks = tasks.some((task) => !task.completed);

    toggleAllButton.disabled = !hasTasks;
    clearCompletedButton.disabled = !hasCompletedTasks;
    toggleAllButton.textContent = hasPendingTasks ? "Complete All" : "Reopen All";
}

function resetForm() {
    taskForm.reset();
    taskPriority.value = "medium";
    currentEditTaskId = null;
    addTaskButton.textContent = "Add Task";
    cancelEditButton.hidden = true;
    taskInput.setCustomValidity("");
}

function startEditTask(taskId) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
        return;
    }

    currentEditTaskId = task.id;
    taskInput.value = task.text;
    taskPriority.value = task.priority;
    taskDueDate.value = task.dueDate;
    addTaskButton.textContent = "Save Task";
    cancelEditButton.hidden = false;
    taskInput.focus();
    taskInput.setSelectionRange(taskInput.value.length, taskInput.value.length);
    announce(`Editing task: ${task.text}`);
}

function finishEditTask(updatedText, updatedPriority, updatedDueDate) {
    const task = tasks.find((item) => item.id === currentEditTaskId);
    if (!task) {
        resetForm();
        return;
    }

    task.text = normalizeTaskText(updatedText);
    task.priority = sanitizePriority(updatedPriority);
    task.dueDate = sanitizeDueDate(updatedDueDate);
    saveTasks();
    resetForm();
    renderTasks();
    taskInput.focus();
    announce(`Updated: ${task.text}`);
}

function createBadge(label, className) {
    const badge = document.createElement("span");
    badge.className = `task-badge ${className}`;
    badge.textContent = label;
    return badge;
}

function createTaskElement(task) {
    const listItem = document.createElement("li");
    listItem.className = "task-item";
    listItem.dataset.taskId = task.id;
    if (task.completed) {
        listItem.classList.add("completed");
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute(
        "aria-label",
        task.completed ? `Mark task as pending: ${task.text}` : `Mark task as completed: ${task.text}`
    );

    const taskContent = document.createElement("div");
    taskContent.className = "task-content";

    const taskText = document.createElement("span");
    taskText.className = "task-text";
    taskText.textContent = task.text;

    const taskMeta = document.createElement("div");
    taskMeta.className = "task-meta";
    taskMeta.appendChild(createBadge(PRIORITY_LABEL[task.priority], `priority-${task.priority}`));

    if (task.dueDate) {
        taskMeta.appendChild(createBadge(`Due ${formatDueDate(task.dueDate)}`, "task-due-date"));
    }

    if (isOverdue(task)) {
        taskMeta.appendChild(createBadge("Overdue", "task-overdue"));
    }

    taskContent.append(taskText, taskMeta);

    const taskActions = document.createElement("div");
    taskActions.className = "task-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "edit-btn";
    editButton.textContent = "Edit";
    editButton.setAttribute("aria-label", `Edit task: ${task.text}`);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete task: ${task.text}`);

    taskActions.append(editButton, deleteButton);
    listItem.append(checkbox, taskContent, taskActions);
    return listItem;
}

function renderTasks() {
    const visibleTasks = tasks.filter((task) => isTaskVisible(task));
    const sortedVisibleTasks = getSortedTasks(visibleTasks);
    const taskFragment = document.createDocumentFragment();

    sortedVisibleTasks.forEach((task) => {
        taskFragment.appendChild(createTaskElement(task));
    });

    taskList.textContent = "";
    taskList.appendChild(taskFragment);
    updateTaskStatus(sortedVisibleTasks.length);
    updateFilterButtons();
    updateBulkActionState();
}

function addTask(taskTextValue, priorityValue, dueDateValue) {
    const task = createTask(taskTextValue, priorityValue, dueDateValue);
    if (!task.text) {
        return false;
    }

    tasks.push(task);
    saveTasks();
    renderTasks();
    announce(`Added: ${task.text}`);
    return true;
}

taskForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const normalizedValue = normalizeTaskText(taskInput.value);
    if (!normalizedValue) {
        taskInput.setCustomValidity("Please enter a task before adding.");
    } else {
        taskInput.setCustomValidity("");
    }

    if (!taskForm.reportValidity()) {
        return;
    }

    if (currentEditTaskId) {
        finishEditTask(normalizedValue, taskPriority.value, taskDueDate.value);
        return;
    }

    addTask(normalizedValue, taskPriority.value, taskDueDate.value);
    resetForm();
    taskInput.focus();
});

taskInput.addEventListener("input", () => {
    const normalizedValue = normalizeTaskText(taskInput.value);
    taskInput.setCustomValidity(normalizedValue ? "" : "Please enter a task before adding.");
});

cancelEditButton.addEventListener("click", () => {
    const wasEditing = Boolean(currentEditTaskId);
    resetForm();
    taskInput.focus();
    if (wasEditing) {
        announce("Edit cancelled.");
    }
});

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;
        renderTasks();
        announce(`Filter set to ${currentFilter}.`);
    });
});

taskSearch.addEventListener("input", () => {
    renderTasks();
});

taskSort.addEventListener("change", () => {
    renderTasks();
    announce(`Sorting by ${taskSort.options[taskSort.selectedIndex].text.toLowerCase()}.`);
});

taskList.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.classList.contains("task-checkbox")) {
        return;
    }

    const listItem = target.closest(".task-item");
    if (!listItem) {
        return;
    }

    const task = tasks.find((item) => item.id === listItem.dataset.taskId);
    if (!task) {
        return;
    }

    task.completed = target.checked;
    saveTasks();
    renderTasks();
    announce(task.completed ? `Completed: ${task.text}` : `Reopened: ${task.text}`);
});

taskList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
        return;
    }

    const listItem = target.closest(".task-item");
    if (!listItem) {
        return;
    }

    const taskId = listItem.dataset.taskId;
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
        return;
    }

    const editButton = target.closest(".edit-btn");
    if (editButton) {
        startEditTask(taskId);
        return;
    }

    const deleteButton = target.closest(".delete-btn");
    if (!deleteButton) {
        return;
    }

    tasks = tasks.filter((item) => item.id !== taskId);
    if (currentEditTaskId === taskId) {
        resetForm();
    }

    saveTasks();
    renderTasks();
    taskInput.focus();
    announce(`Deleted: ${task.text}`);
});

toggleAllButton.addEventListener("click", () => {
    if (tasks.length === 0) {
        return;
    }

    const shouldCompleteAll = tasks.some((task) => !task.completed);
    tasks = tasks.map((task) => ({
        ...task,
        completed: shouldCompleteAll
    }));

    saveTasks();
    renderTasks();
    announce(shouldCompleteAll ? "All tasks marked as completed." : "All tasks reopened.");
});

clearCompletedButton.addEventListener("click", () => {
    const completedCount = tasks.filter((task) => task.completed).length;
    if (completedCount === 0) {
        return;
    }

    const editingTaskWasRemoved = currentEditTaskId
        ? tasks.some((task) => task.id === currentEditTaskId && task.completed)
        : false;

    tasks = tasks.filter((task) => !task.completed);
    if (editingTaskWasRemoved) {
        resetForm();
    }

    saveTasks();
    renderTasks();
    announce(`${completedCount} completed task${completedCount === 1 ? "" : "s"} cleared.`);
});

themeToggle.addEventListener("click", () => {
    const isDarkMode = document.body.classList.contains("dark-mode");
    const nextTheme = isDarkMode ? "light" : "dark";
    applyTheme(nextTheme);
    setStoredThemeSafely(nextTheme);
    announce(nextTheme === "dark" ? "Dark mode enabled." : "Light mode enabled.");
});

tasks = loadTasks();
initializeTheme();
resetForm();
renderTasks();
