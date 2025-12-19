import {commands, window, workspace, languages, Uri} from 'vscode'

import telemetry from '../../telemetry'
import {removeToken} from '../Token'
import {AuthorizeGoogleTreeDataProvider} from '../TreeDataProviders/AuthorizeGoogle.TreeDataProvider'
import initiateUserAuthorization from '../userAuthorization'
import gTaskTreeProvider from '../TreeDataProviders/GTask/GTask.TreeDataProvider'
import {GTaskList} from '../TreeDataProviders/GTask/GTaskList.treeItem'
import {GTask} from '../TreeDataProviders/GTask/GTask.treeItem'
import {taskJsonScheme} from '../TaskJsonFileSystemProvider'

const commandsList = {
  'googleTasks.logout': () => {
    removeToken()
    commands.executeCommand('setContext', 'GoogleUserTokenExists', false)
    window.registerTreeDataProvider('googleTasks', new AuthorizeGoogleTreeDataProvider())
  },
  'googleTasks.initUserGAuth': initiateUserAuthorization,
  'googleTasks.showCompleted': () => {
    commands.executeCommand('setContext', 'ShowCompleted', true)
    commands.executeCommand('setContext', 'HideCompleted', false)
    gTaskTreeProvider.refresh({showCompleted: true})
  },
  'googleTasks.hideCompleted': () => {
    commands.executeCommand('setContext', 'ShowCompleted', false)
    commands.executeCommand('setContext', 'HideCompleted', true)
    gTaskTreeProvider.refresh({showCompleted: false})
  },
  'googleTasks.refresh': () => {
    gTaskTreeProvider.refresh()
  },
  'googleTasks.addTaskList': async () => {
    const title = await window.showInputBox({
      prompt: 'Provide a title for the tasklist',
      placeHolder: 'Tasklist title',
      value: undefined,
      ignoreFocusOut: true,
    })
    if (title === undefined || title.length === 0) return undefined

    gTaskTreeProvider.addTaskList({requestBody: {title}})
  },
  'googleTasks.deleteTaskList': async (node: GTaskList) => {
    gTaskTreeProvider.deleteTaskList({tasklist: node.taskList.id || undefined})
  },
  'googleTasks.addTask': async (node: GTaskList) => {
    if (node.taskList.id === null) return

    const title = await window.showInputBox({
      prompt: 'Provide a title for the task',
      placeHolder: 'Task title',
      value: undefined,
      ignoreFocusOut: true,
    })
    if (title === undefined || title.length === 0) return undefined

    const notes = await window.showInputBox({
      prompt: 'Provide the notes for the task (optional)',
      placeHolder: 'Notes for the task',
      value: undefined,
      ignoreFocusOut: true,
    })

    const due = await askForDueDate()
    if (due === undefined) return undefined

    gTaskTreeProvider.addTask({
      tasklist: node.taskList.id,
      requestBody: {title, notes, due: due || undefined},
    })
  },
  'googleTasks.addSubTask': async (node: GTask) => {
    if (node.task.id === null) return

    const title = await window.showInputBox({
      prompt: 'Provide a title for the subtask',
      placeHolder: 'SubTask title',
      value: undefined,
      ignoreFocusOut: true,
    })
    if (title === undefined || title.length === 0) return undefined

    const due = await askForDueDate()
    if (due === undefined) return undefined

    gTaskTreeProvider.addTask({
      tasklist: node.taskListId,
      parent: node.task.id,
      requestBody: {title, due: due || undefined},
    })
  },
  'googleTasks.deleteTask': async (node: GTask) => {
    if (node.task.id) gTaskTreeProvider.deleteTask({tasklist: node.taskListId, task: node.task.id})
  },
  'googleTasks.completeTask': async (node: GTask) => {
    if (node.task.id)
      gTaskTreeProvider.patchTask({
        tasklist: node.taskListId,
        task: node.task.id,
        requestBody: {
          status: 'completed',
          hidden: true,
        },
      })
  },
  'googleTasks.renameTask': async (node: GTask) => {
    if (!node.task.id) return

    const title = await window.showInputBox({
      prompt: 'Provide a title for the task',
      placeHolder: 'Task title',
      value: node?.task?.title || undefined,
      ignoreFocusOut: true,
    })
    if (title === undefined || title.length === 0) return

    gTaskTreeProvider.patchTask({
      tasklist: node.taskListId,
      task: node.task.id,
      requestBody: {title},
    })
  },
  'googleTasks.editTaskJson': async (node: GTask) => {
    if (!node.task.id) return

    const uri = buildTaskUri(node.taskListId, node.task.id)
    let document = await workspace.openTextDocument(uri)
    if (document.languageId !== 'json')
      document = await languages.setTextDocumentLanguage(document, 'json')
    await window.showTextDocument(document, {preview: false})
  },
}

export function registerCommands(): void {
  Object.entries(commandsList).forEach(([command, handler]) =>
    commands.registerCommand(command, sendTelemetry(command, handler))
  )
}

function sendTelemetry(command: string, handler: Function) {
  return function () {
    telemetry.sendTelemetryEvent(command.replace('googleTasks.', ''))
    return handler(...arguments)
  }
}

async function askForDueDate(): Promise<string | null | undefined> {
  const value = await window.showInputBox({
    prompt: 'Provide due date/time (RFC3339, e.g., 2025-12-01 or 2025-12-01T15:00:00Z)',
    placeHolder: 'Optional: 2025-12-01 or 2025-12-01T15:00:00Z',
    value: undefined,
    ignoreFocusOut: true,
  })
  if (value === undefined) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const normalized = normalizeDueInput(trimmed)
  if (!normalized) {
    window.showErrorMessage('Invalid due date. Use RFC3339 like 2025-12-01 or 2025-12-01T15:00:00Z')
    return undefined
  }
  return normalized
}

function normalizeDueInput(raw: string): string | undefined {
  const dateLike = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00Z` : raw
  if (Number.isNaN(Date.parse(dateLike))) return undefined
  return dateLike
}

function buildTaskUri(taskListId: string, taskId: string): Uri {
  const encodedList = encodeURIComponent(taskListId)
  const encodedTask = encodeURIComponent(taskId)
  return Uri.parse(`${taskJsonScheme}:/${encodedList}/${encodedTask}.json`)
}
