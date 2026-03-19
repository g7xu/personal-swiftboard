'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { updateTaskContent } from '@/app/actions'
import { Pencil, Trash2 } from 'lucide-react'

interface StickyNoteProps {
    task: {
        id: string
        content: string
        color: string
        isCarriedAction?: boolean
    }
    index: number
    onDragStart: (taskId: string) => void
    onDragEnd: () => void
    isDragging: boolean
    onDelete?: (taskId: string) => void
    onAssign?: (taskId: string, status: string) => void
    readOnly?: boolean
}

const colorClasses: Record<string, string> = {
    yellow: 'bg-yellow-100 hover:bg-yellow-50',
    blue: 'bg-blue-100 hover:bg-blue-50',
    pink: 'bg-pink-100 hover:bg-pink-50',
    green: 'bg-green-100 hover:bg-green-50',
}

function createDragImage(element: HTMLElement, dragEvent: React.DragEvent) {
    const rect = element.getBoundingClientRect()
    const offsetX = dragEvent.clientX - rect.left
    const offsetY = dragEvent.clientY - rect.top

    // Create a custom drag image
    const dragImage = element.cloneNode(true) as HTMLElement
    dragImage.style.width = `${rect.width}px`
    dragImage.style.height = `${rect.height}px`
    dragImage.style.boxSizing = 'border-box'
    dragImage.style.position = 'absolute'
    dragImage.style.top = '-9999px'

    document.body.appendChild(dragImage)
    dragEvent.dataTransfer.setDragImage(dragImage, offsetX, offsetY)

    // Clean up after a short delay
    setTimeout(() => {
        if (document.body.contains(dragImage)) {
            document.body.removeChild(dragImage)
        }
    }, 0)
}

const assignButtons = [
    { status: 'Throne', label: 'Throne', color: 'bg-yellow-200 hover:bg-yellow-300' },
    { status: 'Rose', label: 'Rose', color: 'bg-pink-200 hover:bg-pink-300' },
    { status: 'Seed', label: 'Seed', color: 'bg-green-200 hover:bg-green-300' },
    { status: 'Action', label: 'Action', color: 'bg-blue-200 hover:bg-blue-300' },
]

export default function StickyNote({ task, index, onDragStart, onDragEnd, isDragging, onDelete, onAssign, readOnly = false }: StickyNoteProps) {
    const dragRef = useRef<HTMLDivElement>(null)

    const [isEditing, setIsEditing] = useState(false)
    const [draftContent, setDraftContent] = useState(task.content)
    const [isSaving, setIsSaving] = useState(false)
    const [showAssignButtons, setShowAssignButtons] = useState(false)

    // handle drag and drop
    const handleDragStart = (e: React.DragEvent) => {
        if (isEditing) {
            e.preventDefault()
            return
        }

        onDragStart(task.id)
        if (dragRef.current) {
            createDragImage(dragRef.current, e)
        }
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', task.id)
    }

    const handleDragEnd = () => {
        onDragEnd()
    }

    // Close assign buttons on click outside or Escape
    const closeAssignButtons = useCallback(() => setShowAssignButtons(false), [])

    useEffect(() => {
        if (!showAssignButtons) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeAssignButtons()
        }
        const handleClickOutside = (e: MouseEvent) => {
            if (dragRef.current && !dragRef.current.contains(e.target as Node)) {
                closeAssignButtons()
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showAssignButtons, closeAssignButtons])

    // handle click edit or toggle assign buttons
    const handleClick = () => {
        if (isEditing || isSaving) return
        if (task.isCarriedAction) return
        if (onAssign) {
            setShowAssignButtons(prev => !prev)
        } else {
            setIsEditing(true)
            setDraftContent(task.content)
        }
    }

    const handleSubmit = async () => {
        const trimmedContent = draftContent.trim()

        if (!trimmedContent || task.content === trimmedContent) {
            setIsEditing(false)
            return
        }

        setIsSaving(true)
        try {
            await updateTaskContent(task.id, trimmedContent)
        } catch (error) {
            console.log("Failed to edit the task:", error)
        } finally {
            setIsEditing(false)
            setIsSaving(false)
        }

    }

    return (
        <div
            ref={dragRef}
            draggable={!isEditing && !readOnly}
            onDragStart={readOnly ? undefined : handleDragStart}
            onDragEnd={readOnly ? undefined : handleDragEnd}
            onClick={readOnly ? undefined : handleClick}
            className={`
                group relative
                p-2 mb-4 rounded-[5px] shadow-swiftboard ${readOnly ? 'cursor-default' : 'cursor-move'}
                ${colorClasses[task.color] || colorClasses.yellow}
                ${isDragging ? 'opacity-50' : 'hover:shadow-lg transition-shadow'}
                text-gray-800 font-normal text-sm sm:text-base
                min-h-[80px] flex flex-col items-start justify-start text-left
            `}
        >
            {/* Edit/Delete icons - visible on hover, hidden for carried actions */}
            {!isEditing && !readOnly && !task.isCarriedAction && (
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowAssignButtons(false)
                            setIsEditing(true)
                            setDraftContent(task.content)
                        }}
                        className="p-1 rounded hover:bg-black/10 transition-colors"
                        title="Edit"
                    >
                        <Pencil size={14} className="text-gray-600" />
                    </button>
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete(task.id)
                            }}
                            className="p-1 rounded hover:bg-black/10 transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={14} className="text-gray-600" />
                        </button>
                    )}
                </div>
            )}

            {isEditing ? (
                <textarea
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    onBlur={handleSubmit}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSubmit()
                        } else if (e.key === 'Escape') {
                            setIsEditing(false)
                            setDraftContent(task.content)
                        }
                    }}
                    autoFocus
                    className="w-full h-full resize-none bg-transparent border-none outline-none text-gray-800 font-normal text-sm sm:text-base"
                />
            ) : (
                <div className='w-full h-full'>
                    {task.content}
                </div>
            )}

            {showAssignButtons && onAssign && (
                <div className="flex gap-1 mt-2 w-full flex-wrap">
                    {assignButtons.map(({ status, label, color }) => (
                        <button
                            key={status}
                            onClick={(e) => {
                                e.stopPropagation()
                                onAssign(task.id, status)
                            }}
                            className={`flex-1 min-w-0 px-1 py-1 text-xs font-medium rounded ${color} text-gray-700 transition-colors`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
