/**
 * 🌸 FloresYa - Carousel Type Definitions
 * Professional carousel types and interfaces
 */

export interface CarouselImage {
  id: string;
  url: string;
  alt: string;
  title: string;
  description?: string;
  order: number;
  is_active?: boolean;
}

export interface CarouselConfig {
  autoplay: boolean;
  interval: number;
  indicators: boolean;
  controls: boolean;
  pauseOnHover: boolean;
  wrap: boolean;
  touch: boolean;
  keyboard: boolean;
  height: number;
  width: string;
  theme: 'default' | 'minimal' | 'elegant';
}

export interface CarouselState {
  isInitialized: boolean;
  isLoading: boolean;
  currentSlide: number;
  totalSlides: number;
  imagesCount: number;
  containerId: string;
  config: CarouselConfig;
  errors: string[];
}

export interface CarouselEvents {
  onSlideChange?: (from: number, to: number) => void;
  onSlideChanged?: (current: number) => void;
  onError?: (error: Error) => void;
  onLoad?: () => void;
  onImageLoad?: (index: number, image: CarouselImage) => void;
  onImageError?: (index: number, image: CarouselImage, error: Error) => void;
}

export interface BootstrapCarousel {
  next(): void;
  prev(): void;
  to(index: number): void;
  cycle(): void;
  pause(): void;
  dispose(): void;
}

export type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'debug';

export interface ApiCarouselImage {
  id?: number | string;
  image_url?: string;
  url?: string;
  alt_text?: string;
  alt?: string;
  title?: string;
  description?: string;
  display_order?: number;
  order?: number;
  is_active?: boolean;
}