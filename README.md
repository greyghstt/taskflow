# TaskFlow

TaskFlow is a lightweight task manager built with vanilla HTML, CSS, and JavaScript. It is designed to stay simple to run while still feeling polished, responsive, and useful for day-to-day planning.

## Highlights
- Create, edit, complete, and delete tasks
- Save tasks locally with `localStorage`
- Set task priority and optional due dates
- Search, filter, and sort tasks
- Bulk actions for completing or clearing tasks
- Light and dark theme support
- Accessible structure with semantic HTML and live announcements

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
`-- .github/
    |-- copilot-instructions.md
    `-- agents/
        `-- reviewer.agent.md
```

## How To Run
1. Open [index.html](/c:/vscode/TEST/index.html) in your browser.
2. Add a task, assign a priority, and optionally choose a due date.
3. Use search, filters, sorting, and bulk actions to manage the list.
4. Refresh the page to confirm that tasks and theme preferences persist.

## Main Features

### Task Management
- Add new tasks with validation
- Edit existing tasks from the main form
- Mark tasks as completed or reopen them
- Delete tasks individually

### Organization
- Filter tasks by `All`, `Completed`, or `Pending`
- Search tasks by title
- Sort by newest, oldest, priority, due date, or alphabetical order
- Track overdue tasks visually

### Productivity
- Complete all tasks in one action
- Reopen all tasks when everything is done
- Clear only completed tasks

## Accessibility Notes
- Semantic layout with `header`, `main`, and `section`
- Visible focus states for interactive controls
- Screen reader announcements for key actions
- Button and checkbox labels that reflect task context

## Current Limitations
- Data is stored only in the browser, not synced across devices
- There is no backend, login, or cloud storage
- Automated tests are not set up yet

## Suggested Next Steps
- Add automated tests for task creation, editing, filtering, and storage
- Add categories or tags for larger task lists
- Add import/export support
- Add drag-and-drop ordering

## Authoring Notes
This project intentionally avoids frameworks so the core DOM, styling, and state management remain easy to study and extend.
