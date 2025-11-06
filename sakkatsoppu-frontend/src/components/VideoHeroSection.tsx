import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBagIcon, SparklesIcon, CalendarDaysIcon, UserGroupIcon, PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';
import { getHomepageVideos } from '../services/api';
import { HomepageVideo } from '../types';

const heroLogo = new URL('../../logo_final.jpg', import.meta.url).href;

// Fallback dummy video for when API fails
// Using a solid color video placeholder from a reliable CDN
const FALLBACK_VIDEO = {
  _id: 'fallback',
  title: 'Fallback Video',
  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  displayOrder: 1
};

// Content slides that will transition - Shorter, more concise
const contentSlides = [
  {
    title: "Fresh from Farmers",
    subtitle: "100% organic produce, straight to your door",
    highlight: "100% Organic",
    icon: <SparklesIcon className="h-5 w-5" />
  },
  {
    title: "Farm-Fresh Quality",
    subtitle: "No pesticides, just pure goodness",
    highlight: "Farm Fresh",
    icon: <SparklesIcon className="h-5 w-5" />
  },
  {
    title: "Doorstep Delivery",
    subtitle: "Order Mon–Sat, delivered Sun & Mon",
    highlight: "Convenient",
    icon: <CalendarDaysIcon className="h-5 w-5" />
  },
  {
    title: "Supporting Local Farms",
    subtitle: "50+ farmers, fair pay, strong communities",
    highlight: "Community",
    icon: <UserGroupIcon className="h-5 w-5" />
  }
];

type VideoHeroSectionProps = {
  startAnimations?: boolean;
};

// Utility function to optimize Cloudinary URLs for mobile/desktop
const optimizeCloudinaryUrl = (url: string, isMobile: boolean): string => {
  if (!url.includes('cloudinary.com')) return url;

  // Cloudinary transformation parameters
  const transformation = isMobile
    ? 'q_auto,f_auto,w_800,c_limit' // Mobile: smaller width, auto quality/format
    : 'q_auto,f_auto,w_1920,c_limit'; // Desktop: full HD width

  // Insert transformation into Cloudinary URL
  return url.replace('/upload/', `/upload/${transformation}/`);
};

export const VideoHeroSection: React.FC<VideoHeroSectionProps> = ({ startAnimations = true }) => {
  const [currentContentSlide, setCurrentContentSlide] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const manuallyPausedRef = useRef(false); // Track if user manually paused

  // Detect mobile/desktop for video optimization
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch homepage videos from API
  const { data: videosData } = useQuery<HomepageVideo[]>({
    queryKey: ['homepage-videos'],
    queryFn: async () => {
      try {
        const res = await getHomepageVideos();

        // Handle different response formats
        let videos: HomepageVideo[] = [];

        if (Array.isArray(res.data)) {
          videos = res.data;
        } else if (res.data && typeof res.data === 'object') {
          // Check for common data wrapper patterns
          const data = res.data as Record<string, unknown>;
          videos = (data.videos || data.data || data.items || []) as HomepageVideo[];
        }

        // Ensure we have an array
        if (!Array.isArray(videos)) {
          console.warn('API response is not an array, using fallback');
          return [];
        }

        // Sort by displayOrder
        return videos.sort((a, b) => a.displayOrder - b.displayOrder);
      } catch (error) {
        console.error('Error fetching homepage videos:', error);
        return [];
      }
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1
  });

  // Use fetched videos or fallback
  const videos = videosData && videosData.length > 0 ? videosData : [FALLBACK_VIDEO];

  // Current content (cycles through contentSlides independently)
  const currentContent = contentSlides[currentContentSlide];

  // Auto-transition for content slides (3 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentContentSlide((prev) => (prev + 1) % contentSlides.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(timer);
  }, []);

  // Video transitions (every 15 seconds if multiple videos, auto-loop)
  useEffect(() => {
    if (videos.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
      manuallyPausedRef.current = false; // Reset manual pause on video change
    }, 15000); // Change video every 15 seconds, auto-loop through all

    return () => clearInterval(timer);
  }, [videos.length]);

  // Scroll detection - pause video when scrolled out of view
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current || !videoRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;

      if (inView) {
        // Only auto-resume if user didn't manually pause
        if (!manuallyPausedRef.current) {
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      } else {
        // Pause when scrolled out of view
        videoRef.current.pause();
        setIsPlaying(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentVideoIndex]); // Add dependency to re-attach when video changes

  // Handle manual content slide change
  const handleSlideChange = (index: number) => {
    setCurrentContentSlide(index);
  };

  // Video control handlers
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        manuallyPausedRef.current = true; // Mark as manually paused
      } else {
        videoRef.current.play().catch(() => {});
        manuallyPausedRef.current = false; // Clear manual pause flag
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Get optimized video URL
  const getVideoUrl = (video: HomepageVideo) => {
    return optimizeCloudinaryUrl(video.videoUrl, isMobile);
  };

  return (
    <motion.section
      ref={sectionRef}
      className="relative lg:py-16 lg:px-6 overflow-hidden rounded-3xl lg:rounded-[3rem] mx-2 sm:mx-4 lg:mx-6 my-4 lg:my-8"
      style={{
        minHeight: '600px',
        height: 'auto',
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 15%, #fed7aa 30%, #d1fae5 50%, #86efac 70%, #6ee7b7 85%, #5eead4 100%)'
      }}
    >
      {/* Multi-layered Organic Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23065f46' fill-opacity='1'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zm0 60c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zm60-60c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px'
        }} />
      </div>

      {/* Leaf Pattern Overlay */}
      <div className="absolute inset-0 opacity-8">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20c0 0 10-10 20 0s0 20 0 20-10 10-20 0 0-20 0-20zm60 0c0 0 10-10 20 0s0 20 0 20-10 10-20 0 0-20 0-20zM20 80c0 0 10-10 20 0s0 20 0 20-10 10-20 0 0-20 0-20zm60 0c0 0 10-10 20 0s0 20 0 20-10 10-20 0 0-20 0-20z' fill='%2310b981' fill-opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px'
        }} />
      </div>

      {/* Floating Particles Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-3 h-3 bg-green-400/20 rounded-full animate-float" style={{ animationDelay: '0s', animationDuration: '6s' }} />
        <div className="absolute top-1/4 right-20 w-2 h-2 bg-emerald-400/20 rounded-full animate-float" style={{ animationDelay: '1s', animationDuration: '8s' }} />
        <div className="absolute bottom-1/3 left-1/4 w-4 h-4 bg-lime-400/20 rounded-full animate-float" style={{ animationDelay: '2s', animationDuration: '7s' }} />
        <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-teal-400/20 rounded-full animate-float" style={{ animationDelay: '3s', animationDuration: '9s' }} />
      </div>

      {/* Faded gradient overlay between sections */}
      <div className="hidden lg:block absolute inset-y-0 left-1/2 w-32 bg-gradient-to-r from-transparent via-green-100/20 to-transparent blur-2xl z-5" />

      {/* Content */}
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:grid lg:grid-cols-[1.5fr_0.5fr] lg:gap-12 xl:gap-16 lg:items-center">
          {/* Content with transitioning slides - Below video on Mobile, Left on Desktop */}
          <div className="text-center lg:text-left order-2 lg:order-1 flex flex-col justify-center px-4 py-6 lg:px-0 lg:py-0 max-w-full overflow-hidden">
            {/* Logo with Enhanced Design */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={startAnimations ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto lg:mx-0 mb-5 lg:mb-6 w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br from-white via-green-50 to-emerald-50 shadow-2xl p-2.5 overflow-hidden ring-4 ring-green-200/50"
              style={{
                boxShadow: '0 20px 50px -12px rgba(16, 185, 129, 0.3), 0 0 0 1px rgba(16, 185, 129, 0.1)'
              }}
            >
              <img
                src={heroLogo}
                alt="Sakkat Soppu logo"
                className="w-full h-full object-contain"
              />
            </motion.div>

            {/* Animated Content Slides */}
            <div className="relative mb-4 lg:mb-6" style={{ minHeight: '140px' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentContentSlide}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className="absolute inset-0"
                >
                  {/* Icon & Highlight Badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="inline-flex items-center gap-2.5 mb-3 lg:mb-3"
                  >
                    <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center shadow-xl border-2 border-white ring-2 ring-green-400/30">
                      {currentContent.icon}
                    </div>
                    <span className="px-3 py-1.5 lg:px-4 lg:py-1.5 bg-gradient-to-r from-white to-green-50 text-green-700 text-xs lg:text-sm font-bold rounded-full shadow-lg border-2 border-green-400/50 backdrop-blur-sm">
                      {currentContent.highlight}
                    </span>
                  </motion.div>

                  {/* Title with Organic Text Effect */}
                  <h1 className="text-2xl lg:text-4xl font-black tracking-tight mb-2 lg:mb-3 leading-tight bg-gradient-to-r from-green-800 via-emerald-700 to-teal-800 bg-clip-text text-transparent">
                    {currentContent.title}
                  </h1>

                  {/* Subtitle */}
                  <p className="text-sm lg:text-lg mb-3 lg:mb-4 leading-relaxed text-green-700/90 font-medium">
                    {currentContent.subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Enhanced CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={startAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-4 lg:mb-5 flex justify-center lg:justify-start lg:w-auto"
            >
              <Link
                to="/products"
                className="group inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white px-6 py-3 lg:px-5 lg:py-3 rounded-full font-bold hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 transform hover:scale-105 active:scale-95 transition-all shadow-2xl hover:shadow-green-500/50 text-sm lg:text-sm relative overflow-hidden"
                style={{
                  boxShadow: '0 20px 40px -15px rgba(16, 185, 129, 0.5), 0 0 20px rgba(16, 185, 129, 0.2)'
                }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <ShoppingBagIcon className="h-4 w-4 lg:h-4 lg:w-4 relative z-10 group-hover:rotate-12 transition-transform flex-shrink-0" />
                <span className="relative z-10 tracking-wide whitespace-nowrap">Shop Fresh Now</span>
              </Link>
            </motion.div>

            {/* Enhanced Trust Card with Organic Theme */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={startAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mb-5 lg:mb-6 flex justify-center lg:justify-start lg:w-auto"
            >
              <div className="inline-block relative group">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="relative rounded-2xl border-2 border-emerald-400/60 bg-gradient-to-br from-white via-green-50/80 to-emerald-50/60 backdrop-blur-sm shadow-2xl p-3.5 lg:p-3.5 hover:scale-105 transition-transform">
                  <div className="flex items-start lg:items-center gap-2.5">
                    <div className="w-9 h-9 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg flex-shrink-0">
                      <UserGroupIcon className="w-4 h-4 lg:w-4 lg:h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base lg:text-base font-black tracking-tight bg-gradient-to-r from-green-800 to-emerald-700 bg-clip-text text-transparent">
                        Trusted by 5000+ people
                      </p>
                      <p className="text-xs lg:text-xs text-green-700/80 font-medium mt-0.5">
                        Farm‑fresh goodness loved by our community.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Slide Indicators - Navigation Dots */}
            <div className="flex justify-center lg:justify-start gap-2.5 lg:gap-4 mt-4 lg:mt-6 flex-wrap">
              {contentSlides.map((slide, index) => (
                <button
                  key={index}
                  onClick={() => handleSlideChange(index)}
                  className={`group relative transition-all duration-300 ${
                    index === currentContentSlide ? 'w-12 lg:w-16' : 'w-9 lg:w-14'
                  }`}
                  aria-label={`Go to slide ${index + 1}: ${slide.highlight}`}
                  title={slide.highlight}
                >
                  <div
                    className={`h-3 lg:h-4 rounded-full transition-all duration-300 ${
                      index === currentContentSlide
                        ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 shadow-xl scale-110 ring-2 ring-green-400/50'
                        : 'bg-gradient-to-r from-green-300 to-emerald-300 group-hover:from-green-400 group-hover:to-emerald-400 group-hover:scale-105 shadow-md'
                    }`}
                  />
                  {/* Enhanced Tooltip on hover */}
                  <span className="hidden lg:block absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-1.5 bg-gradient-to-r from-green-700 to-emerald-700 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none shadow-xl border border-green-500/30">
                    {slide.highlight}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Video Player - Top on Mobile, Right on Desktop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={startAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="order-1 lg:order-2 w-full flex items-center justify-center mb-6 lg:mb-0"
          >
            {/* Decorative frame container for desktop */}
            <div className="relative w-full lg:w-auto">
              {/* Glow effect behind video */}
              <div className="hidden lg:block absolute -inset-6 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 rounded-3xl blur-3xl opacity-30 animate-pulse" style={{ zIndex: 0 }} />

              <div
                className="relative w-full lg:w-64 xl:w-72 overflow-hidden shadow-2xl lg:rounded-3xl lg:ring-4 lg:ring-white/50"
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
                onTouchStart={() => setShowControls(true)}
                onTouchEnd={() => setTimeout(() => setShowControls(false), 3000)}
                style={{
                  aspectRatio: '9 / 16',
                  maxHeight: '80vh',
                  boxShadow: '0 25px 60px -15px rgba(16, 185, 129, 0.4), 0 0 30px rgba(16, 185, 129, 0.1)',
                  zIndex: 1
                }}
              >
              {/* Video */}
              {videos.map((video, index) => (
                <video
                  key={video._id}
                  ref={index === currentVideoIndex ? videoRef : null}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                    index === currentVideoIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                  style={{ pointerEvents: index === currentVideoIndex ? 'auto' : 'none' }}
                >
                  <source src={getVideoUrl(video)} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ))}

              {/* Hover Controls Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: showControls ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-black/40 flex items-center justify-center gap-4 z-20"
                style={{ pointerEvents: showControls ? 'auto' : 'none' }}
              >
                {/* Play/Pause Button */}
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-xl transform hover:scale-110 transition-all"
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                >
                  {isPlaying ? (
                    <PauseIcon className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
                  ) : (
                    <PlayIcon className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
                  )}
                </button>

                {/* Mute/Unmute Button */}
                <button
                  onClick={toggleMute}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-xl transform hover:scale-110 transition-all"
                  aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                >
                  {isMuted ? (
                    <SpeakerXMarkIcon className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
                  ) : (
                    <SpeakerWaveIcon className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
                  )}
                </button>
              </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};
