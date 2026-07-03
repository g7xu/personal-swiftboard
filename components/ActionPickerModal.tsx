'use client'

import { completeSprint } from '@/app/actions'
import { Task } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const colorClasses: Record<string, string> = {
    yellow: 'bg-note-yellow',
    blue: 'bg-note-blue',
    pink: 'bg-note-pink',
    green: 'bg-note-green',
}

interface ActionPickerModalProps {
    sprintId: string
    tasks: Task[]
    onClose: () => void
}

export default function ActionPickerModal({ sprintId, tasks, onClose }: ActionPickerModalProps) {
    const router = useRouter()
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isCompleting, setIsCompleting] = useState(false)

    const actionTasks = tasks.filter(t => t.status === 'Action')
    const mustSelectExactly3 = actionTasks.length >= 3
    const canConfirm = mustSelectExactly3
        ? selectedIds.size === 3
        : selectedIds.size === actionTasks.length

    // Auto-select all if fewer than 3
    const effectiveSelectedIds = mustSelectExactly3
        ? selectedIds
        : new Set(actionTasks.map(t => t.id))

    const toggleTask = (taskId: string) => {
        if (!mustSelectExactly3) return
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(taskId)) {
                next.delete(taskId)
            } else if (next.size < 3) {
                next.add(taskId)
            }
            return next
        })
    }

    const handleConfirm = async () => {
        setIsCompleting(true)
        try {
            await completeSprint(sprintId, Array.from(effectiveSelectedIds))
            router.push('/sprints')
            router.refresh()
        } catch (error) {
            console.error('Failed to complete sprint:', error)
            setIsCompleting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-ink/35 backdrop-blur-[2px] z-50 flex items-center justify-center">
            <div className="bg-paper rounded-md shadow-2xl p-8 max-w-2xl w-full mx-4">
                <h2 className="font-print text-sm font-bold uppercase tracking-[0.16em] text-ink mb-2 text-center">
                    Complete sprint
                </h2>

                {actionTasks.length === 0 ? (
                    <>
                        <p className="text-ink/60 mb-6 text-center font-hand text-xl">
                            No action notes to carry forward — the week will be stamped completed.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isCompleting}
                                className="flex-1 px-6 py-3 border border-ink/25 text-ink rounded-sm font-print text-[11px] font-bold uppercase tracking-[0.12em] hover:bg-ink/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isCompleting}
                                className="flex-1 px-6 py-3 bg-ink text-paper rounded-sm font-print text-[11px] font-bold uppercase tracking-[0.12em] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isCompleting ? 'Completing…' : 'Complete sprint'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-ink/60 mb-4 text-center font-hand text-xl">
                            {mustSelectExactly3
                                ? 'Pick 3 action notes to carry into next week.'
                                : `All ${actionTasks.length} action note${actionTasks.length !== 1 ? 's' : ''} will carry into next week.`
                            }
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-6 max-h-80 overflow-y-auto p-4">
                            {actionTasks.map((task, i) => {
                                const isSelected = mustSelectExactly3
                                    ? selectedIds.has(task.id)
                                    : true
                                const isDisabled = mustSelectExactly3 && !isSelected && selectedIds.size >= 3

                                return (
                                    <button
                                        key={task.id}
                                        type="button"
                                        onClick={() => toggleTask(task.id)}
                                        disabled={isDisabled || !mustSelectExactly3}
                                        className={`
                                            relative text-left note p-3 pt-6
                                            ${colorClasses[task.color] || colorClasses.yellow}
                                            text-ink font-hand text-lg leading-snug font-medium
                                            min-h-[80px] flex flex-col items-start justify-start
                                            transition-all duration-150
                                            ${i % 2 === 0 ? '[transform:rotate(-0.8deg)]' : '[transform:rotate(0.8deg)]'}
                                            ${isSelected ? 'ring-2 ring-ink scale-105 shadow-lg' : ''}
                                            ${isDisabled ? 'opacity-40 cursor-not-allowed' : mustSelectExactly3 ? 'cursor-pointer hover:shadow-lg' : 'cursor-default'}
                                        `}
                                    >
                                        {isSelected && (
                                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-ink rounded-full flex items-center justify-center shadow-md">
                                                <svg className="w-3.5 h-3.5 text-paper" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                        {task.content}
                                    </button>
                                )
                            })}
                        </div>

                        {mustSelectExactly3 && (
                            <p className="font-hand text-lg text-ink/50 mb-4 text-center">
                                {selectedIds.size} of 3 picked
                            </p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isCompleting}
                                className="flex-1 px-6 py-3 border border-ink/25 text-ink rounded-sm font-print text-[11px] font-bold uppercase tracking-[0.12em] hover:bg-ink/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isCompleting || (mustSelectExactly3 && !canConfirm)}
                                className="flex-1 px-6 py-3 bg-ink text-paper rounded-sm font-print text-[11px] font-bold uppercase tracking-[0.12em] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isCompleting ? 'Completing…' : 'Complete sprint'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
