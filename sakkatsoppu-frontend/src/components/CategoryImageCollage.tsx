

interface CategoryImageCollageProps {
  categoryName: string;
  className?: string;
}

export function CategoryImageCollage({ categoryName, className = '' }: CategoryImageCollageProps) {
  // Generate Unsplash image URL based on category name
  const getUnsplashImage = (category: string) => {
    const searchTerm = category.toLowerCase().replace(/\s+/g, '-');
    return `https://source.unsplash.com/400x400/?${searchTerm},fresh,organic`;
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="relative w-full aspect-square overflow-hidden rounded-lg shadow-md bg-gray-100">
        <img
          src={getUnsplashImage(categoryName)}
          alt={categoryName}
          className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      {/* Category name below image */}
      <h3 className="mt-3 text-center font-semibold text-gray-800 text-sm md:text-base">
        {categoryName}
      </h3>
    </div>
  );
}
