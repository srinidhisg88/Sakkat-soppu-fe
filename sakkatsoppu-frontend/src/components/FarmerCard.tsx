import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPinIcon, PlayCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';

export type FarmerCardItem = {
  _id: string;
  name: string;
  farmName?: string;
  farmDescription?: string;
  address?: string;
  imageUrl?: string;
  images?: string[];
  farmImages?: string[];
  farmVideos?: string[];
};

type Media = { type: 'image' | 'video'; src: string };

export default function FarmerCard({ farmer }: { farmer: FarmerCardItem }) {
  const media = useMemo<Media[]>(() => {
    const imgs = new Set<string>();
    const vids = new Set<string>();
    const push = (u?: unknown) => {
      if (!u) return;
      if (Array.isArray(u)) u.forEach(v => typeof v === 'string' && v && imgs.add(v));
      else if (typeof u === 'string' && u) imgs.add(u);
    };
    push(farmer.farmImages);
    push(farmer.images);
    push(farmer.imageUrl);
    (farmer.farmVideos || []).forEach(v => typeof v === 'string' && v && vids.add(v));
    const all: Media[] = [
      ...Array.from(imgs).map(src => ({ type: 'image' as const, src })),
      ...Array.from(vids).map(src => ({ type: 'video' as const, src })),
    ];
    if (all.length === 0) return [{ type: 'image', src: '/pattern.svg' }];
    return all;
  }, [farmer.farmImages, farmer.images, farmer.imageUrl, farmer.farmVideos]);

  // Primary cover should be the first image if available
  const initialIndex = useMemo(() => {
    const idx = media.findIndex(m => m.type === 'image');
    return idx >= 0 ? idx : 0;
  }, [media]);
  const [current, setCurrent] = useState(initialIndex);

  return (
    <Link to={`/farmers/${farmer._id}`} className="group bg-white rounded-2xl border border-green-100 shadow-sm hover:shadow-md transition overflow-hidden">
      {/* Cover */}
      <div className="relative w-full h-48 sm:h-56 bg-gray-50">
        {media[current].type === 'image' ? (
          <img src={media[current].src} alt={farmer.farmName || farmer.name} width="400" height="224" className="w-full h-full object-cover group-hover:scale-[1.02] transition" />
        ) : (
          <video
            src={media[current].src}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
            onMouseEnter={e => { try { (e.currentTarget as HTMLVideoElement).play().catch(()=>{ /* ignore */ }); } catch { /* ignore */ } }}
            onMouseLeave={e => { try { (e.currentTarget as HTMLVideoElement).pause(); } catch { /* ignore */ } }}
          />
        )}
        {/* Subtle badge */}
        <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/80 backdrop-blur text-green-800 text-xs border border-green-100">
          <UserGroupIcon className="h-4 w-4" />
          Farmer
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">{farmer.farmName || farmer.name}</h3>
        {farmer.farmDescription && (
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{farmer.farmDescription}</p>
        )}
        {farmer.address && (
          <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <MapPinIcon className="h-4 w-4" /> {farmer.address}
          </p>
        )}

        {/* Media strip */}
        {media.length > 1 && (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto">
            {media.slice(0, 6).map((m, i) => {
              const active = media[current].src === m.src;
              return (
                <button
                  key={m.src + i}
                  type="button"
                  onClick={(e) => { e.preventDefault(); setCurrent(i); }}
                  className={`relative w-12 h-12 rounded-lg overflow-hidden ring-2 ${active ? 'ring-green-500' : 'ring-transparent'} shrink-0`}
                  aria-label="Preview media"
                >
                  {m.type === 'image' ? (
                    <img src={m.src} alt="preview" width="48" height="48" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <PlayCircleIcon className="h-6 w-6 text-gray-600" />
                    </div>
                  )}
                </button>
              );
            })}
            {media.length > 6 && (
              <div className="text-xs text-gray-500">+{media.length - 6} more</div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
