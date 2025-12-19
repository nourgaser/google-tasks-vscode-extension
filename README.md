# Google Tasks JSON Editor (fork by Nour Gaser)

## Manage your To-Do list ✅ without going out of your VSCode Editor 🤖.

> This is **not** similar to extensions like 🌳 [Todo Tree](https://marketplace.visualstudio.com/items?itemName=Gruntfuggly.todo-tree), which shows a tree view of the //TODO: comments in the source code

> This is not an official product of Google

This fork (by Nour Gaser, based on the original by Krishna Pravin) lets you view your Google Tasks in the tree view and open any task as a JSON document to edit fields like title, notes, status, and due date/time.

## Requirements

You need to have a Google Account with data in Google Tasks application to utilise this extension.

## Usage

- In the Google Tasks view, click a task (or use the context menu) to open it as JSON.
- Edit allowed fields: `title`, `notes`, `status` (`needsAction` | `completed`), `due` (RFC3339, e.g. `2025-12-01` or `2025-12-01T15:00:00Z`), `hidden`, `deleted`, `parent`.
- The `links` field is read-only; the Tasks API ignores link updates.
- Save to patch the task via the Google Tasks API; the tree refreshes automatically.

## Packaging locally

- `publisher` is set to `nourgaser` for this fork; change it if you publish under a different id.
- Run `npm install` then `npm run vscode:prepublish`.
- Package with `npx vsce package` (or `pnpm dlx vsce package`).
- Install the generated `.vsix` via VS Code: Extensions view → `...` → Install from VSIX.

## Credits

- Original extension by Krishna Pravin: https://github.com/KrishnaPravin/google-tasks-vscode-extension
- Fork maintained by Nour Gaser.

## Screenshots

![SignIn](resources/authorize.png)

![Tree view of Google Tasks](resources/treeView.png)

## Privacy Policy

This extension accesses the user data only during the runtime of VSCode application. User data means only the data that is created by the user within the Google Tasks application. The accessed user data is directly displayed within the VSCode Editor. Also, this data is not persisted in any medium and is not sent or shared to any server or any 3rd party application

## Release Notes

- Please refer [CHANGELOG](CHANGELOG.md)

**Enjoy!**
