'use client'

import { useState, useEffect } from 'react'
import Column from './Column'
import { updateTaskStatus, createTask, deleteTask, analyzeAllTasks, analyzeTask, keepAnalysis, keepAllAnalyses } from '@/app/actions'
import { Sparkles, Loader2 } from 'lucide-react'

import { Task, Sprint } from '@prisma/client'

interface BoardProps {
    initialSprint: Sprint & { tasks: Task[] }
    readOnly?: boolean
}

interface PendingAnalysis {
    original: string
    suggested: string
}

const COLUMNS = ['Thorn', 'Rose', 'Seed', 'Action']

export default function Board({ initialSprint, readOnly = false }: BoardProps) {
    const [tasks, setTasks] = useState<Task[]>(initialSprint.tasks)
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
    const [pendingAnalyses, setPendingAnalyses] = useState<Map<string, PendingAnalysis>>(new Map())
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analyzingTaskId, setAnalyzingTaskId] = useState<string | null>(null)
    const [analyzeProgress, setAnalyzeProgress] = useState<{ current: number; total: number } | null>(null)

    const reviewMode = pendingAnalyses.size > 0

    const handleDragStart = (taskId: string) => {
        setDraggedTaskId(taskId)
    }

    const handleDragEnd = () => {
        setDraggedTaskId(null)
    }

    const handleDrop = async (targetStatus: string, taskId: string) => {
        if (!taskId) return

        const task = tasks.find(t => t.id === taskId)
        if (task) {
            // Carried actions can only move between Thorn and Rose
            if (task.isCarriedAction && !['Thorn', 'Rose'].includes(targetStatus)) {
                setDraggedTaskId(null)
                return
            }
            // Task is in local state (board-to-board drag)
            if (task.status === targetStatus) {
                setDraggedTaskId(null)
                return
            }
            // Optimistic update
            const updatedTasks = tasks.map(t =>
                t.id === taskId ? { ...t, status: targetStatus } : t
            )
            setTasks(updatedTasks)
        }
        setDraggedTaskId(null)

        // Server action (handles both board-to-board and playground-to-board)
        await updateTaskStatus(taskId, targetStatus)
    }

    const handleDelete = async (taskId: string) => {
        // Optimistic removal
        setTasks(prev => prev.filter(t => t.id !== taskId))
        await deleteTask(taskId)
    }

    const handleAddTask = async (content: string, status: string) => {
        await createTask(content, initialSprint.id, status)
    }

    // Sync state with props when they change (due to revalidation)
    useEffect(() => {
        setTasks(initialSprint.tasks)
    }, [initialSprint])

    const getTasksByStatus = (status: string) => {
        return tasks.filter((t) => t.status === status)
    }

    // Analyze All
    const handleAnalyzeAll = async () => {
        setIsAnalyzing(true)
        try {
            const eligibleTasks = tasks.filter(
                (t) => !t.isCarriedAction && t.status !== 'Not Sure' && t.analyzedAt === null
            )
            setAnalyzeProgress({ current: 0, total: eligibleTasks.length })

            const results = await analyzeAllTasks(initialSprint.id)
            const newPending = new Map(pendingAnalyses)
            for (const r of results) {
                const task = tasks.find(t => t.id === r.taskId)
                if (task) {
                    newPending.set(r.taskId, { original: task.content, suggested: r.suggestedContent })
                }
            }
            setPendingAnalyses(newPending)
        } finally {
            setIsAnalyzing(false)
            setAnalyzeProgress(null)
        }
    }

    // Analyze single note
    const handleAnalyzeSingle = async (taskId: string) => {
        setAnalyzingTaskId(taskId)
        try {
            const result = await analyzeTask(taskId)
            if (result) {
                const task = tasks.find(t => t.id === result.taskId)
                if (task) {
                    const newPending = new Map(pendingAnalyses)
                    newPending.set(result.taskId, { original: task.content, suggested: result.suggestedContent })
                    setPendingAnalyses(newPending)
                }
            }
        } finally {
            setAnalyzingTaskId(null)
        }
    }

    // Keep single analysis
    const handleKeep = async (taskId: string) => {
        const pending = pendingAnalyses.get(taskId)
        if (!pending) return
        await keepAnalysis(taskId, pending.suggested)
        // Update local task state so it won't be re-analyzed
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, content: pending.suggested, analyzedAt: new Date() } : t
        ))
        const newPending = new Map(pendingAnalyses)
        newPending.delete(taskId)
        setPendingAnalyses(newPending)
    }

    // Revert single analysis
    const handleRevert = (taskId: string) => {
        const newPending = new Map(pendingAnalyses)
        newPending.delete(taskId)
        setPendingAnalyses(newPending)
    }

    // Keep All
    const handleKeepAll = async () => {
        const updates = Array.from(pendingAnalyses.entries()).map(([taskId, p]) => ({
            taskId,
            content: p.suggested,
        }))
        await keepAllAnalyses(updates)
        // Update local task state so they won't be re-analyzed
        setTasks(prev => prev.map(t => {
            const pending = pendingAnalyses.get(t.id)
            return pending ? { ...t, content: pending.suggested, analyzedAt: new Date() } : t
        }))
        setPendingAnalyses(new Map())
    }

    // Revert All
    const handleRevertAll = () => {
        setPendingAnalyses(new Map())
    }

    return (
        <div className="flex flex-col h-full">
            {/* Analyze bar */}
            {!readOnly && (
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={handleAnalyzeAll}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-[5px] hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                {analyzeProgress
                                    ? `Analyzing ${analyzeProgress.current}/${analyzeProgress.total}...`
                                    : 'Analyzing...'}
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                Analyze All
                            </>
                        )}
                    </button>
                    {reviewMode && (
                        <>
                            <button
                                onClick={handleKeepAll}
                                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-[5px] hover:bg-green-700 transition-colors cursor-pointer"
                            >
                                Keep All
                            </button>
                            <button
                                onClick={handleRevertAll}
                                className="px-4 py-2 bg-gray-400 text-white text-sm font-medium rounded-[5px] hover:bg-gray-500 transition-colors cursor-pointer"
                            >
                                Revert All
                            </button>
                            <span className="text-sm text-gray-500">
                                {pendingAnalyses.size} pending
                            </span>
                        </>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 pb-4 h-full">
                {COLUMNS.map((col) => (
                    <Column
                        key={col}
                        id={col}
                        title={col}
                        tasks={getTasksByStatus(col)}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDrop={handleDrop}
                        draggedTaskId={draggedTaskId}
                        onDelete={handleDelete}
                        onAddTask={handleAddTask}
                        readOnly={readOnly}
                        pendingAnalyses={pendingAnalyses}
                        analyzingTaskId={analyzingTaskId}
                        onAnalyzeSingle={handleAnalyzeSingle}
                        onKeep={handleKeep}
                        onRevert={handleRevert}
                    />
                ))}
            </div>
        </div>
    )
}
