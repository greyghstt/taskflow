# Project Coding Guidelines

## Project Context
- This is a small vanilla frontend app built with `index.html`, `styles.css`, and `script.js`
- Favor simple, readable solutions over abstractions meant for larger frameworks
- Keep the UI responsive, accessible, and easy to maintain

## HTML
- Use semantic HTML5 elements such as `header`, `main`, `section`, `form`, and `button`
- Keep labels, `aria-*` attributes, and live regions meaningful and up to date
- Prefer clear content structure over deeply nested markup

## CSS
- Reuse the existing design tokens in `:root` before adding new one-off values
- Keep desktop and mobile layouts both supported
- Preserve the current visual direction: soft glass panel, bold accents, and light/dark theme parity
- Add fallbacks carefully when using modern properties

## JavaScript
- Prefer modern JavaScript features such as `const`, `let`, template literals, and array helpers
- Keep state changes explicit and easy to trace
- Separate concerns between state, rendering, and event handling when possible
- Add error handling for browser APIs like `localStorage`

## Naming
- Use camelCase for variables, functions, and DOM references
- Use ALL_CAPS for constants
- Choose names that describe user intent, not just implementation detail

## Code Quality
- Keep functions focused and readable
- Add comments only when they clarify non-obvious logic
- Avoid introducing unnecessary dependencies or build tooling
- When adding features, preserve accessibility and keyboard usability
