import * as vscode from 'vscode'
import * as path from 'path'
import {tasks_v1} from 'googleapis'

import {RootPath} from '../../../RootPath'

type NodeType = 'task' | 'taskList' | 'completedTask' | 'completedTaskList'

export class GTask extends vscode.TreeItem {
  contextValue = 'GTask'

  constructor(
    public taskListId: string,
    public task: tasks_v1.Schema$Task,
    public children: tasks_v1.Schema$Task[] = []
  ) {
    super(
      task.title || 'No Title Provided',
      children.length
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None
    )
    if (task.parent) this.contextValue += 'SubItem'

    if (task.id)
      this.command = {
        command: 'googleTasks.editTaskJson',
        title: 'Edit Task',
        arguments: [this],
      }
  }

  // Overrides
  // @ts-ignore
  get tooltip(): string {
    return this.task.notes || this.task.title || 'No Title Provided'
  }

  // Overrides
  // @ts-ignore
  get description(): string {
    const hasChildren = Boolean(this.children.length)
    const hasNotes = Boolean(this.task.notes)
    const parts: string[] = []
    if (hasChildren) parts.push(this.children.length.toString())
    const due = this.formatDue(this.task.due)
    if (due) parts.push(`due ${due}`)
    if (this.task.status === 'completed') parts.push('completed')
    if (hasNotes) parts.push(this.task.notes as string)
    return parts.join(' · ')
  }
  // Overrides
  // @ts-ignore
  get iconPath() {
    const icon = `icon-task-${this.task.completed ? 'completed.svg' : 'incomplete.svg'}`
    return {
      light: path.join(RootPath.path, 'resources', `light-${icon}`),
      dark: path.join(RootPath.path, 'resources', `dark-${icon}`),
    }
  }

  private formatDue(due?: string | null): string | undefined {
    if (!due) return undefined
    const parsed = new Date(due)
    if (Number.isNaN(parsed.getTime())) return due
    return parsed.toISOString().slice(0, 10)
  }
}
