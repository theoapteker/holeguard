export type DateRangeFilter = 'week' | 'month' | 'year' | 'all';

export const getDateRangeStart = (filter: DateRangeFilter): Date | null => {
  const now = new Date();

  switch (filter) {
    case 'week':
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return weekAgo;

    case 'month':
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      return monthAgo;

    case 'year':
      const yearAgo = new Date(now);
      yearAgo.setFullYear(now.getFullYear() - 1);
      return yearAgo;

    case 'all':
      return null;

    default:
      return null;
  }
};

export const formatDateRange = (filter: DateRangeFilter): string => {
  switch (filter) {
    case 'week':
      return 'Last 7 Days';
    case 'month':
      return 'Last Month';
    case 'year':
      return 'Last Year';
    case 'all':
      return 'All Time';
    default:
      return 'All Time';
  }
};
