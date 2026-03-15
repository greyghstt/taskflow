const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskPriority = document.getElementById("task-priority");
const taskDueDate = document.getElementById("task-due-date");
const taskCategory = document.getElementById("task-category");
const taskCategorySuggestions = document.getElementById("task-category-suggestions");
const taskCategoryFilter = document.getElementById("task-category-filter");
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
const completionRate = document.getElementById("completion-rate");
const pendingCount = document.getElementById("pending-count");
const dueSoonCount = document.getElementById("due-soon-count");
const categoryCount = document.getElementById("category-count");
const progressFill = document.getElementById("progress-fill");
const dateWarning = document.getElementById("date-warning");
const undoBanner = document.getElementById("undo-banner");
const undoMessage = document.getElementById("undo-message");
const undoDeleteButton = document.getElementById("undo-delete-btn");

const STORAGE_KEYS = {
    tasks: "taskflow-tasks",
    theme: "taskflow-theme",
    preferences: "taskflow-preferences"
};
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
const DEFAULT_CATEGORY = "General";
const DEFAULT_CATEGORIES = [DEFAULT_CATEGORY, "Work", "Personal", "Study", "Errands"];
const VALID_FILTERS = new Set(["all", "completed", "pending"]);
const VALID_SORTS = new Set(["newest", "oldest", "priority", "dueDate", "alphabetical"]);
const DUE_SOON_WINDOW_DAYS = 3;
const UNDO_TIMEOUT_MS = 5000;

const appState = {
    tasks: [],
    filter: "all",
    search: "",
    sort: "newest",
    categoryFilter: "all",
    editingTaskId: null,
    lastRemovedEntries: null,
    undoTimeoutId: null
};

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
        // Continue gracefully when storage is blocked.
    }
}

function normalizeText(text) {
    return text.trim().replace(/\s+/g, " ");
}

function formatCategory(category) {
    const normalizedCategory = normalizeText(category);
    if (!normalizedCategory) {
        return DEFAULT_CATEGORY;
    }

    return normalizedCategory
        .toLowerCase()
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function sanitizePriority(priority) {
    return PRIORITY_LABEL[priority] ? priority : "medium";
}

function sanitizeDueDate(dueDate) {
    if (!dueDate) {
        return "";
    }

    return /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? dueDate : "";
}

function createId() {
    return globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createTask(taskTextValue, priorityValue, dueDateValue, categoryValue) {
    return {
        id: createId(),
        text: normalizeText(taskTextValue),
        priority: sanitizePriority(priorityValue),
        dueDate: sanitizeDueDate(dueDateValue),
        category: formatCategory(categoryValue),
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
    setStoredValueSafely(STORAGE_KEYS.tasks, JSON.stringify(appState.tasks));
}

function loadTasks() {
    const rawValue = getStoredValueSafely(STORAGE_KEYS.tasks);
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
                id: typeof task.id === "string" ? task.id : createId(),
                text: normalizeText(typeof task.text === "string" ? task.text : ""),
                priority: sanitizePriority(task.priority),
                dueDate: sanitizeDueDate(task.dueDate),
                category: formatCategory(typeof task.category === "string" ? task.category : DEFAULT_CATEGORY),
                completed: Boolean(task.completed),
                createdAt: typeof task.createdAt === "number" ? task.createdAt : Date.now()
            }))
            .filter((task) => Boolean(task.text));
    } catch (_error) {
        return [];
    }
}

function savePreferences() {
    const preferences = {
        filter: appState.filter,
        search: appState.search,
        sort: appState.sort,
        categoryFilter: appState.categoryFilter
    };

    setStoredValueSafely(STORAGE_KEYS.preferences, JSON.stringify(preferences));
}

function loadPreferences() {
    const rawValue = getStoredValueSafely(STORAGE_KEYS.preferences);
    if (!rawValue) {
        return;
    }

    try {
        const parsedValue = JSON.parse(rawValue);
        if (VALID_FILTERS.has(parsedValue.filter)) {
            appState.filter = parsedValue.filter;
        }
        if (typeof parsedValue.search === "string") {
            appState.search = normalizeText(parsedValue.search);
        }
        if (VALID_SORTS.has(parsedValue.sort)) {
            appState.sort = parsedValue.sort;
        }
        if (typeof parsedValue.categoryFilter === "string") {
            appState.categoryFilter = parsedValue.categoryFilter;
        }
    } catch (_error) {
        // Ignore malformed preference data and use defaults.
    }
}

function getStoredThemeSafely() {
    return getStoredValueSafely(STORAGE_KEYS.theme);
}

function setStoredThemeSafely(theme) {
    setStoredValueSafely(STORAGE_KEYS.theme, theme);
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

function getTodayDateOnly() {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function getDueDateObject(dueDate) {
    if (!dueDate) {
        return null;
    }

    const parsedDate = new Date(`${dueDate}T00:00:00`);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function getDaysUntilDue(task) {
    const dueDate = getDueDateObject(task.dueDate);
    if (!dueDate) {
        return null;
    }

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    return Math.round((dueDate - getTodayDateOnly()) / millisecondsPerDay);
}

function getDueStatus(task) {
    if (!task.dueDate || task.completed) {
        return "none";
    }

    const daysUntilDue = getDaysUntilDue(task);
    if (daysUntilDue === null) {
        return "none";
    }
    if (daysUntilDue < 0) {
        return "overdue";
    }
    if (daysUntilDue === 0) {
        return "today";
    }
    if (daysUntilDue <= DUE_SOON_WINDOW_DAYS) {
        return "soon";
    }

    return "future";
}

function isOverdue(task) {
    return getDueStatus(task) === "overdue";
}

function isDueSoon(task) {
    const dueStatus = getDueStatus(task);
    return dueStatus === "today" || dueStatus === "soon";
}

function formatDueDate(dueDate) {
    const parsedDate = getDueDateObject(dueDate);
    return parsedDate
        ? parsedDate.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric"
          })
        : "";
}

function updateDateWarning() {
    const dueDate = sanitizeDueDate(taskDueDate.value);
    const isPastDue = Boolean(dueDate) && getDueDateObject(dueDate) < getTodayDateOnly();
    dateWarning.hidden = !isPastDue;
    taskDueDate.setAttribute("aria-invalid", String(isPastDue));
}

function matchesSearch(task) {
    if (!appState.search) {
        return true;
    }

    const searchText = appState.search.toLowerCase();
    return task.text.toLowerCase().includes(searchText) || task.category.toLowerCase().includes(searchText);
}

function isTaskVisible(task) {
    if (appState.filter === "completed" && !task.completed) {
        return false;
    }

    if (appState.filter === "pending" && task.completed) {
        return false;
    }

    if (appState.categoryFilter !== "all" && task.category !== appState.categoryFilter) {
        return false;
    }

    return matchesSearch(task);
}

function getSortedTasks(tasksToSort) {
    const sortedTasks = [...tasksToSort];

    sortedTasks.sort((firstTask, secondTask) => {
        if (appState.sort === "oldest") {
            return firstTask.createdAt - secondTask.createdAt;
        }

        if (appState.sort === "priority") {
            const priorityDifference = PRIORITY_RANK[firstTask.priority] - PRIORITY_RANK[secondTask.priority];
            return priorityDifference || secondTask.createdAt - firstTask.createdAt;
        }

        if (appState.sort === "dueDate") {
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

        if (appState.sort === "alphabetical") {
            const textDifference = firstTask.text.localeCompare(secondTask.text);
            return textDifference || secondTask.createdAt - firstTask.createdAt;
        }

        return secondTask.createdAt - firstTask.createdAt;
    });

    return sortedTasks;
}

function getVisibleTasks() {
    return getSortedTasks(appState.tasks.filter((task) => isTaskVisible(task)));
}

function updateCategoryOptions() {
    const categories = new Set(DEFAULT_CATEGORIES);
    appState.tasks.forEach((task) => {
        categories.add(task.category);
    });

    const sortedCategories = [...categories].sort((firstCategory, secondCategory) => firstCategory.localeCompare(secondCategory));

    taskCategoryFilter.textContent = "";
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "All categories";
    taskCategoryFilter.appendChild(allOption);

    taskCategorySuggestions.textContent = "";

    sortedCategories.forEach((category) => {
        const filterOption = document.createElement("option");
        filterOption.value = category;
        filterOption.textContent = category;
        taskCategoryFilter.appendChild(filterOption);

        const suggestionOption = document.createElement("option");
        suggestionOption.value = category;
        taskCategorySuggestions.appendChild(suggestionOption);
    });

    const categoryStillExists = sortedCategories.includes(appState.categoryFilter);
    if (appState.categoryFilter !== "all" && !categoryStillExists) {
        appState.categoryFilter = "all";
        savePreferences();
    }

    taskCategoryFilter.value = appState.categoryFilter;
}

function updateFilterButtons() {
    filterButtons.forEach((button) => {
        const isActive = button.dataset.filter === appState.filter;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
}

function updateOverview() {
    const totalTasks = appState.tasks.length;
    const completedTasks = appState.tasks.filter((task) => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const dueSoonTasks = appState.tasks.filter((task) => isDueSoon(task)).length;
    const categoryTotal = new Set(appState.tasks.map((task) => task.category)).size;
    const completionPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    completionRate.textContent = `${completionPercent}%`;
    pendingCount.textContent = String(pendingTasks);
    dueSoonCount.textContent = String(dueSoonTasks);
    categoryCount.textContent = String(categoryTotal);
    progressFill.style.width = `${completionPercent}%`;
}

function updateTaskStatus(visibleTaskCount) {
    const completedCount = appState.tasks.filter((task) => task.completed).length;
    const overdueCount = appState.tasks.filter((task) => isOverdue(task)).length;
    taskCounter.textContent = `${appState.tasks.length} tasks total, ${completedCount} completed, ${overdueCount} overdue`;

    if (appState.tasks.length === 0) {
        emptyState.textContent = "No tasks yet. Add your first task to start building momentum.";
        emptyState.hidden = false;
        return;
    }

    if (visibleTaskCount === 0) {
        if (appState.search && appState.categoryFilter !== "all") {
            emptyState.textContent = "No tasks match this search and category combination.";
        } else if (appState.search) {
            emptyState.textContent = "No tasks match your search.";
        } else if (appState.categoryFilter !== "all") {
            emptyState.textContent = `No tasks in the ${appState.categoryFilter} category right now.`;
        } else if (appState.filter === "completed") {
            emptyState.textContent = "Nothing completed yet. Finish a task to see it here.";
        } else if (appState.filter === "pending") {
            emptyState.textContent = "Everything is done. Nice work.";
        } else {
            emptyState.textContent = "No tasks to show.";
        }
        emptyState.hidden = false;
        return;
    }

    emptyState.hidden = true;
}

function updateBulkActionState() {
    const hasTasks = appState.tasks.length > 0;
    const hasCompletedTasks = appState.tasks.some((task) => task.completed);
    const hasPendingTasks = appState.tasks.some((task) => !task.completed);

    toggleAllButton.disabled = !hasTasks;
    clearCompletedButton.disabled = !hasCompletedTasks;
    toggleAllButton.textContent = hasPendingTasks ? "Complete All" : "Reopen All";
}

function setFormMode(task) {
    if (!task) {
        appState.editingTaskId = null;
        addTaskButton.textContent = "Add Task";
        cancelEditButton.hidden = true;
        return;
    }

    appState.editingTaskId = task.id;
    addTaskButton.textContent = "Save Task";
    cancelEditButton.hidden = false;
}

function resetForm() {
    taskForm.reset();
    taskPriority.value = "medium";
    taskCategory.value = "";
    taskInput.setCustomValidity("");
    setFormMode(null);
    updateDateWarning();
}

function populateFormForEdit(task) {
    taskInput.value = task.text;
    taskPriority.value = task.priority;
    taskDueDate.value = task.dueDate;
    taskCategory.value = task.category === DEFAULT_CATEGORY ? "" : task.category;
    setFormMode(task);
    updateDateWarning();
    taskInput.focus();
    taskInput.setSelectionRange(taskInput.value.length, taskInput.value.length);
}

function startEditTask(taskId) {
    const task = appState.tasks.find((item) => item.id === taskId);
    if (!task) {
        return;
    }

    populateFormForEdit(task);
    announce(`Editing task: ${task.text}`);
}

function clearUndoState() {
    if (appState.undoTimeoutId) {
        clearTimeout(appState.undoTimeoutId);
    }

    appState.undoTimeoutId = null;
    appState.lastRemovedEntries = null;
    undoBanner.hidden = true;
}

function queueUndo(entries, message) {
    clearUndoState();
    appState.lastRemovedEntries = entries;
    undoMessage.textContent = message;
    undoBanner.hidden = false;
    appState.undoTimeoutId = window.setTimeout(() => {
        clearUndoState();
    }, UNDO_TIMEOUT_MS);
}

function restoreRemovedTasks() {
    if (!appState.lastRemovedEntries?.length) {
        return;
    }

    const entriesToRestore = [...appState.lastRemovedEntries].sort((firstEntry, secondEntry) => firstEntry.index - secondEntry.index);
    entriesToRestore.forEach(({ task, index }) => {
        const safeIndex = Math.min(Math.max(index, 0), appState.tasks.length);
        appState.tasks.splice(safeIndex, 0, task);
    });

    saveTasks();
    clearUndoState();
    renderTasks();
    announce(`${entriesToRestore.length} task${entriesToRestore.length === 1 ? "" : "s"} restored.`);
}

function removeTasks(entries, message) {
    const idsToRemove = new Set(entries.map((entry) => entry.task.id));
    appState.tasks = appState.tasks.filter((task) => !idsToRemove.has(task.id));

    if (entries.some((entry) => entry.task.id === appState.editingTaskId)) {
        resetForm();
    }

    saveTasks();
    renderTasks();
    queueUndo(entries, message);
    undoDeleteButton.focus();
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
    taskMeta.appendChild(createBadge(task.category, "category-badge"));

    if (task.dueDate) {
        taskMeta.appendChild(createBadge(`Due ${formatDueDate(task.dueDate)}`, "task-due-date"));
    }

    const dueStatus = getDueStatus(task);
    if (dueStatus === "overdue") {
        taskMeta.appendChild(createBadge("Overdue", "task-overdue"));
    } else if (dueStatus === "today") {
        taskMeta.appendChild(createBadge("Due Today", "task-due-today"));
    } else if (dueStatus === "soon") {
        taskMeta.appendChild(createBadge("Due Soon", "task-due-soon"));
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
    const visibleTasks = getVisibleTasks();
    const taskFragment = document.createDocumentFragment();

    visibleTasks.forEach((task) => {
        taskFragment.appendChild(createTaskElement(task));
    });

    taskList.textContent = "";
    taskList.appendChild(taskFragment);
    updateCategoryOptions();
    updateFilterButtons();
    updateOverview();
    updateTaskStatus(visibleTasks.length);
    updateBulkActionState();
}

function addTask(taskTextValue, priorityValue, dueDateValue, categoryValue) {
    const task = createTask(taskTextValue, priorityValue, dueDateValue, categoryValue);
    if (!task.text) {
        return false;
    }

    appState.tasks.push(task);
    saveTasks();
    renderTasks();
    announce(`Added: ${task.text}`);
    return true;
}

function updateTask(taskId, updates) {
    const task = appState.tasks.find((item) => item.id === taskId);
    if (!task) {
        return;
    }

    task.text = normalizeText(updates.text);
    task.priority = sanitizePriority(updates.priority);
    task.dueDate = sanitizeDueDate(updates.dueDate);
    task.category = formatCategory(updates.category);
    saveTasks();
    resetForm();
    renderTasks();
    taskInput.focus();
    announce(`Updated: ${task.text}`);
}

function syncControlsWithPreferences() {
    taskSearch.value = appState.search;
    taskSort.value = appState.sort;
}

function handleFilterChange(nextFilter) {
    appState.filter = nextFilter;
    savePreferences();
    renderTasks();
    announce(`Filter set to ${nextFilter}.`);
}

function handleSearchChange(value) {
    appState.search = normalizeText(value);
    savePreferences();
    renderTasks();
}

function handleSortChange(value) {
    appState.sort = VALID_SORTS.has(value) ? value : "newest";
    savePreferences();
    renderTasks();
    announce(`Sorting by ${taskSort.options[taskSort.selectedIndex].text.toLowerCase()}.`);
}

function handleCategoryFilterChange(value) {
    appState.categoryFilter = value || "all";
    savePreferences();
    renderTasks();
    announce(appState.categoryFilter === "all" ? "Showing all categories." : `Category filter set to ${appState.categoryFilter}.`);
}

function isEditableTarget(target) {
    return target instanceof HTMLElement && (target.closest("input, textarea, select, button") !== null || target.isContentEditable);
}

function handleKeyboardShortcuts(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
    }

    const target = event.target;
    if (event.key === "/" && !isEditableTarget(target)) {
        event.preventDefault();
        taskSearch.focus();
        taskSearch.select();
        return;
    }

    if (event.key.toLowerCase() === "n" && !isEditableTarget(target)) {
        event.preventDefault();
        taskInput.focus();
        return;
    }

    if (event.key === "Escape") {
        if (appState.editingTaskId) {
            resetForm();
            taskInput.focus();
            announce("Edit cancelled.");
            return;
        }

        if (taskSearch.value) {
            taskSearch.value = "";
            handleSearchChange("");
            announce("Search cleared.");
        }
    }
}

function initializeApp() {
    appState.tasks = loadTasks();
    loadPreferences();
    syncControlsWithPreferences();
    initializeTheme();
    updateDateWarning();
    renderTasks();
}

taskForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const normalizedValue = normalizeText(taskInput.value);
    taskInput.setCustomValidity(normalizedValue ? "" : "Please enter a task before adding.");

    if (!taskForm.reportValidity()) {
        return;
    }

    if (appState.editingTaskId) {
        updateTask(appState.editingTaskId, {
            text: normalizedValue,
            priority: taskPriority.value,
            dueDate: taskDueDate.value,
            category: taskCategory.value
        });
        return;
    }

    addTask(normalizedValue, taskPriority.value, taskDueDate.value, taskCategory.value);
    resetForm();
    taskInput.focus();
});

taskInput.addEventListener("input", () => {
    const normalizedValue = normalizeText(taskInput.value);
    taskInput.setCustomValidity(normalizedValue ? "" : "Please enter a task before adding.");
});

taskDueDate.addEventListener("input", updateDateWarning);

cancelEditButton.addEventListener("click", () => {
    if (!appState.editingTaskId) {
        return;
    }

    resetForm();
    taskInput.focus();
    announce("Edit cancelled.");
});

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        handleFilterChange(button.dataset.filter);
    });
});

taskSearch.addEventListener("input", () => {
    handleSearchChange(taskSearch.value);
});

taskSort.addEventListener("change", () => {
    handleSortChange(taskSort.value);
});

taskCategoryFilter.addEventListener("change", () => {
    handleCategoryFilterChange(taskCategoryFilter.value);
});

taskList.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.classList.contains("task-checkbox")) {
        return;
    }

    const task = appState.tasks.find((item) => item.id === target.closest(".task-item")?.dataset.taskId);
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

    const task = appState.tasks.find((item) => item.id === listItem.dataset.taskId);
    if (!task) {
        return;
    }

    if (target.closest(".edit-btn")) {
        startEditTask(task.id);
        return;
    }

    if (!target.closest(".delete-btn")) {
        return;
    }

    const taskIndex = appState.tasks.findIndex((item) => item.id === task.id);
    if (taskIndex === -1) {
        return;
    }

    removeTasks([{ task: { ...task }, index: taskIndex }], `Deleted: ${task.text}`);
    announce(`Deleted: ${task.text}`);
});

toggleAllButton.addEventListener("click", () => {
    if (appState.tasks.length === 0) {
        return;
    }

    const shouldCompleteAll = appState.tasks.some((task) => !task.completed);
    appState.tasks = appState.tasks.map((task) => ({
        ...task,
        completed: shouldCompleteAll
    }));

    saveTasks();
    clearUndoState();
    renderTasks();
    announce(shouldCompleteAll ? "All tasks marked as completed." : "All tasks reopened.");
});

clearCompletedButton.addEventListener("click", () => {
    const completedEntries = appState.tasks
        .map((task, index) => ({ task: { ...task }, index }))
        .filter((entry) => entry.task.completed);

    if (completedEntries.length === 0) {
        return;
    }

    removeTasks(
        completedEntries,
        `${completedEntries.length} completed task${completedEntries.length === 1 ? "" : "s"} cleared.`
    );
    announce(`${completedEntries.length} completed task${completedEntries.length === 1 ? "" : "s"} cleared.`);
});

undoDeleteButton.addEventListener("click", restoreRemovedTasks);

themeToggle.addEventListener("click", () => {
    const isDarkMode = document.body.classList.contains("dark-mode");
    const nextTheme = isDarkMode ? "light" : "dark";
    applyTheme(nextTheme);
    setStoredThemeSafely(nextTheme);
    announce(nextTheme === "dark" ? "Dark mode enabled." : "Light mode enabled.");
});

document.addEventListener("keydown", handleKeyboardShortcuts);

resetForm();
initializeApp();
