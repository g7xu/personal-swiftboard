'use client'

import { useState } from 'react'
import { createTask } from '@/app/actions'

import { Task, Sprint } from '@prisma/client'

interface BoardProps {
    initialSprint: Sprint & { tasks: Task[] }
}

export default function Board({ initialSprint }: BoardProps) {
    const [newTaskContent, setNewTaskContent] = useState('')


    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTaskContent.trim()) return

        await createTask(newTaskContent, initialSprint.id)
        setNewTaskContent('')
    }

    return (
        <div className="flex flex-col h-full">
            <div className="mb-8 flex justify-center">
                <form onSubmit={handleCreateTask} className="flex gap-2 w-full max-w-md">
                    <input
                        type="text"
                        value={newTaskContent}
                        onChange={(e) => setNewTaskContent(e.target.value)}
                        placeholder="Add a new sticky note..."
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-md hover:bg-blue-700 transition-colors"
                    >
                        Add
                    </button>
                </form>
            </div>
        </div>
    )
}
