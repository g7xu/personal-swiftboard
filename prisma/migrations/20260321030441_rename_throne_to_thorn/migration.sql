-- Rename "Throne" to "Thorn" in existing task data
UPDATE "Task" SET status = 'Thorn' WHERE status = 'Throne';