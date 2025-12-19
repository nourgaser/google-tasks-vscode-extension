# Living Plan

Last updated: 2025-12-19

## Goals

- Enable JSON-based task editing that patches Google Tasks, including due dates and other fields not currently supported.
- Keep this as a personal fork-ready extension with clear packaging steps for local install.

## Status legend

- [ ] To do
- [~] In progress
- [x] Done

## Tasks (keep this updated)

- [x] Capture initial plan and working approach in PLAN.md.
- [x] Document API feature matrix and DX priorities (see docs/google-tasks-feature-matrix.md).
- [x] Review current code paths for tasks CRUD, auth, and telemetry; note gaps for deadlines and metadata surfaces.
- [x] Design JSON editor approach (URI scheme, editable fields, validation rules, error handling, refresh behavior).
- [x] Implement Task JSON FileSystemProvider (read task -> pretty JSON, write -> validate + tasks.patch + refresh).
- [x] Add command `googleTasks.editTaskJson` and bind tree item click/context menu to open JSON editor for a task.
- [x] Extend task creation/edit flows to capture due date/time (ISO) and other supported fields when provided.
- [x] Surface key metadata (due/status) in tree item description/tooltip for quick scanning.
- [x] Add telemetry entries for new commands/actions consistent with existing telemetry wrapper.
- [x] Update package metadata for personal fork (name/displayName/publisher/version) and document packaging for local install (publisher: nourgaser; author: Nour Gaser).
- [ ] Run manual testing checklist (auth, edit, save, invalid JSON errors, due date handling, subtasks, completed/hidden cases).
- [x] Update docs as needed (README snippets, usage notes, known limitations) after features land.
