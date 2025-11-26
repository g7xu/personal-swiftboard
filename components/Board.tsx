'use client'

import { useState, useEffect } from 'react'
import Column from './Column'
import { updateTaskStatus, createTask } from '@/app/actions'

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

    const handleDrop = async (targetStatus: string) => {
        if (!draggedTaskId) return

        const task = tasks.find(t => t.id === draggedTaskId)
        if (!task || task.status === targetStatus) {
            setDraggedTaskId(null)
            return
        }

        // Optimistic update
        const updatedTasks = tasks.map(t =>
            t.id === draggedTaskId ? { ...t, status: targetStatus } : t
        )
        setTasks(updatedTasks)
        setDraggedTaskId(null)

        // Server action
        await updateTaskStatus(draggedTaskId, targetStatus)
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
            <div className="flex flex-col sm:flex-row gap-6 overflow-x-auto pb-4 h-full">
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
                    />
                ))}
            </div>
        </div>
    )
}
