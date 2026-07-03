'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { updateTaskContent } from '@/app/actions'
import { Pencil, Trash2, Sparkles, Loader2, Check, Undo2 } from 'lucide-react'

interface PendingAnalysis {
    original: string
    suggested: string
}

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
    pendingAnalysis?: PendingAnalysis
    isAnalyzing?: boolean
    onAnalyze?: (taskId: string) => void
    onKeep?: (taskId: string) => void
    onRevert?: (taskId: string) => void
}

const colorClasses: Record<string, string> = {
    yellow: 'bg-note-yellow',
    blue: 'bg-note-blue',
    pink: 'bg-note-pink',
    green: 'bg-note-green',
}

// Deterministic tilt per note, like paper stuck by hand (±1.6°)
function tiltFor(id: string): string {
    let h = 0
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
    const angle = ((Math.abs(h) % 100) / 100) * 3.2 - 1.6
    return `${angle.toFixed(2)}deg`
}

// Bold the "Field:" prefixes the AI analysis produces, keep everything handwritten
function renderContent(text: string) {
    return text.split('\n').map((line, i) => {
        const m = line.match(/^([A-Za-z][A-Za-z ]{0,24}):\s?(.*)$/)
        if (m) {
            return (
                <div key={i}>
                    <span className="font-bold">{m[1]}:</span> {m[2]}
                </div>
            )
        }
        return <div key={i}>{line || ' '}</div>
    })
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
    { status: 'Thorn', label: 'Thorn', color: 'bg-note-yellow' },
    { status: 'Rose', label: 'Rose', color: 'bg-note-pink' },
    { status: 'Seed', label: 'Seed', color: 'bg-note-green' },
    { status: 'Action', label: 'Action', color: 'bg-note-blue' },
]

export default function StickyNote({ task, index, onDragStart, onDragEnd, isDragging, onDelete, onAssign, readOnly = false, pendingAnalysis, isAnalyzing, onAnalyze, onKeep, onRevert }: StickyNoteProps) {
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
        if (isEditing || isSaving || pendingAnalysis) return
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

    const displayContent = pendingAnalysis ? pendingAnalysis.suggested : task.content

    return (
        <div
            ref={dragRef}
            draggable={!isEditing && !readOnly}
            onDragStart={readOnly ? undefined : handleDragStart}
            onDragEnd={readOnly ? undefined : handleDragEnd}
            onClick={readOnly ? undefined : handleClick}
            style={{ '--tilt': tiltFor(task.id) } as React.CSSProperties}
            className={`
                group relative note note-enter
                p-3 pt-7 mb-5
                ${readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}
                ${colorClasses[task.color] || colorClasses.yellow}
                [transform:rotate(var(--tilt))] transition-[transform,box-shadow] duration-150
                ${isDragging
                    ? 'opacity-40'
                    : readOnly
                    ? ''
                    : 'hover:[transform:rotate(0deg)_translateY(-3px)] hover:shadow-xl'}
                ${pendingAnalysis ? 'ring-2 ring-ink/70 ring-offset-2 ring-offset-desk' : ''}
                text-ink min-h-[96px] flex flex-col items-start justify-start text-left
            `}
        >
            {/* Carried-over actions are marked like a re-pinned note */}
            {task.isCarriedAction && (
                <span className="absolute top-1.5 left-2.5 font-print text-[9px] font-bold uppercase tracking-[0.14em] text-ink/45">
                    Carried over
                </span>
            )}

            {/* AI suggestion flag */}
            {pendingAnalysis && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-paper px-2 py-0.5 font-print text-[9px] font-bold uppercase tracking-[0.14em] text-ink/70 shadow-sm [transform:translateX(-50%)_rotate(-2deg)]">
                    AI draft
                </span>
            )}

            {/* Edit/Delete/Analyze icons - visible on hover, hidden for carried actions */}
            {!isEditing && !readOnly && !task.isCarriedAction && !pendingAnalysis && (
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Analyze single note */}
                    {onAnalyze && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onAnalyze(task.id)
                            }}
                            disabled={isAnalyzing}
                            className="p-1 rounded hover:bg-ink/10 transition-colors cursor-pointer"
                            title="Analyze"
                        >
                            {isAnalyzing ? (
                                <Loader2 size={14} className="text-ink animate-spin" />
                            ) : (
                                <Sparkles size={14} className="text-ink/80" />
                            )}
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowAssignButtons(false)
                            setIsEditing(true)
                            setDraftContent(task.content)
                        }}
                        className="p-1 rounded hover:bg-ink/10 transition-colors cursor-pointer"
                        title="Edit"
                    >
                        <Pencil size={14} className="text-ink/70" />
                    </button>
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete(task.id)
                            }}
                            className="p-1 rounded hover:bg-ink/10 transition-colors cursor-pointer"
                            title="Delete"
                        >
                            <Trash2 size={14} className="text-ink/70" />
                        </button>
                    )}
                </div>
            )}

            {isEditing ? (
                <textarea
                    ref={(el) => {
                        if (el) {
                            el.style.height = 'auto'
                            el.style.height = el.scrollHeight + 'px'
                        }
                    }}
                    value={draftContent}
                    onChange={(e) => {
                        setDraftContent(e.target.value)
                        e.target.style.height = 'auto'
                        e.target.style.height = e.target.scrollHeight + 'px'
                    }}
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
                    className="w-full resize-none bg-transparent border-none outline-none text-ink font-hand text-xl leading-snug font-medium"
                />
            ) : (
                <div className="w-full h-full font-hand text-xl leading-snug font-medium">
                    {renderContent(displayContent)}
                </div>
            )}

            {/* Keep / Revert buttons for pending analysis */}
            {pendingAnalysis && onKeep && onRevert && (
                <div className="flex gap-2 mt-3 w-full">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onKeep(task.id)
                        }}
                        className="flex items-center gap-1 flex-1 justify-center px-2 py-1 font-print text-[10px] font-bold uppercase tracking-[0.1em] rounded-sm bg-ink text-paper hover:opacity-90 transition-opacity cursor-pointer"
                    >
                        <Check size={12} />
                        Keep
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onRevert(task.id)
                        }}
                        className="flex items-center gap-1 flex-1 justify-center px-2 py-1 font-print text-[10px] font-bold uppercase tracking-[0.1em] rounded-sm bg-paper/70 text-ink hover:bg-paper transition-colors cursor-pointer"
                    >
                        <Undo2 size={12} />
                        Revert
                    </button>
                </div>
            )}

            {showAssignButtons && onAssign && (
                <div className="flex gap-1.5 mt-3 w-full flex-wrap">
                    {assignButtons.map(({ status, label, color }) => (
                        <button
                            key={status}
                            onClick={(e) => {
                                e.stopPropagation()
                                onAssign(task.id, status)
                            }}
                            className={`flex-1 min-w-0 px-1 py-1 font-print text-[10px] font-bold uppercase tracking-[0.08em] rounded-sm border border-ink/15 ${color} text-ink hover:brightness-95 transition-[filter] cursor-pointer`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
