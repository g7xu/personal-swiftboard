const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function getSprintWeekLabel(weekStart: Date): string {
    const month = weekStart.getMonth()
    const year = weekStart.getFullYear()

    // Count which Monday of the month this is
    let weekNumber = 0
    const d = new Date(year, month, 1)
    while (d <= weekStart) {
        if (d.getDay() === 1) weekNumber++
        d.setDate(d.getDate() + 1)
    }
    // If weekStart is before the first Monday (starts in prev month's week), it's week 1
    if (weekNumber === 0) weekNumber = 1

    return `Week ${weekNumber} \u00b7 ${MONTHS[month]} ${year}`
}
