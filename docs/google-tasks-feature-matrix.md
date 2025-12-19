# Google Tasks API Feature Matrix and DX Priorities

Last updated: 2025-12-19

## Reference: Key Task Fields (Tasks API v1)

- Core: id, title, notes, status (`needsAction` | `completed`), updated, position, parent, tasklist
- Dates: due (RFC 3339), completed (timestamp), updated (timestamp)
- Visibility flags: deleted, hidden
- Structure: parent (for subtasks), position (ordering), move API supports re-parenting and reordering
- Links: links[] (description, link, type: `email` | `link`)
- Misc: kind, etag, selfLink (read-only); webViewLink is not exposed by API; reminders/notifications are not part of Tasks API v1

## Feature Matrix

| Feature                   | API Support                              | DX value  | Effort (ext)   | Notes / Risk                                                       |
| ------------------------- | ---------------------------------------- | --------- | -------------- | ------------------------------------------------------------------ |
| View tasks/list hierarchy | Full                                     | Essential | Low (existing) | Already present via tree provider                                  |
| Add task                  | Full                                     | Essential | Low (existing) | Insert API; currently title+notes only                             |
| Add subtask               | Full                                     | High      | Low (existing) | Uses `parent` on insert                                            |
| Edit title/notes          | Full                                     | Essential | Low (existing) | Patch API                                                          |
| Mark complete / toggle    | Full                                     | Essential | Low (existing) | Uses `status=completed`, `hidden=true`                             |
| Delete task               | Full                                     | Medium    | Low (existing) | Soft delete; can be filtered by `showDeleted` (not currently used) |
| Due date/time             | Full                                     | High      | Medium         | Need ISO datetime input and validation; all-day vs timed nuance    |
| Show completed toggle     | Full                                     | High      | Low (existing) | Uses showCompleted/showHidden flags                                |
| Reorder tasks             | Full (`tasks.move`)                      | Medium    | Medium-High    | Requires UI for ordering; tree drag-drop or commands               |
| Move task between lists   | Full (`tasks.move` + tasklist id change) | Medium    | Medium         | Needs UX to select target list and re-parent                       |
| Hide/unhide               | Full (hidden flag)                       | Low       | Low            | Could expose toggle; minimal UI                                    |
| Links on tasks            | Full (links[])                           | Medium    | Medium         | Need JSON/editor surface; maybe simple quick input for one link    |
| Clear completed           | Full (`tasks.clear`)                     | Low       | Low-Medium     | Command-level add; irreversible removal of completed in list       |
| Deleted tasks visibility  | Full (showDeleted)                       | Low       | Medium         | Need context toggle; risk of clutter                               |
| Notes-rich editing        | Partial (plain text)                     | Medium    | Low            | Already supports notes text; no formatting                         |
| Tasklists CRUD            | Full                                     | Medium    | Low (existing) | Already supports add/delete; rename not exposed yet                |
| Rename tasklist           | Full (tasklists.patch)                   | Medium    | Low            | Missing today; simple input+patch                                  |
| Export/Import             | Not direct                               | Low       | High           | Would require custom format; out of scope                          |
| Reminders/notifications   | Not in API                               | Low       | N/A            | Unsupported by Tasks API v1                                        |

## Gap vs Google Tasks Web UI (critical parity)

- Missing: due date/time, full field edit surface (links, hidden/deleted flags), reorder/move, tasklist rename.
- Partially missing: notes are supported but not easily edited in bulk; completed visibility present.

## Recommended Scope (now)

- Due date/time support in create/edit flows and JSON editor; validate RFC 3339 input; treat date-only as all-day (no timezone).
- JSON editor path: expose editable fields (title, notes, due, status, links, hidden, deleted, parent) with validation; ignore read-only fields on save.
- Optional quick wins: tasklist rename; toggle hidden flag; show due/status in tree description to surface deadlines.

## Deferred / Future

- Reordering/drag-drop and move-between-lists UX using `tasks.move`.
- Links helper UI (add/edit link entries) beyond JSON editor.
- Deleted visibility toggle and clear completed command.
- Packaging polish for sharing/publishing.
