import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecurringJournal {
  id: string;
  user_id: string;
  company_id: string;
  description: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  next_generation_date: string;
  status: string;
  reference: string | null;
}

interface JournalLine {
  account_id: string;
  account_name: string;
  debit: number;
  credit: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting recurring journal entry generation...');

    const today = new Date().toISOString().split('T')[0];
    
    // Get all active recurring journals that are due
    const { data: recurringJournals, error: fetchError } = await supabase
      .from('recurring_journals')
      .select('*')
      .eq('status', 'active')
      .lte('next_generation_date', today);

    if (fetchError) {
      console.error('Error fetching recurring journals:', fetchError);
      throw fetchError;
    }

    if (!recurringJournals || recurringJournals.length === 0) {
      console.log('No recurring journals due for generation');
      return new Response(
        JSON.stringify({ message: 'No journals due', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${recurringJournals.length} recurring journals to process`);

    let generatedCount = 0;
    const errors: string[] = [];

    for (const recurring of recurringJournals as RecurringJournal[]) {
      try {
        // Generate next entry number
        const { data: lastEntry } = await supabase
          .from('journal_entries')
          .select('entry_number')
          .eq('company_id', recurring.company_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        let nextNumber = 1;
        if (lastEntry?.entry_number) {
          const match = lastEntry.entry_number.match(/JE-(\d+)/);
          if (match) {
            nextNumber = parseInt(match[1]) + 1;
          }
        }
        const entryNumber = `JE-${String(nextNumber).padStart(5, '0')}`;

        // Get journal lines for this recurring journal
        const { data: lines, error: linesError } = await supabase
          .from('recurring_journal_lines')
          .select('*')
          .eq('recurring_journal_id', recurring.id);

        if (linesError || !lines || lines.length === 0) {
          console.error(`No lines found for recurring journal ${recurring.id}`);
          errors.push(`No lines found for recurring journal ${recurring.id}`);
          continue;
        }

        // Create new journal entry
        const newJournalEntry = {
          user_id: recurring.user_id,
          company_id: recurring.company_id,
          entry_number: entryNumber,
          date: today,
          description: recurring.description,
          reference: recurring.reference || `Auto-generated from recurring journal`,
          is_manual: false,
        };

        const { data: journalEntry, error: entryError } = await supabase
          .from('journal_entries')
          .insert(newJournalEntry)
          .select()
          .single();

        if (entryError || !journalEntry) {
          console.error(`Error creating journal entry for recurring ${recurring.id}:`, entryError);
          errors.push(`Failed to create journal entry for recurring ${recurring.id}: ${entryError?.message}`);
          continue;
        }

        // Insert journal lines
        const journalLines = (lines as JournalLine[]).map(line => ({
          journal_entry_id: journalEntry.id,
          account_id: line.account_id,
          account_name: line.account_name,
          debit: line.debit,
          credit: line.credit,
        }));

        const { error: linesInsertError } = await supabase
          .from('journal_entry_lines')
          .insert(journalLines);

        if (linesInsertError) {
          console.error(`Error creating journal lines for entry ${journalEntry.id}:`, linesInsertError);
          // Rollback: delete the journal entry
          await supabase.from('journal_entries').delete().eq('id', journalEntry.id);
          errors.push(`Failed to create journal lines for ${recurring.id}: ${linesInsertError.message}`);
          continue;
        }

        // Calculate next generation date
        const nextDate = calculateNextDate(recurring.next_generation_date, recurring.frequency);

        // Update recurring journal with next generation date
        const { error: updateError } = await supabase
          .from('recurring_journals')
          .update({ 
            next_generation_date: nextDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', recurring.id);

        if (updateError) {
          console.error(`Error updating recurring journal ${recurring.id}:`, updateError);
          errors.push(`Failed to update recurring ${recurring.id}: ${updateError.message}`);
        } else {
          generatedCount++;
          console.log(`Generated journal entry ${entryNumber} from recurring ${recurring.id}`);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error processing recurring journal ${recurring.id}:`, error);
        errors.push(`Error processing recurring ${recurring.id}: ${errorMessage}`);
      }
    }

    const result = {
      success: true,
      message: `Successfully generated ${generatedCount} journal entries`,
      count: generatedCount,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('Recurring journal generation complete:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in generate-recurring-journals function:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateNextDate(currentDate: string, frequency: string): string {
  const date = new Date(currentDate);
  
  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  
  return date.toISOString().split('T')[0];
}