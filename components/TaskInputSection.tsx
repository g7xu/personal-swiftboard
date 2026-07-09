'use client'

import { useState, useRef } from 'react'
import { createTask, deleteTask, updateTaskStatus } from '@/app/actions'
import { Task, Sprint } from '@prisma/client'
import CategorySelector, { Category } from './CategorySelector'
import StickyNote from './StickyNote'

interface TaskInputSectionProps {
    initialSprint: Sprint & { tasks: Task[] }
    readOnly?: boolean
}

export default function TaskInputSection({ initialSprint, readOnly = false }: TaskInputSectionProps) {
    const [newTaskContent, setNewTaskContent] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<Category>('Not Sure')
    const inputRef = useRef<HTMLInputElement>(null)
    const categorySelectorRef = useRef<{ focus: () => void }>(null)
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTaskContent.trim()) return

        await createTask(newTaskContent, initialSprint.id, selectedCategory)
        setNewTaskContent('')
        setSelectedCategory('Not Sure')
        inputRef.current?.focus()
    }

    const handleCategoryEnter = () => {
        if (!newTaskContent.trim()) return

        const syntheticEvent = {
            preventDefault: () => {},
        } as React.FormEvent

        handleCreateTask(syntheticEvent)
    }

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            categorySelectorRef.current?.focus()
        }
    }

    const playgroundTasks = initialSprint.tasks.filter(t => t.status === 'Not Sure')

    if (readOnly) return null

    return (
        <>
            {/* Unsorted pile — same pad of paper, stacked above the capture bar */}
            {playgroundTasks.length > 0 && (
                <div className="w-full bg-paper/85 rounded-md p-4 mb-4 shadow-[0_2px_10px_-4px_rgba(46,43,35,0.35)]">
                    <p className="font-print text-[10px] font-bold uppercase tracking-[0.16em] text-ink/60 mb-2">
                        Unsorted pile · {playgroundTasks.length} — click a note to sort it
                    </p>
                    <div className="flex gap-4 overflow-x-auto pb-2 items-start">
                        {playgroundTasks.map((task, index) => (
                            <div key={task.id} className="w-56 shrink-0">
                                <StickyNote
                                    task={task}
                                    index={index}
                                    onDragStart={(taskId) => setDraggedTaskId(taskId)}
                                    onDragEnd={() => setDraggedTaskId(null)}
                                    isDragging={draggedTaskId === task.id}
                                    onDelete={(taskId) => deleteTask(taskId)}
                                    onAssign={(taskId, status) => updateTaskStatus(taskId, status)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Capture bar — a fresh pad of paper */}
            <div className="w-full bg-paper/85 rounded-md p-4 shadow-[0_2px_10px_-4px_rgba(46,43,35,0.35)]">
                <form onSubmit={handleCreateTask} className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <input
                        ref={inputRef}
                        type="text"
                        value={newTaskContent}
                        onChange={(e) => setNewTaskContent(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        placeholder="Jot something down…"
                        className="flex-1 min-w-0 bg-transparent font-hand text-2xl text-ink placeholder:text-ink/35 border-b-2 border-ink/15 focus:border-ink/60 outline-none px-1 py-1 transition-colors"
                    />

                    <CategorySelector
                        ref={categorySelectorRef}
                        selectedCategory={selectedCategory}
                        onCategoryChange={setSelectedCategory}
                        onEnter={handleCategoryEnter}
                        inputRef={inputRef}
                    />

                    <button
                        type="submit"
                        className="px-5 py-2 bg-ink text-paper font-print text-[11px] font-bold uppercase tracking-[0.12em] rounded-sm hover:opacity-90 transition-opacity cursor-pointer"
                    >
                        Pin it
                    </button>
                </form>
            </div>

        </>
    )
}
