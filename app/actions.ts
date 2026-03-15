'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

async function getSessionUser() {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }
    return session.user
}

export async function getCurrentSprint() {
    const user = await getSessionUser()

    let sprint = await prisma.sprint.findFirst({
        where: { status: 'ACTIVE', userId: user.id },
        include: { tasks: true },
        orderBy: { createdAt: 'desc' },
    })

    if (!sprint) {
        sprint = await prisma.sprint.create({
            data: {
                weekStart: new Date(),
                theme: 'New Sprint',
                userId: user.id!,
            },
            include: { tasks: true },
        })
    }

    return sprint
}

async function verifyTaskOwnership(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { sprint: true },
    })
    if (!task || task.sprint.userId !== userId) {
        throw new Error('Unauthorized')
    }
    return task
}

export async function createTask(content: string, sprintId: string, category: string = 'Not Sure') {
    const user = await getSessionUser()

    const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } })
    if (!sprint || sprint.userId !== user.id) {
        throw new Error('Unauthorized')
    }

    await prisma.task.create({
        data: {
            content,
            sprintId,
            status: category,
            color: 'yellow',
        },
    })
    revalidatePath('/')
}

export async function updateTaskStatus(taskId: string, newStatus: string) {
    const user = await getSessionUser()
    await verifyTaskOwnership(taskId, user.id!)

    await prisma.task.update({
        where: { id: taskId },
        data: { status: newStatus },
    })
    revalidatePath('/')
}

export async function deleteTask(taskId: string) {
    const user = await getSessionUser()
    await verifyTaskOwnership(taskId, user.id!)

    await prisma.task.delete({
        where: { id: taskId },
    })
    revalidatePath('/')
}

export async function updateTaskColor(taskId: string, color: string) {
    const user = await getSessionUser()
    await verifyTaskOwnership(taskId, user.id!)

    await prisma.task.update({
        where: { id: taskId },
        data: { color },
    })
    revalidatePath('/')
}

export async function updateTaskContent(taskId: string, content: string) {
    const user = await getSessionUser()
    await verifyTaskOwnership(taskId, user.id!)

    await prisma.task.update({
        where: { id: taskId },
        data: { content },
    })
    revalidatePath('/')
}
