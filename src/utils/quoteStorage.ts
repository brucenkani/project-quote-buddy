import { Quote } from '@/types/quote';

const STORAGE_KEY = 'quotebuilder-quotes';

export const loadQuotes = (): Quote[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load quotes:', error);
  }
  return [];
};

export const saveQuotes = (quotes: Quote[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
  } catch (error) {
    console.error('Failed to save quotes:', error);
  }
};

export const saveQuote = (quote: Quote): void => {
  const quotes = loadQuotes();
  const index = quotes.findIndex(q => q.id === quote.id);
  if (index >= 0) {
    quotes[index] = quote;
  } else {
    quotes.push(quote);
  }
  saveQuotes(quotes);
};

export const deleteQuote = (id: string): void => {
  const quotes = loadQuotes().filter(q => q.id !== id);
  saveQuotes(quotes);
};

export const generateNextQuoteNumber = (): string => {
  const quotes = loadQuotes();
  if (quotes.length === 0) {
    return 'QTE-0001';
  }
  
  // Extract numbers from existing quote IDs
  const numbers = quotes
    .map(q => {
      const match = q.id.match(/QTE-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => n > 0);
  
  const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
  const nextNumber = maxNumber + 1;
  
  return `QTE-${String(nextNumber).padStart(4, '0')}`;
};
