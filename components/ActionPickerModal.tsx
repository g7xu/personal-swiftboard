'use client'

import { completeSprint } from '@/app/actions'
import { Task } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

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
        if (!mustSelectExactly3) return // Can't toggle when < 3, all are auto-selected
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
            router.push('/')
            router.refresh()
        } catch (error) {
            console.error('Failed to complete sprint:', error)
            setIsCompleting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 max-w-md w-full mx-4">
                <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
                    Complete Sprint
                </h2>

                {actionTasks.length === 0 ? (
                    <>
                        <p className="text-gray-500 mb-6 text-center">
                            No action tasks to carry forward. The sprint will be marked as completed.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isCompleting}
                                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isCompleting}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isCompleting ? 'Completing...' : 'Complete Sprint'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-gray-500 mb-4 text-center">
                            {mustSelectExactly3
                                ? 'Select 3 action tasks to carry forward as focus items for next week.'
                                : `All ${actionTasks.length} action task${actionTasks.length !== 1 ? 's' : ''} will be carried forward as focus items.`
                            }
                        </p>

                        <div className="flex flex-col gap-2 mb-6 max-h-64 overflow-y-auto">
                            {actionTasks.map(task => {
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
                                        className={`text-left p-3 rounded-md border transition-colors ${
                                            isSelected
                                                ? 'border-blue-400 bg-blue-50 text-gray-900'
                                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                        } ${isDisabled ? 'opacity-40 cursor-not-allowed' : mustSelectExactly3 ? 'cursor-pointer' : 'cursor-default'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                                isSelected
                                                    ? 'border-blue-500 bg-blue-500'
                                                    : 'border-gray-300'
                                            }`}>
                                                {isSelected && (
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className="text-sm">{task.content}</span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        {mustSelectExactly3 && (
                            <p className="text-xs text-gray-400 mb-4 text-center">
                                {selectedIds.size}/3 selected
                            </p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isCompleting}
                                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isCompleting || (mustSelectExactly3 && !canConfirm)}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isCompleting ? 'Completing...' : 'Complete Sprint'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
