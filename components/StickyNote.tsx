'use client'

import React, { useRef } from 'react'

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

    const handleDragStart = (e: React.DragEvent) => {
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

    return (
        <div
            ref={dragRef}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={`
                p-4 mb-4 rounded shadow-md cursor-move
                ${colorClasses[task.color] || colorClasses.yellow}
                ${isDragging ? 'opacity-50' : 'hover:-rotate-1 transition-transform'}
                text-gray-800 font-medium font-sans text-sm sm:text-base
                min-h-[100px] flex items-center justify-center text-center
            `}
        >
            {task.content}
        </div>
    )
}
