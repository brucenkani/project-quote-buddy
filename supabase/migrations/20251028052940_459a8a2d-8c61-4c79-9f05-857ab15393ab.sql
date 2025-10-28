
-- Delete the journal entry with blank reference (duplicate of INV-00001)
DELETE FROM journal_entry_lines
WHERE journal_entry_id = '371d9208-6a6b-4796-92d4-a3a876d4cdcb';

DELETE FROM journal_entries
WHERE id = '371d9208-6a6b-4796-92d4-a3a876d4cdcb';
