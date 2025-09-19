import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFarmers } from '../services/api';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import FarmerCard, { FarmerCardItem } from '../components/FarmerCard';

type FarmerListItem = FarmerCardItem;

type Paged<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function FarmersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading, isError } = useQuery<Paged<FarmerListItem>>({
    queryKey: ['farmers', { page, limit, q: search }],
    queryFn: async () => {
      const res = await getFarmers({ page, limit, q: search || undefined });
      const payload = res.data as unknown as {
        data?: FarmerListItem[];
        farmers?: FarmerListItem[];
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
      } | FarmerListItem[];
      const list = Array.isArray(payload)
        ? payload
        : (payload?.data ?? payload?.farmers ?? []);
      const curPage = Array.isArray(payload) ? page : (payload?.page ?? page);
      const curLimit = Array.isArray(payload) ? limit : (payload?.limit ?? limit);
      const total = Array.isArray(payload) ? list.length : (payload?.total ?? list.length);
      const totalPages = Array.isArray(payload)
        ? Math.max(1, Math.ceil(total / (curLimit || limit || 12)))
        : (payload?.totalPages ?? Math.max(1, Math.ceil(total / (curLimit || limit || 12))));
      return { data: list, page: curPage, limit: curLimit, total, totalPages } as Paged<FarmerListItem>;
    },
    keepPreviousData: true,
    staleTime: 2 * 60_000,
  });

  const list = useMemo(() => data?.data ?? [], [data]);
  const totalPages = useMemo(() => data?.totalPages ?? 1, [data]);

  return (
    <div className="bg-gradient-to-b from-emerald-50 to-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-green-700 text-center sm:text-left">
          🌾 Meet Our Farmers
        </h1>
        <div className="relative w-full sm:w-80">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or farm..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none shadow-sm"
          />
        </div>
      </div>

  {/* Loading & Error */}
      {isLoading && <div className="py-20 text-center text-lg animate-pulse">🌱 Loading farmers…</div>}
      {isError && <div className="py-20 text-center text-red-600 text-lg">❌ Failed to load farmers.</div>}

      {/* Farmers Grid */}
      {!isLoading && !isError && (
        list.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
              {list.map(f => (
                <div
                  key={f._id}
                  className="transition-transform duration-200 hover:scale-105 hover:shadow-xl"
                >
                  <FarmerCard farmer={f} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 shadow-sm w-full sm:w-auto"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Previous
              </button>
              <span className="text-sm font-semibold text-gray-700 text-center">
                Page {page} of {totalPages}
              </span>
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 shadow-sm w-full sm:w-auto"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next →
              </button>
            </div>
          </>
        ) : (
          <div className="py-20 text-center text-gray-600 text-lg">
            🌾 No farmers found. Try another search.
          </div>
        )
      )}
      </div>
    </div>
  );
}

export default FarmersPage;