import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function ProductsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new CategoryPage with all products view
    navigate('/categories/all', { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
  );
}
