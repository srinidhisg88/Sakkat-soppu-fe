import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

// Create a compact page list with ellipses: 1 … (p-1) p (p+1) … total
function getPageItems(current: number, total: number) {
  const siblings = 1;
  const boundary = 1;
  const pages: (number | 'ellipsis')[] = [];

  const left = Math.max(current - siblings, boundary + 1);
  const right = Math.min(current + siblings, total - boundary);

  // Left boundary
  pages.push(...range(1, Math.min(boundary, total)));
  if (left > boundary + 1) pages.push('ellipsis');

  // Middle window
  if (left <= right) pages.push(...range(left, right));

  // Right boundary
  if (right < total - boundary) pages.push('ellipsis');
  if (total > 1) pages.push(...range(Math.max(total - boundary + 1, 2), total));

  // Deduplicate consecutive numbers
  const cleaned: (number | 'ellipsis')[] = [];
  for (const p of pages) {
    const last = cleaned[cleaned.length - 1];
    if (p === 'ellipsis' && last === 'ellipsis') continue;
    if (typeof p === 'number' && typeof last === 'number' && p === last) continue;
    cleaned.push(p);
  }
  return cleaned;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, className }) => {
  if (totalPages <= 1) return null;
  const items = getPageItems(currentPage, totalPages);

  const go = (p: number) => () => {
    if (p < 1 || p > totalPages || p === currentPage) return;
    onPageChange(p);
    // Scroll to top after page change
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // noop
    }
  };

  return (
    <nav className={className} aria-label="Pagination">
      <ul className="flex items-center justify-center gap-1 sm:gap-2">
        <li>
          <button
            onClick={go(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`px-3 py-2 rounded-lg border text-sm sm:text-base ${currentPage <= 1 ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            aria-label="Previous page"
          >
            Prev
          </button>
        </li>
        {items.map((it, idx) => (
          <li key={`${it}-${idx}`}>
            {it === 'ellipsis' ? (
              <span className="px-2 sm:px-3 text-gray-500">…</span>
            ) : (
              <button
                onClick={go(it)}
                aria-current={it === currentPage ? 'page' : undefined}
                className={`px-3 py-2 rounded-lg border text-sm sm:text-base ${
                  it === currentPage
                    ? 'bg-green-600 text-white border-green-600'
                    : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {it}
              </button>
            )}
          </li>
        ))}
        <li>
          <button
            onClick={go(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`px-3 py-2 rounded-lg border text-sm sm:text-base ${currentPage >= totalPages ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            aria-label="Next page"
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;
