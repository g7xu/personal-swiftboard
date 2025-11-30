'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getCurrentSprint() {
    let sprint = await prisma.sprint.findFirst({
        where: { status: 'ACTIVE' },
        include: { tasks: true },
        orderBy: { createdAt: 'desc' },
    })

    if (!sprint) {
        // Create a new active sprint if none exists
        sprint = await prisma.sprint.create({
            data: {
                weekStart: new Date(),
                theme: 'New Sprint',
                tasks: {
                    create: [],
                },
            },
            include: { tasks: true },
        })
    }

    return sprint
}

export async function createTask(content: string, sprintId: string) {
    await prisma.task.create({
        data: {
            content,
            sprintId,
            status: 'Throne', // Default column
            color: 'yellow',
        },
    })
    revalidatePath('/')
}

export async function updateTaskStatus(taskId: string, newStatus: string) {
    await prisma.task.update({
        where: { id: taskId },
        data: { status: newStatus },
    })
    revalidatePath('/')
}

export async function deleteTask(taskId: string) {
    await prisma.task.delete({
        where: { id: taskId },
    })
    revalidatePath('/')
}

export async function updateTaskColor(taskId: string, color: string) {
    await prisma.task.update({
        where: { id: taskId },
        data: { color },
    })
    revalidatePath('/')
}

export async function updateTaskContent(taskId: string, content: string) {
    await prisma.task.update({
        where: { id: taskId },
        data: { content },
    })
    revalidatePath('/')
}