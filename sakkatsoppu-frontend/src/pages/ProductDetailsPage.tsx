import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Product, Farmer, Category } from '../types';
import { deriveUnitLabel, derivePriceForUnit, formatWeightFromGrams } from '../utils/format';
import { getProduct, getFarmer, getCategories } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { useAddToCartBar } from '../hooks/useAddToCartBar';
import { useStockSubscription } from '../hooks/useStockSubscription';

export function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const { addToCart, updateQuantity, items } = useCart();
  const { isAuthenticated } = useAuth();
  const { show } = useToast();
  const { showBar } = useAddToCartBar();
  const navigate = useNavigate();
  const location = useRouterLocation();

  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: ['product', id],
    enabled: !!id,
    queryFn: async () => (await getProduct(id!)).data,
  });

  // Subscribe to current product and any cart items for live stock
  useStockSubscription([
    ...(product?._id ? [product._id] : []),
    ...items.map(i => i.product._id),
  ]);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories', 'list'],
    queryFn: async () => {
      const res = await getCategories();
      type CatEnvelope = { data?: Category[]; categories?: Category[] } | Category[];
      const payload = res.data as CatEnvelope;
      return (Array.isArray(payload) ? payload : payload?.data ?? payload?.categories ?? []) as Category[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: farmer, isLoading: farmerLoading } = useQuery<Farmer>({
    queryKey: ['farmer', product?.farmerId],
    enabled: !!product?.farmerId,
    queryFn: async () => {
      const fid = product?.farmerId;
      if (!fid) throw new Error('No farmer id');
      const res = await getFarmer(fid as string);
      return res.data;
    },
  });

  const handleAddToCart = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    try {
      const existingQty = items.find(i => i.productId === product._id)?.quantity || 0;
      const remaining = Math.max(0, (product.stock || 0) - existingQty);
      if (remaining <= 0) {
        show('No more stock available for this item', { type: 'warning' });
        return;
      }
      const reqQty = Math.min(quantity, remaining);
      if (reqQty < quantity) {
        show(`Only ${remaining} more pack(s) available. Added ${reqQty}.`, { type: 'warning' });
      }
  await addToCart(product._id, reqQty);
  // Count distinct products (not quantity)
  showBar(1);
    } catch (error) {
      console.error('Error adding to cart:', error);
      show('Failed to add to cart', { type: 'error' });
    }
  };

  // Build a robust image gallery from product fields (safe with undefined product)
  const galleryImages = useMemo(() => {
    const imgs = new Set<string>();
    const pushSafe = (v?: unknown) => {
      if (!v) return;
      if (Array.isArray(v)) {
        v.forEach((u) => {
          const s = typeof u === 'string' ? u : '';
          if (s) imgs.add(s);
        });
      } else if (typeof v === 'string') {
        imgs.add(v);
      }
    };

    if (product) {
      // Known fields
      pushSafe(product.imageUrl);
      pushSafe(product.images);

      // Possible alternative fields from backend variants
      const anyProduct = product as unknown as Record<string, unknown>;
      pushSafe(anyProduct.image);
      pushSafe(anyProduct.imageURLs);
      pushSafe(anyProduct.imageUrls);
      pushSafe(anyProduct.gallery);
    }

    return Array.from(imgs);
  }, [product]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [maxAspect, setMaxAspect] = useState<number | null>(null);

  const clampIdx = useCallback(
    (i: number) => {
      if (galleryImages.length === 0) return 0;
      return Math.max(0, Math.min(galleryImages.length - 1, i));
    },
    [galleryImages.length]
  );

  const showPrev = useCallback(() => {
    setCurrentIdx((i) => (i - 1 + galleryImages.length) % Math.max(1, galleryImages.length));
  }, [galleryImages.length]);

  const showNext = useCallback(() => {
    setCurrentIdx((i) => (i + 1) % Math.max(1, galleryImages.length));
  }, [galleryImages.length]);

  // Reset index via effect if gallery changes or index goes out of range
  useEffect(() => {
    if (galleryImages.length === 0) {
      if (currentIdx !== 0) setCurrentIdx(0);
      return;
    }
    if (currentIdx >= galleryImages.length) setCurrentIdx(0);
  }, [galleryImages.length, currentIdx]);

  // Compute the largest aspect ratio across images to prevent layout shift
  useEffect(() => {
    let cancelled = false;
    if (!galleryImages || galleryImages.length === 0) {
      setMaxAspect(1);
      return () => {
        cancelled = true;
      };
    }

    const loadRatios = async () => {
      const loaders = galleryImages.map(
        (src) =>
          new Promise<number>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const w = img.naturalWidth || 1;
              const h = img.naturalHeight || 1;
              resolve(h / w || 1);
            };
            img.onerror = () => resolve(1);
            img.src = src;
          })
      );
      const ratios = await Promise.all(loaders);
      if (!cancelled) {
        const maxR = Math.max(1, ...ratios);
        setMaxAspect(Number.isFinite(maxR) ? maxR : 1);
      }
    };

    loadRatios();
    return () => {
      cancelled = true;
    };
  }, [galleryImages]);

  const mainImage = (galleryImages[clampIdx(currentIdx)] || product?.imageUrl || '') as string;

  if (productLoading && !product) {
    return <div className="text-center py-8">Loading product details...</div>;
  }

  if (!product) {
    return <div className="text-center py-8">Product not found.</div>;
  }

  // Normalize stock and compute remaining considering cart
  const existingQty = items.find(i => i.productId === product._id)?.quantity || 0;
  const numericStock = Number((product as unknown as { stock?: unknown })?.stock ?? 0);
  const remaining = Math.max(0, numericStock - existingQty);
  const inCart = existingQty > 0;

  // Derive unit info
  const derivedUnitLabel = product ? deriveUnitLabel({ unitLabel: product.unitLabel, g: product.g ?? null, pieces: product.pieces ?? null }) : undefined;
  const derivedPriceFor = product ? derivePriceForUnit(product.price, { g: product.g ?? null, unitLabel: product.unitLabel ?? null }) : undefined;

  // Map categoryId to name if needed
  const catName = (product?.category && product.category.trim()) ||
    (product?.categoryId && categories.find(c => c._id === product.categoryId)?.name) ||
    product?.category;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div
            className="relative group w-full rounded-lg shadow-md bg-white overflow-hidden"
            style={{ aspectRatio: maxAspect ?? 1 }}
          >
            {/* Main image fills a fixed aspect-ratio box to avoid layout shift */}
            <img
              src={mainImage}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-contain"
            />
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={showPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 rounded-full p-2 shadow hidden md:block"
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={showNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 rounded-full p-2 shadow hidden md:block"
                >
                  ›
                </button>
              </>
            )}
          </div>
          {galleryImages.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {galleryImages.map((image, index) => {
                const active = index === currentIdx;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCurrentIdx(index)}
                    className={`relative w-full aspect-square rounded overflow-hidden ring-2 ${
                      active ? 'ring-green-500' : 'ring-transparent'
                    }`}
                    aria-label={`Show image ${index + 1}`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {active && (
                      <span className="absolute inset-0 ring-2 ring-green-500 rounded pointer-events-none"></span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Product Info */}
  <div className="space-y-4 sm:space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{product.name}</h1>
            <p className="text-gray-600 mt-1 sm:mt-2">{catName}</p>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <div>
              <span className="text-xl sm:text-2xl font-bold">₹{product.price}</span>
              {derivedUnitLabel && (
                <span className="text-xs sm:text-sm text-gray-500 ml-2">for {derivedUnitLabel}</span>
              )}
              {derivedPriceFor && (
                <div className="text-xs sm:text-sm text-gray-500">{derivedPriceFor}</div>
              )}
            </div>
            {product.isOrganic && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                Organic
              </span>
            )}
          </div>

          <div>
            <p className="text-gray-700">{product.description}</p>
          </div>

          {/* Stock information */
          /* Use numericStock to avoid string '0' issues from backend */}
    <div className="space-y-1">
            {numericStock > 0 ? (
              <>
                <p className="text-gray-800 font-medium">{numericStock} packs available</p>
                {typeof product.g === 'number' && product.g > 0 && (() => {
                  const per = formatWeightFromGrams(product.g);
                  const totalG = numericStock * product.g;
                  const total = formatWeightFromGrams(totalG) || `${totalG} g`;
                  return (
                    <p className="text-sm text-gray-600">Each pack: {per} • Total ~{total}</p>
                  );
                })()}
                {typeof product.pieces === 'number' && product.pieces > 0 && (
                  <p className="text-sm text-gray-600">Each pack: {product.pieces} pcs • Total {numericStock * product.pieces} pcs</p>
                )}
                {numericStock <= 5 && (
      <p className="text-xs text-amber-700">Only {numericStock} left</p>
                )}
              </>
            ) : (
              <p className="text-red-600 font-medium">Out of stock</p>
            )}
          </div>

          {inCart ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">In your cart</div>
                <div className="flex items-center border rounded overflow-hidden">
                  <button
                    onClick={async () => {
                      try {
                        await updateQuantity(product._id, existingQty - 1);
                      } catch {
                        show('Failed to update quantity', { type: 'error' });
                      }
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 min-w-[3rem] text-center">{existingQty}</span>
                  <button
                    onClick={async () => {
                      if (existingQty + 1 > numericStock) {
                        show('Cannot exceed available stock', { type: 'warning' });
                        return;
                      }
                      try {
                        await updateQuantity(product._id, existingQty + 1);
                      } catch {
                        show('Failed to update quantity', { type: 'error' });
                      }
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {remaining > 0 && (
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="flex items-center border rounded">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 sm:px-4 py-2 text-gray-600 hover:bg-gray-100 active:scale-95"
                    >
                      -
                    </button>
                    <span className="px-3 sm:px-4 py-2">{quantity}</span>
                    <button
                      onClick={() => {
                        if (remaining <= 0) {
                          show('No more stock available for this item', { type: 'warning' });
                          return;
                        }
                        if (quantity >= remaining) {
                          show('Cannot exceed available stock', { type: 'warning' });
                          setQuantity(Math.max(1, remaining));
                        } else {
                          setQuantity(quantity + 1);
                        }
                      }}
                      className="px-3 sm:px-4 py-2 text-gray-600 hover:bg-gray-100 active:scale-95"
                    >
                      +
                    </button>
                  </div>
                  {/* Stock summary is shown above in detail section */}
                </div>
              )}

              <button
                onClick={handleAddToCart}
                disabled={remaining <= 0}
                className={`w-full py-3 rounded-lg font-semibold ${
                  remaining > 0
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {remaining > 0 ? 'Add' : 'Out of Stock'}
              </button>
            </>
          )}

          {/* Farmer Info */}
          {farmer && !farmerLoading && (
            <div className="mt-8 p-4 bg-green-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">About the Farmer</h2>
              <Link
                to={`/farmers/${farmer._id}`}
                className="text-green-700 hover:underline"
              >
                <h3 className="font-medium">{farmer.farmName}</h3>
              </Link>
              <p className="text-gray-600 mt-1">by {farmer.name}</p>
              <p className="text-gray-600 mt-1">{farmer.address}</p>
            </div>
          )}
        </div>
      </div>

      {/* Product Videos */}
  {(product.videos || []).length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Product Videos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {(product.videos || []).map((video, index) => (
              <div key={index} className="aspect-w-16 aspect-h-9">
                <video
                  src={video}
                  controls
                  className="w-full rounded-lg shadow"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
