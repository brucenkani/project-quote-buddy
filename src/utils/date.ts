import { format } from 'date-fns';

export const formatLocalISO = (date: Date) => {
  // Formats date as YYYY-MM-DD in local time (avoids timezone shift from toISOString)
  return format(date, 'yyyy-MM-dd');
};
