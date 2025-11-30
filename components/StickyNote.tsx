'use client'

import React, { useRef, useState } from 'react'
import { updateTaskContent } from '@/app/actions'

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
}

const colorClasses: Record<string, string> = {
    yellow: 'bg-yellow-200 hover:bg-yellow-100',
    blue: 'bg-blue-200 hover:bg-blue-100',
    pink: 'bg-pink-200 hover:bg-pink-100',
    green: 'bg-green-200 hover:bg-green-100',
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

export default function StickyNote({ task, index, onDragStart, onDragEnd, isDragging }: StickyNoteProps) {
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
                p-4 mb-4 rounded shadow-md cursor-move
                ${colorClasses[task.color] || colorClasses.yellow}
                ${isDragging ? 'opacity-50' : 'hover:-rotate-1 transition-transform'}
                text-gray-800 font-medium font-sans text-sm sm:text-base
                min-h-[100px] flex flex-col items-start justify-start text-left
            `}
        >
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
                            setIsEditing(true)
                            setDraftContent(task.content)
                        }
                    }}
                    autoFocus
                    className="w-full h-full resize-none bg-transparent border-none outline-none text-gray-800 font-medium font-sans text-sm sm:text-base"
                />
            ) : (
                <div onClick={handleClick} className='w-full h-full'>
                    {task.content}
                </div>
            )}
        </div>
    )
}
