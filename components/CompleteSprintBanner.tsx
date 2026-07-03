'use client'

import { Sprint, Task } from '@prisma/client'
import { useState } from 'react'
import ActionPickerModal from './ActionPickerModal'
import { getSprintWeekLabel } from '@/lib/sprintLabel'

interface CompleteSprintBannerProps {
    staleSprint: Sprint & { tasks: Task[] }
}

export default function CompleteSprintBanner({ staleSprint }: CompleteSprintBannerProps) {
    const [showPicker, setShowPicker] = useState(false)

    if (showPicker) {
        return (
            <ActionPickerModal
                sprintId={staleSprint.id}
                tasks={staleSprint.tasks}
                onClose={() => setShowPicker(false)}
            />
        )
    }

    const taskCount = staleSprint.tasks.length

    return (
        <div className="fixed inset-0 bg-ink/35 backdrop-blur-[2px] z-50 flex items-center justify-center">
            <div className="bg-paper rounded-md shadow-2xl p-8 max-w-md w-full mx-4 text-center">
                <span className="stamp stamp-muted mb-4">Unfinished</span>
                <h2 className="font-print text-sm font-bold uppercase tracking-[0.16em] text-ink mt-3 mb-2">
                    Last week is still open
                </h2>
                <p className="text-ink/60 mb-5 font-hand text-xl leading-snug">
                    Close it out before starting this week&apos;s board.
                </p>
                <div className="bg-desk/50 rounded-sm p-4 mb-6 text-left">
                    <p className="text-sm text-ink/80">
                        <span className="font-semibold">Sprint:</span>{' '}
                        {getSprintWeekLabel(new Date(staleSprint.weekStart))}
                    </p>
                    {staleSprint.theme && (
                        <p className="text-sm text-ink/80 mt-1">
                            <span className="font-semibold">Theme:</span> {staleSprint.theme}
                        </p>
                    )}
                    <p className="text-sm text-ink/80 mt-1">
                        <span className="font-semibold">Notes:</span> {taskCount}
                    </p>
                </div>
                <button
                    onClick={() => setShowPicker(true)}
                    className="w-full px-6 py-3 bg-ink text-paper rounded-sm font-print text-[11px] font-bold uppercase tracking-[0.12em] hover:opacity-90 transition-opacity cursor-pointer"
                >
                    Complete &amp; archive
                </button>
            </div>
        </div>
    )
}
