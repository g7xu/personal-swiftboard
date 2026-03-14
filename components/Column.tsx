'use client'

import { useState, useRef, useEffect } from 'react'
import StickyNote from './StickyNote'
import { Task } from '@prisma/client'

interface ColumnProps {
    id: string
    title: string
    tasks: Task[]
    onDragStart: (taskId: string) => void
    onDragEnd: () => void
    onDrop: (status: string, taskId: string) => void
    draggedTaskId: string | null
    onDelete: (taskId: string) => void
    onAddTask: (content: string, status: string) => void
}

export default function Column({ id, title, tasks, onDragStart, onDragEnd, onDrop, draggedTaskId, onDelete, onAddTask }: ColumnProps) {
    const [isDragOver, setIsDragOver] = useState(false)
    const [isAdding, setIsAdding] = useState(false)
    const [newContent, setNewContent] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (isAdding && textareaRef.current) {
            textareaRef.current.focus()
        }
    }, [isAdding])

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)
        const taskId = e.dataTransfer.getData('text/plain')
        if (taskId) {
            onDrop(id, taskId)
        }
    }

    const handleAddSubmit = () => {
        const trimmed = newContent.trim()
        if (!trimmed) {
            setIsAdding(false)
            setNewContent('')
            return
        }
        onAddTask(trimmed, id)
        setNewContent('')
        setIsAdding(false)
    }

    return (
        <div className="flex flex-col w-full sm:w-1/4 min-w-[250px] bg-white rounded-[5px] p-4 border border-gray-100">
            <h2 className="text-[22px] font-bold text-gray-800 mb-4 text-center border-b border-gray-100 pb-2">
                {title}
            </h2>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    flex-1 min-h-[500px] transition-colors rounded-lg p-2
                    ${isDragOver ? 'bg-gray-50' : ''}
                `}
            >
                {tasks.map((task, index) => (
                    <StickyNote
                        key={task.id}
                        task={task}
                        index={index}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        isDragging={draggedTaskId === task.id}
                        onDelete={onDelete}
                    />
                ))}

                {/* Inline add card */}
                {isAdding ? (
                    <div className="p-2 bg-white rounded-[5px] shadow-swiftboard border border-gray-100">
                        <textarea
                            ref={textareaRef}
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleAddSubmit()
                                } else if (e.key === 'Escape') {
                                    setIsAdding(false)
                                    setNewContent('')
                                }
                            }}
                            placeholder="Enter task content..."
                            className="w-full resize-none border-none outline-none text-sm text-gray-800 bg-transparent"
                            rows={3}
                        />
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={handleAddSubmit}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                            >
                                Add
                            </button>
                            <button
                                onClick={() => { setIsAdding(false); setNewContent('') }}
                                className="px-3 py-1 text-gray-500 text-sm rounded hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full mt-2 py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors text-center"
                    >
                        + Add a card
                    </button>
                )}
            </div>
        </div>
    )
}
