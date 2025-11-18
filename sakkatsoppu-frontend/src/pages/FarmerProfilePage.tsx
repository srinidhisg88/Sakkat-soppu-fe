import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getFarmerById } from "../services/api";
import { Farmer } from "../types";
import { useEffect, useState } from "react";
import { Shimmer } from "../components/Shimmer";

export function FarmerProfilePage() {
  const { id } = useParams<{ id: string }>();

  const { data: farmer, isLoading: farmerLoading } = useQuery<Farmer>({
    queryKey: ["farmer", id],
    queryFn: async () => (await getFarmerById(id!)).data,
  });

  // Media order: primary image first, then farmImages, then videos
  const allMedia = [
    farmer?.imageUrl || null,
    ...(farmer?.farmImages || []),
    ...(farmer?.farmVideos || []),
  ].filter(Boolean) as string[];

  const [activeMedia, setActiveMedia] = useState<string | null>(
    allMedia[0] || null
  );

  // Utility to detect if a media URL is a video (by common extensions)
  const isVideo = (url: string) =>
    /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(url);

  // Ensure active media initializes/updates when data loads or media list changes
  useEffect(() => {
    if (!activeMedia || (activeMedia && !allMedia.includes(activeMedia))) {
      setActiveMedia(allMedia[0] || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(allMedia)]);

  if (farmerLoading || !farmer) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-6 space-y-6">
          <Shimmer width="w-full" height="h-64" className="rounded-xl" />
          <div className="space-y-4">
            <Shimmer width="w-1/2" height="h-8" />
            <Shimmer width="w-3/4" height="h-6" />
            <Shimmer width="w-full" height="h-4" />
            <Shimmer width="w-full" height="h-4" />
            <Shimmer width="w-2/3" height="h-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="bg-gradient-to-br from-green-50 to-amber-50 rounded-2xl shadow-xl overflow-hidden border border-green-100">
        {/* Main Media (responsive, no cropping) */}
        {activeMedia && (
          <div className="relative w-full bg-green-100 flex items-center justify-center">
            {isVideo(activeMedia) ? (
              <video
                src={activeMedia}
                controls
                playsInline
                className="w-full h-auto max-h-[70vh] object-contain bg-black/5"
              />
            ) : (
              <img
                src={activeMedia}
                alt={farmer.farmName}
                className="w-full h-auto max-h-[70vh] object-contain bg-black/5"
                loading="lazy"
              />
            )}
          </div>
        )}

        {/* Thumbnails */}
        {allMedia.length > 1 && (
          <div className="flex gap-3 overflow-x-auto px-4 py-3 bg-green-50 border-t border-green-100">
            {allMedia.map((media, idx) => (
              <button
                key={idx}
                onClick={() => setActiveMedia(media)}
                aria-current={activeMedia === media}
                className={`flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 bg-white grid place-items-center 
                  ${
                    activeMedia === media
                      ? "border-green-600 scale-105"
                      : "border-transparent hover:border-green-400"
                  }`}
              >
                {isVideo(media) ? (
                  <video
                    src={media}
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={media}
                    alt={`Media ${idx + 1}`}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Farm Info */}
        <div className="p-6 md:p-8">
          <h1 className="text-3xl font-extrabold text-green-800 tracking-tight">
            {farmer.farmName}
          </h1>
          <p className="text-amber-800 font-medium mt-1">
            👨‍🌾 by {farmer.name}
          </p>
          <p className="text-gray-700 mt-4 leading-relaxed">
            {farmer.farmDescription}
          </p>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="bg-white rounded-xl shadow-md p-4 border border-green-100">
              <h2 className="text-sm font-semibold text-green-700 flex items-center gap-1">
                📍 Location
              </h2>
              <p className="mt-1 text-gray-800">{farmer.address}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-4 border border-green-100">
              <h2 className="text-sm font-semibold text-green-700 flex items-center gap-1">
                📞 Contact
              </h2>
              <p className="mt-1 text-gray-800">{farmer.phone}</p>
              <p className="mt-1 text-gray-800">{farmer.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FarmerProfilePage;