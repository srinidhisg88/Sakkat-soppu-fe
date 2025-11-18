interface ShimmerProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Shimmer = ({ className = '', width = 'w-full', height = 'h-4' }: ShimmerProps) => {
  return (
    <div
      className={`${width} ${height} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded ${className}`}
    />
  );
};

export const ProductCardShimmer = () => {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
      <Shimmer width="w-full" height="h-48" className="rounded-none" />
      <div className="p-4 space-y-3">
        <Shimmer width="w-3/4" height="h-4" />
        <Shimmer width="w-1/2" height="h-3" />
        <div className="flex justify-between items-center pt-2">
          <Shimmer width="w-20" height="h-6" />
          <Shimmer width="w-24" height="h-9" className="rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export const ListItemShimmer = () => {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-100">
      <Shimmer width="w-20" height="h-20" className="rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Shimmer width="w-2/3" height="h-4" />
        <Shimmer width="w-1/2" height="h-3" />
        <Shimmer width="w-1/4" height="h-5" />
      </div>
    </div>
  );
};
