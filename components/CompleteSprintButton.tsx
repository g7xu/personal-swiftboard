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
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
                Complete Sprint
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
