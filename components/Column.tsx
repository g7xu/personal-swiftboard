'use client'

import { useState, useRef, useEffect } from 'react'
import StickyNote from './StickyNote'
import { Task } from '@prisma/client'

interface PendingAnalysis {
    original: string
    suggested: string
}

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
    readOnly?: boolean
    pendingAnalyses?: Map<string, PendingAnalysis>
    analyzingTaskId?: string | null
    onAnalyzeSingle?: (taskId: string) => void
    onKeep?: (taskId: string) => void
    onRevert?: (taskId: string) => void
}

// Each column is a taped-off region of the desk; the caption says what belongs there
const COLUMN_META: Record<string, { caption: string; tapeTilt: string }> = {
    Thorn: { caption: 'what stung this week', tapeTilt: '-1.5deg' },
    Rose: { caption: 'what bloomed', tapeTilt: '1deg' },
    Seed: { caption: 'worth planting', tapeTilt: '-1deg' },
    Action: { caption: 'to do next', tapeTilt: '1.5deg' },
}

export default function Column({ id, title, tasks, onDragStart, onDragEnd, onDrop, draggedTaskId, onDelete, onAddTask, readOnly = false, pendingAnalyses, analyzingTaskId, onAnalyzeSingle, onKeep, onRevert }: ColumnProps) {
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

    const meta = COLUMN_META[title] ?? { caption: '', tapeTilt: '0deg' }

    return (
        <div className="flex flex-col min-w-0">
            <div className="mb-5 text-center">
                <span className="tape" style={{ transform: `rotate(${meta.tapeTilt})` }}>
                    {title} · {tasks.length}
                </span>
                <p className="mt-1.5 font-hand text-lg leading-none text-ink/55">{meta.caption}</p>
            </div>
            <div
                onDragOver={readOnly ? undefined : handleDragOver}
                onDragLeave={readOnly ? undefined : handleDragLeave}
                onDrop={readOnly ? undefined : handleDrop}
                className={`
                    flex-1 min-h-[420px] transition-colors rounded-md p-2 -m-2
                    ${isDragOver ? 'bg-ink/[0.06] outline-dashed outline-2 outline-ink/30' : ''}
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
                        onDelete={readOnly || task.isCarriedAction ? undefined : onDelete}
                        readOnly={readOnly}
                        pendingAnalysis={pendingAnalyses?.get(task.id)}
                        isAnalyzing={analyzingTaskId === task.id}
                        onAnalyze={onAnalyzeSingle}
                        onKeep={onKeep}
                        onRevert={onRevert}
                    />
                ))}

                {/* Inline add card */}
                {!readOnly && (
                    isAdding ? (
                        <div className="note bg-paper p-3 pt-6">
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
                                placeholder="Write it down…"
                                className="w-full resize-none border-none outline-none font-hand text-xl leading-snug text-ink placeholder:text-ink/35 bg-transparent"
                                rows={3}
                            />
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={handleAddSubmit}
                                    className="px-3 py-1 bg-ink text-paper font-print text-[10px] font-bold uppercase tracking-[0.1em] rounded-sm hover:opacity-90 transition-opacity cursor-pointer"
                                >
                                    Stick it
                                </button>
                                <button
                                    onClick={() => { setIsAdding(false); setNewContent('') }}
                                    className="px-3 py-1 text-ink/60 font-print text-[10px] font-bold uppercase tracking-[0.1em] rounded-sm hover:bg-ink/5 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full mt-1 min-h-[64px] rounded-sm border-2 border-dashed border-ink/25 text-ink/50 hover:border-ink/45 hover:text-ink/75 font-hand text-lg transition-colors cursor-pointer"
                        >
                            + stick a note
                        </button>
                    )
                )}
            </div>
        </div>
    )
}
