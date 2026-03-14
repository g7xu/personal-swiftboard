'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createTask, deleteTask, updateTaskStatus } from '@/app/actions'
import { Task, Sprint } from '@prisma/client'
import CategorySelector, {Category} from './CategorySelector'
import StickyNote from './StickyNote'

interface TaskInputSectionProps {
    initialSprint: Sprint & { tasks: Task[] }
}

export default function TaskInputSection({ initialSprint }: TaskInputSectionProps) {
    const [newTaskContent, setNewTaskContent] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<Category>('Not Sure')
    const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const categorySelectorRef = useRef<{ focus: () => void }>(null)
    const fabRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)

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

    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)

    const playgroundTasks = initialSprint.tasks.filter(t => t.status === 'Not Sure')

    // Close panel on click outside
    const handleClickOutside = useCallback((e: MouseEvent) => {
        if (
            panelRef.current && !panelRef.current.contains(e.target as Node) &&
            fabRef.current && !fabRef.current.contains(e.target as Node)
        ) {
            setIsPlaygroundOpen(false)
        }
    }, [])

    // Close panel on Escape
    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsPlaygroundOpen(false)
        }
    }, [])

    useEffect(() => {
        if (isPlaygroundOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            document.addEventListener('keydown', handleEscape)
            return () => {
                document.removeEventListener('mousedown', handleClickOutside)
                document.removeEventListener('keydown', handleEscape)
            }
        }
    }, [isPlaygroundOpen, handleClickOutside, handleEscape])

    return (
        <div className="relative w-full">
            {/* FAB - top right */}
            {playgroundTasks.length > 0 && (
                <button
                    ref={fabRef}
                    onClick={() => setIsPlaygroundOpen(!isPlaygroundOpen)}
                    className="fixed top-6 right-6 w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center shadow-md text-gray-700 font-semibold text-sm z-50"
                    title="Playground"
                >
                    {playgroundTasks.length}
                </button>
            )}

            {/* Playground dropdown panel */}
            {isPlaygroundOpen && playgroundTasks.length > 0 && (
                <div
                    ref={panelRef}
                    className="fixed top-20 right-6 w-[500px] bg-[#f8f7f6] rounded-[5px] border border-gray-200 shadow-lg z-50 max-h-[70vh] overflow-y-auto"
                >
                    <div className="p-4">
                        <h3 className="text-[16px] font-bold text-gray-800 mb-3">Playground</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {playgroundTasks.map((task, index) => (
                                <StickyNote
                                    key={task.id}
                                    task={task}
                                    index={index}
                                    onDragStart={(taskId) => setDraggedTaskId(taskId)}
                                    onDragEnd={() => setDraggedTaskId(null)}
                                    isDragging={draggedTaskId === task.id}
                                    onDelete={(taskId) => deleteTask(taskId)}
                                    onAssign={(taskId, status) => updateTaskStatus(taskId, status)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Form - full width, centered */}
            <div className="w-full max-w-2xl mx-auto">
                <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
                    <input
                        ref={inputRef}
                        type="text"
                        value={newTaskContent}
                        onChange={(e) => setNewTaskContent(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        placeholder="Add a new sticky note..."
                        className="w-full px-4 py-2 rounded-[5px] border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 bg-white"
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
                        className="px-6 py-2 bg-blue-600 text-white rounded-[5px] font-medium shadow-swiftboard hover:bg-blue-700 transition-colors"
                    >
                        Add Task
                    </button>
                </form>
            </div>
        </div>
    )
}
