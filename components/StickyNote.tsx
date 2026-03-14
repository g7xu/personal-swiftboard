'use client'

import React, { useRef, useState } from 'react'
import { updateTaskContent } from '@/app/actions'
import { Pencil, Trash2 } from 'lucide-react'

interface StickyNoteProps {
    task: {
        id: string
        content: string
        color: string
    }
    index: number
    onDragStart: (taskId: string) => void
    onDragEnd: () => void
    isDragging: boolean
    onDelete?: (taskId: string) => void
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

export default function StickyNote({ task, index, onDragStart, onDragEnd, isDragging, onDelete }: StickyNoteProps) {
    const dragRef = useRef<HTMLDivElement>(null)

    const [isEditing, setIsEditing] = useState(false)
    const [draftContent, setDraftContent] = useState(task.content)
    const [isSaving, setIsSaving] = useState(false)

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

    // handle click edit
    const handleClick = () => {
        if (!isEditing && !isSaving) {
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
            draggable={!isEditing}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={`
                group relative
                p-2 mb-4 rounded-[5px] shadow-swiftboard cursor-move
                ${colorClasses[task.color] || colorClasses.yellow}
                ${isDragging ? 'opacity-50' : 'hover:shadow-lg transition-shadow'}
                text-gray-800 font-normal text-sm sm:text-base
                min-h-[80px] flex flex-col items-start justify-start text-left
            `}
        >
            {/* Edit/Delete icons - visible on hover */}
            {!isEditing && (
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            handleClick()
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
        </div>
    )
}
