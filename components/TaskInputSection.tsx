'use client'

import { useState, useRef } from 'react'
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
    const inputRef = useRef<HTMLInputElement>(null)
    const categorySelectorRef = useRef<{ focus: () => void }>(null)

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTaskContent.trim()) return

        await createTask(newTaskContent, initialSprint.id, selectedCategory)
        setNewTaskContent('')
        setSelectedCategory('Not Sure')
        // Refocus input after creating task
        inputRef.current?.focus()
    }

    // Wrapper for category selector Enter key (no event parameter)
    const handleCategoryEnter = () => {
        if (!newTaskContent.trim()) return
        
        const syntheticEvent = {
            preventDefault: () => {},
        } as React.FormEvent
        
        handleCreateTask(syntheticEvent)
    }

    // Handle Down Arrow in input - move to category selector
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            categorySelectorRef.current?.focus()
        }
    }

    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)

    // Filter tasks for playground
    const playgroundTasks = initialSprint.tasks.filter(t => t.status === 'Not Sure')

    return (
        <div className="flex flex-col lg:flex-row gap-6 w-full h-full">
            {/* Left Side: Form */}
            <div className="flex flex-col gap-4 lg:w-1/2">
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

            {/* Right Side: Playground */}
            <div className="flex-1 lg:w-1/2 min-h-[400px]">
                <div className="h-full">
                    <h3 className="text-[22px] font-bold text-gray-800 mb-2">Playground</h3>
                    <div className="flex-1 relative bg-[#f8f7f6] rounded-[5px] border border-gray-200 overflow-y-auto min-h-[400px] max-h-[600px]">
                        <div className="p-4">
                            {playgroundTasks.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <p className="text-center">
                                        No uncategorized tasks.<br />
                                        Create a task with "Not Sure" category to see it here.
                                    </p>
                                </div>
                            ) : (
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
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
