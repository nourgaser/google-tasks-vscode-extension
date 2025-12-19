import * as vscode from 'vscode'
import {tasks_v1} from 'googleapis'

import gTaskTreeProvider from './TreeDataProviders/GTask/GTask.TreeDataProvider'

export const taskJsonScheme = 'gtask-json'

const debugChannel = vscode.window.createOutputChannel('Google Tasks (Debug)')

type EditableTaskFields = Pick<
  tasks_v1.Schema$Task,
  'title' | 'notes' | 'due' | 'status' | 'links' | 'hidden' | 'deleted' | 'parent'
>

type EditableTaskDocument = EditableTaskFields & {$schema?: string}

class TaskJsonFileSystemProvider implements vscode.FileSystemProvider {
  private _onDidChangeFile = new vscode.EventEmitter<vscode.FileChangeEvent[]>()
  readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._onDidChangeFile.event
  constructor(private schemaUri: vscode.Uri) {}

  watch(): vscode.Disposable {
    return new vscode.Disposable(() => {})
  }

  stat(): vscode.FileStat {
    return {type: vscode.FileType.File, ctime: 0, mtime: Date.now(), size: 0}
  }

  readDirectory(): [string, vscode.FileType][] {
    return []
  }

  createDirectory(): void {
    throw vscode.FileSystemError.NoPermissions('createDirectory is not supported')
  }

  delete(): void {
    throw vscode.FileSystemError.NoPermissions('delete is not supported')
  }

  rename(): void {
    throw vscode.FileSystemError.NoPermissions('rename is not supported')
  }

  async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    try {
      const {taskListId, taskId} = this.parseUri(uri)
      const service = gTaskTreeProvider.service
      if (!service) {
        const reason =
          'Google Tasks is still initializing. Open the Google Tasks view or sign in, then reload this document.'
        debugChannel.appendLine(`[gtask-json][readFile] uri=${uri.toString()} not-ready: ${reason}`)
        return this.buildNotReadyResponse(reason)
      }

      const {data} = await service.tasks.get({
        tasklist: taskListId,
        task: taskId,
      })

      const editable = this.toEditable(data)
      return Buffer.from(JSON.stringify(editable, null, 2), 'utf8')
    } catch (err) {
      debugChannel.appendLine(
        `[gtask-json][readFile] uri=${uri.toString()} error=${stringifyError(err)}`
      )
      throw err
    }
  }

  async writeFile(uri: vscode.Uri, content: Uint8Array): Promise<void> {
    try {
      const {taskListId, taskId} = this.parseUri(uri)
      const service = gTaskTreeProvider.service
      if (!service)
        throw vscode.FileSystemError.Unavailable('Google Tasks client is not initialized yet')

      const parsed = this.parseJson(content)
      const requestBody = this.buildPatchBody(parsed)

      await service.tasks.patch({tasklist: taskListId, task: taskId, requestBody})
      gTaskTreeProvider.refresh()
      this._onDidChangeFile.fire([{type: vscode.FileChangeType.Changed, uri}])
    } catch (err) {
      debugChannel.appendLine(
        `[gtask-json][writeFile] uri=${uri.toString()} error=${stringifyError(err)}`
      )
      throw err
    }
  }

  private parseUri(uri: vscode.Uri): {taskListId: string; taskId: string} {
    const segments = uri.path.replace(/^\//, '').split('/')
    const taskListId = segments[0] ? decodeURIComponent(segments[0]) : ''
    const taskId = segments[1] ? decodeURIComponent(segments[1].replace(/\.json$/, '')) : ''

    if (!taskListId || !taskId) throw vscode.FileSystemError.FileNotFound('Invalid task URI')

    return {taskListId, taskId}
  }

  private toEditable(task: tasks_v1.Schema$Task): EditableTaskDocument {
    return {
      $schema: this.schemaUri.toString(),
      title: task.title,
      notes: task.notes,
      due: task.due,
      status: task.status,
      links: task.links,
      hidden: task.hidden,
      deleted: task.deleted,
      parent: task.parent,
    }
  }

  private parseJson(content: Uint8Array): any {
    try {
      return JSON.parse(Buffer.from(content).toString('utf8'))
    } catch (err) {
      throw vscode.FileSystemError.Unavailable('Invalid JSON: unable to parse content')
    }
  }

  private buildPatchBody(input: any): EditableTaskFields {
    if (!input || typeof input !== 'object')
      throw vscode.FileSystemError.Unavailable('Expected a JSON object with task fields')

    const allowedKeys = new Set([
      '$schema',
      'title',
      'notes',
      'due',
      'status',
      'hidden',
      'deleted',
      'parent',
    ])
    const requestBody: EditableTaskFields = {}

    Object.keys(input).forEach(key => {
      if (!allowedKeys.has(key))
        throw vscode.FileSystemError.Unavailable(`Unsupported field: ${key}`)
    })

    if (input.$schema !== undefined) delete input.$schema
    if (input.links !== undefined) delete input.links
    if (input.title !== undefined) requestBody.title = input.title
    if (input.notes !== undefined) requestBody.notes = input.notes
    if (input.status !== undefined) {
      if (input.status !== 'needsAction' && input.status !== 'completed')
        throw vscode.FileSystemError.Unavailable('status must be "needsAction" or "completed"')
      requestBody.status = input.status
    }
    if (input.due !== undefined) requestBody.due = this.normalizeDue(input.due)
    if (input.hidden !== undefined) requestBody.hidden = Boolean(input.hidden)
    if (input.deleted !== undefined) requestBody.deleted = Boolean(input.deleted)
    if (input.parent !== undefined) requestBody.parent = input.parent

    return requestBody
  }

  private normalizeDue(due: any): string | undefined {
    if (due === null || due === undefined) return undefined
    if (typeof due !== 'string') throw vscode.FileSystemError.Unavailable('due must be a string')
    const trimmed = due.trim()
    if (!trimmed) return undefined

    const dateLike = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed}T00:00:00Z` : trimmed
    if (Number.isNaN(Date.parse(dateLike)))
      throw vscode.FileSystemError.Unavailable(
        'due must be RFC3339, e.g., 2025-12-01T15:00:00Z or 2025-12-01'
      )
    return dateLike
  }

  private buildNotReadyResponse(reason: string): Uint8Array {
    const placeholder = {
      $schema: this.schemaUri.toString(),
      error: reason,
      note: 'Once Google Tasks is ready, click Try Again or re-open to fetch live data.',
    }
    return Buffer.from(JSON.stringify(placeholder, null, 2), 'utf8')
  }
}

function stringifyError(err: unknown): string {
  if (!err) return 'Unknown error'
  if (err instanceof Error) return `${err.message}\n${err.stack || ''}`
  try {
    return JSON.stringify(err)
  } catch (_e) {
    return String(err)
  }
}

export function registerTaskJsonFileSystemProvider(context: vscode.ExtensionContext): void {
  const schemaUri = vscode.Uri.joinPath(context.extensionUri, 'schemas', 'gtask-task.schema.json')
  const provider = new TaskJsonFileSystemProvider(schemaUri)
  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider(taskJsonScheme, provider, {isCaseSensitive: true})
  )
}
