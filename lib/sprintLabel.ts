const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function getSprintWeekLabel(weekStart: Date): string {
    const month = weekStart.getUTCMonth()
    const year = weekStart.getUTCFullYear()
    const date = weekStart.getUTCDate()

    // Count which Monday of the month this date falls on
    let weekNumber = 0
    for (let day = 1; day <= date; day++) {
        const d = new Date(Date.UTC(year, month, day))
        if (d.getUTCDay() === 1) weekNumber++
    }
    // If weekStart is before the first Monday (starts in prev month's week), it's week 1
    if (weekNumber === 0) weekNumber = 1

    return `Week ${weekNumber} \u00b7 ${MONTHS[month]} ${year}`
}
