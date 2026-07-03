'use client'

import { Task } from '@prisma/client'
import { useState } from 'react'
import ActionPickerModal from './ActionPickerModal'

interface CompleteSprintButtonProps {
    sprintId: string
    tasks: Task[]
}

export default function CompleteSprintButton({ sprintId, tasks }: CompleteSprintButtonProps) {
    const [showModal, setShowModal] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-ink text-paper font-print text-[11px] font-bold uppercase tracking-[0.12em] rounded-sm hover:opacity-90 transition-opacity cursor-pointer"
            >
                Complete sprint
            </button>

            {showModal && (
                <ActionPickerModal
                    sprintId={sprintId}
                    tasks={tasks}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    )
}
