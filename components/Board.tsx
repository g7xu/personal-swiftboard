'use client'

import { useState, useEffect } from 'react'
import Column from './Column'
import { updateTaskStatus, createTask, deleteTask } from '@/app/actions'

import { Task, Sprint } from '@prisma/client'

interface BoardProps {
    initialSprint: Sprint & { tasks: Task[] }
}

const COLUMNS = ['Throne', 'Rose', 'Seed', 'Action']

export default function Board({ initialSprint }: BoardProps) {
    const [tasks, setTasks] = useState<Task[]>(initialSprint.tasks)
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)

    const handleDragStart = (taskId: string) => {
        setDraggedTaskId(taskId)
    }

    const handleDragEnd = () => {
        setDraggedTaskId(null)
    }

    const handleDrop = async (targetStatus: string, taskId: string) => {
        if (!taskId) return

        const task = tasks.find(t => t.id === taskId)
        if (task) {
            // Task is in local state (board-to-board drag)
            if (task.status === targetStatus) {
                setDraggedTaskId(null)
                return
            }
            // Optimistic update
            const updatedTasks = tasks.map(t =>
                t.id === taskId ? { ...t, status: targetStatus } : t
            )
            setTasks(updatedTasks)
        }
        setDraggedTaskId(null)

        // Server action (handles both board-to-board and playground-to-board)
        await updateTaskStatus(taskId, targetStatus)
    }

    const handleDelete = async (taskId: string) => {
        // Optimistic removal
        setTasks(prev => prev.filter(t => t.id !== taskId))
        await deleteTask(taskId)
    }

    const handleAddTask = async (content: string, status: string) => {
        await createTask(content, initialSprint.id, status)
    }

    // Sync state with props when they change (due to revalidation)
    useEffect(() => {
        setTasks(initialSprint.tasks)
    }, [initialSprint])

    const getTasksByStatus = (status: string) => {
        return tasks.filter((t) => t.status === status)
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-col sm:flex-row gap-5 overflow-x-auto pb-4 h-full">
                {COLUMNS.map((col) => (
                    <Column
                        key={col}
                        id={col}
                        title={col}
                        tasks={getTasksByStatus(col)}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDrop={handleDrop}
                        draggedTaskId={draggedTaskId}
                        onDelete={handleDelete}
                        onAddTask={handleAddTask}
                    />
                ))}
            </div>
        </div>
    )
}
