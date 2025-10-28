-- Delete all journal entry lines first (foreign key constraint)
DELETE FROM journal_entry_lines;

-- Delete all journal entries
DELETE FROM journal_entries;