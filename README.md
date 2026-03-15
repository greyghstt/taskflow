# TaskFlow

TaskFlow is a lightweight task manager built with vanilla HTML, CSS, and JavaScript. It stays easy to read and extend while offering a more complete product feel with persistence, progress tracking, category organization, and polished accessibility details.

## Highlights
- Create, edit, complete, delete, and restore tasks with undo
- Save tasks, theme preference, search, sort, and filters with `localStorage`
- Organize tasks with priority, due dates, and categories
- Search by title or category and filter by task status or category
- See progress, pending count, due soon count, and active category count
- Use keyboard shortcuts for search, new task focus, and cancel edit
- Light and dark theme support with responsive layout

## Tech Stack
- HTML5
- CSS3
- JavaScript (ES6+)

## Project Structure
```text
.
|-- index.html
|-- styles.css
|-- script.js
|-- README.md
|-- .gitignore
|-- .gitattributes
`-- .github/
    |-- copilot-instructions.md
    `-- agents/
        `-- reviewer.agent.md
```

## How To Run
1. Open [index.html](/c:/vscode/project1/index.html) in your browser.
2. Add a task, choose a priority, add a category, and optionally set a due date.
3. Use search, sorting, status filters, and category filters to manage your list.
4. Refresh the page to confirm that tasks and UI preferences persist.

## Main Features

### Task Management
- Add new tasks with validation
- Edit tasks from the same form used for creation
- Mark tasks as completed or reopen them
- Delete tasks individually
- Undo the latest deletion or bulk clear action

### Organization
- Category support with saved suggestions
- Filter tasks by `All`, `Completed`, or `Pending`
- Filter tasks by category
- Search tasks by title or category
- Sort by newest, oldest, priority, due date, or alphabetical order
- Highlight overdue, due today, and due soon tasks

### Productivity
- Completion progress bar and summary cards
- Bulk complete or reopen all tasks
- Clear completed tasks with undo support
- Keyboard shortcuts: `/`, `N`, and `Esc`

## Accessibility Notes
- Semantic layout with `header`, `main`, `section`, `form`, and grouped controls
- Visible focus states for all interactive elements
- Live announcements for status-changing actions
- Context-aware labels for task actions and state toggles

## Code Notes
- State is centralized in a single `appState` object
- Storage, filtering, sorting, rendering, and shortcuts are split into focused helpers
- Browser API access is wrapped defensively for safer local execution

## Current Limitations
- Data is stored only in the browser, not synced across devices
- There is no backend, login, or cloud storage
- Automated tests are not set up yet

## Suggested Next Steps
- Add automated tests for task creation, editing, filtering, and undo flows
- Add drag-and-drop ordering for manual prioritization
- Add import/export support for JSON
- Deploy the app with GitHub Pages

## What This Project Demonstrates
- Semantic HTML and accessible interaction patterns
- Responsive CSS with design tokens and theming
- Vanilla JavaScript state management without frameworks
- Practical Git and GitHub workflow for a small frontend app
