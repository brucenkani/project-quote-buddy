import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecurringInvoice {
  id: string;
  user_id: string;
  company_id: string;
  customer_id: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  next_invoice_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  notes: string | null;
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

    console.log('Starting recurring invoice generation...');

    const today = new Date().toISOString().split('T')[0];
    
    // Get all active recurring invoices that are due
    const { data: recurringInvoices, error: fetchError } = await supabase
      .from('recurring_invoices')
      .select('*')
      .eq('status', 'active')
      .lte('next_invoice_date', today);

    if (fetchError) {
      console.error('Error fetching recurring invoices:', fetchError);
      throw fetchError;
    }

    if (!recurringInvoices || recurringInvoices.length === 0) {
      console.log('No recurring invoices due for generation');
      return new Response(
        JSON.stringify({ message: 'No invoices due', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${recurringInvoices.length} recurring invoices to process`);

    let generatedCount = 0;
    const errors: string[] = [];

    for (const recurring of recurringInvoices as RecurringInvoice[]) {
      try {
        // Generate next invoice number
        const { data: lastInvoice } = await supabase
          .from('invoices')
          .select('invoice_number')
          .eq('company_id', recurring.company_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        let nextNumber = 1;
        if (lastInvoice?.invoice_number) {
          const match = lastInvoice.invoice_number.match(/INV-(\d+)/);
          if (match) {
            nextNumber = parseInt(match[1]) + 1;
          }
        }
        const invoiceNumber = `INV-${String(nextNumber).padStart(5, '0')}`;

        // Get invoice line items (if stored separately)
        const { data: lineItems } = await supabase
          .from('recurring_invoice_line_items')
          .select('*')
          .eq('recurring_invoice_id', recurring.id);

        // Create new invoice
        const newInvoice = {
          user_id: recurring.user_id,
          company_id: recurring.company_id,
          invoice_number: invoiceNumber,
          customer_id: recurring.customer_id,
          issue_date: today,
          due_date: calculateDueDate(today, 30), // 30 days default
          subtotal: recurring.subtotal,
          tax_amount: recurring.tax_amount,
          total_amount: recurring.total_amount,
          status: 'unpaid',
          notes: recurring.notes,
          terms: 'Net 30',
        };

        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert(newInvoice)
          .select()
          .single();

        if (invoiceError) {
          console.error(`Error creating invoice for recurring ${recurring.id}:`, invoiceError);
          errors.push(`Failed to create invoice for recurring ${recurring.id}: ${invoiceError.message}`);
          continue;
        }

        // If we have line items, insert them
        if (lineItems && lineItems.length > 0 && invoice) {
          const invoiceLineItems = lineItems.map(item => ({
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
            amount: item.amount,
          }));

          const { error: lineItemsError } = await supabase
            .from('invoice_line_items')
            .insert(invoiceLineItems);

          if (lineItemsError) {
            console.error(`Error creating line items for invoice ${invoice.id}:`, lineItemsError);
          }
        }

        // Calculate next generation date
        const nextDate = calculateNextDate(recurring.next_invoice_date, recurring.frequency);

        // Update recurring invoice with next generation date
        const { error: updateError } = await supabase
          .from('recurring_invoices')
          .update({ 
            next_invoice_date: nextDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', recurring.id);

        if (updateError) {
          console.error(`Error updating recurring invoice ${recurring.id}:`, updateError);
          errors.push(`Failed to update recurring ${recurring.id}: ${updateError.message}`);
        } else {
          generatedCount++;
          console.log(`Generated invoice ${invoiceNumber} from recurring ${recurring.id}`);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error processing recurring invoice ${recurring.id}:`, error);
        errors.push(`Error processing recurring ${recurring.id}: ${errorMessage}`);
      }
    }

    const result = {
      success: true,
      message: `Successfully generated ${generatedCount} invoices`,
      count: generatedCount,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('Recurring invoice generation complete:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in generate-recurring-invoices function:', error);
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

function calculateDueDate(issueDate: string, daysTerm: number): string {
  const date = new Date(issueDate);
  date.setDate(date.getDate() + daysTerm);
  return date.toISOString().split('T')[0];
}