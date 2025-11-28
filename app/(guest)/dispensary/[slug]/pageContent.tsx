'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Loader2, AlertCircle, ArrowLeft, MapPin, Star, Clock, Phone, Globe, Mail,
  Heart, Share2, Navigation, Verified, Leaf, ChevronRight, ShoppingBag,
  DollarSign, Tag, Filter, Grid, List, ChevronDown, X, Info, MessageSquare,
  Calendar, CreditCard, Car, Accessibility, Shield, Percent, Users, ThumbsUp
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  slug: string;
  image?: string;
  category: string;
  subcategory?: string;
  strain_type?: 'indica' | 'sativa' | 'hybrid';
  thc_percentage?: number;
  cbd_percentage?: number;
  price: number;
  original_price?: number;
  unit: string;
  in_stock: boolean;
  is_deal?: boolean;
  brand?: string;
}

interface Review {
  id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  comment: string;
  created_at: string;
  helpful_count: number;
}

interface Dispensary {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  cover_image?: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone?: string;
  email?: string;
  website?: string;
  rating: number;
  review_count: number;
  is_open: boolean;
  hours: { day: string; open: string; close: string; is_closed: boolean }[];
  license_number?: string;
  business_type: 'dispensary' | 'delivery' | 'both';
  amenities: string[];
  is_verified: boolean;
  is_medical: boolean;
  is_recreational: boolean;
  followers: number;
  latitude?: number;
  longitude?: number;
}

// Sample Data
const sampleDispensary: Dispensary = {
  id: '1',
  name: 'The Green Solution',
  slug: 'the-green-solution',
  logo: 'https://images.unsplash.com/photo-1589484535988-f7d6cc6e0d5e?w=200&h=200&fit=crop',
  cover_image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1200&h=600&fit=crop',
  description: 'The Green Solution is Colorado\'s premier cannabis destination, offering an extensive selection of premium flower, concentrates, edibles, and accessories. Our knowledgeable budtenders are passionate about helping you find the perfect products to match your needs and preferences. We pride ourselves on quality, consistency, and exceptional customer service. Whether you\'re a medical patient or recreational consumer, we\'re here to guide you through your cannabis journey with expert advice and top-tier products.',
  address: '2601 W Alameda Ave',
  city: 'Denver',
  state: 'CO',
  zip_code: '80219',
  phone: '(303) 990-9723',
  email: 'info@tgscolorado.com',
  website: 'https://tgscolorado.com',
  rating: 4.8,
  review_count: 1245,
  is_open: true,
  hours: [
    { day: 'Monday', open: '8:00 AM', close: '9:45 PM', is_closed: false },
    { day: 'Tuesday', open: '8:00 AM', close: '9:45 PM', is_closed: false },
    { day: 'Wednesday', open: '8:00 AM', close: '9:45 PM', is_closed: false },
    { day: 'Thursday', open: '8:00 AM', close: '9:45 PM', is_closed: false },
    { day: 'Friday', open: '8:00 AM', close: '9:45 PM', is_closed: false },
    { day: 'Saturday', open: '9:00 AM', close: '9:45 PM', is_closed: false },
    { day: 'Sunday', open: '9:00 AM', close: '8:00 PM', is_closed: false },
  ],
  license_number: 'MED-403R-0012',
  business_type: 'dispensary',
  amenities: ['atm', 'parking', 'wheelchair', 'veteran_discount', 'first_time_discount', 'loyalty_program'],
  is_verified: true,
  is_medical: true,
  is_recreational: true,
  followers: 12456,
  latitude: 39.7092,
  longitude: -105.0235,
};

const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Blue Dream',
    slug: 'blue-dream',
    image: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=400&h=400&fit=crop',
    category: 'flower',
    strain_type: 'hybrid',
    thc_percentage: 21.5,
    cbd_percentage: 0.1,
    price: 45,
    unit: '3.5g',
    in_stock: true,
    brand: 'Green Dot Labs',
  },
  {
    id: '2',
    name: 'OG Kush Premium',
    slug: 'og-kush-premium',
    image: 'https://images.unsplash.com/photo-1587754557659-4aebb7bc0650?w=400&h=400&fit=crop',
    category: 'flower',
    strain_type: 'indica',
    thc_percentage: 24.8,
    cbd_percentage: 0.2,
    price: 55,
    unit: '3.5g',
    in_stock: true,
    brand: 'Snaxland',
  },
  {
    id: '3',
    name: 'Sour Diesel',
    slug: 'sour-diesel',
    image: 'https://images.unsplash.com/photo-1589484535988-f7d6cc6e0d5e?w=400&h=400&fit=crop',
    category: 'flower',
    strain_type: 'sativa',
    thc_percentage: 22.3,
    cbd_percentage: 0.1,
    price: 42,
    original_price: 55,
    unit: '3.5g',
    in_stock: true,
    is_deal: true,
    brand: 'Veritas Fine Cannabis',
  },
  {
    id: '4',
    name: 'Gelato Live Resin',
    slug: 'gelato-live-resin',
    image: 'https://images.unsplash.com/photo-1585063560314-dab87cc48ac5?w=400&h=400&fit=crop',
    category: 'concentrate',
    strain_type: 'hybrid',
    thc_percentage: 78.5,
    price: 65,
    unit: '1g',
    in_stock: true,
    brand: '710 Labs',
  },
  {
    id: '5',
    name: 'Rosin Badder - GMO',
    slug: 'rosin-badder-gmo',
    image: 'https://images.unsplash.com/photo-1571942676516-bcab84649e44?w=400&h=400&fit=crop',
    category: 'concentrate',
    strain_type: 'indica',
    thc_percentage: 82.1,
    price: 75,
    original_price: 85,
    unit: '1g',
    in_stock: true,
    is_deal: true,
    brand: 'Lazercat',
  },
  {
    id: '6',
    name: 'Watermelon Gummies',
    slug: 'watermelon-gummies',
    image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&h=400&fit=crop',
    category: 'edible',
    thc_percentage: 10,
    price: 22,
    unit: '100mg (10pk)',
    in_stock: true,
    brand: 'Wana',
  },
  {
    id: '7',
    name: 'Chocolate Bar - Dark',
    slug: 'chocolate-bar-dark',
    image: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=400&h=400&fit=crop',
    category: 'edible',
    thc_percentage: 100,
    price: 28,
    unit: '100mg',
    in_stock: true,
    brand: 'incredibles',
  },
  {
    id: '8',
    name: 'GSC Vape Cartridge',
    slug: 'gsc-vape-cartridge',
    image: 'https://images.unsplash.com/photo-1587754557659-4aebb7bc0650?w=400&h=400&fit=crop',
    category: 'cartridge',
    strain_type: 'hybrid',
    thc_percentage: 85.2,
    price: 40,
    original_price: 50,
    unit: '1g',
    in_stock: false,
    is_deal: true,
    brand: 'O.pen',
  },
  {
    id: '9',
    name: 'Durban Poison Cart',
    slug: 'durban-poison-cart',
    image: 'https://images.unsplash.com/photo-1589484535988-f7d6cc6e0d5e?w=400&h=400&fit=crop',
    category: 'cartridge',
    strain_type: 'sativa',
    thc_percentage: 88.5,
    price: 45,
    unit: '1g',
    in_stock: true,
    brand: 'Select',
  },
  {
    id: '10',
    name: 'Indica Pre-Roll 5pk',
    slug: 'indica-preroll-5pk',
    image: 'https://images.unsplash.com/photo-1585063560314-dab87cc48ac5?w=400&h=400&fit=crop',
    category: 'preroll',
    strain_type: 'indica',
    thc_percentage: 20.5,
    price: 35,
    unit: '5 x 0.5g',
    in_stock: true,
    brand: 'L\'Eagle',
  },
  {
    id: '11',
    name: 'CBD Tincture 1000mg',
    slug: 'cbd-tincture-1000mg',
    image: 'https://images.unsplash.com/photo-1571942676516-bcab84649e44?w=400&h=400&fit=crop',
    category: 'tincture',
    cbd_percentage: 33.3,
    price: 60,
    unit: '30ml',
    in_stock: true,
    brand: 'Charlotte\'s Web',
  },
  {
    id: '12',
    name: 'THC:CBD Tincture',
    slug: 'thc-cbd-tincture',
    image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&h=400&fit=crop',
    category: 'tincture',
    thc_percentage: 15,
    cbd_percentage: 15,
    price: 55,
    unit: '30ml',
    in_stock: true,
    brand: 'Mary\'s Medicinals',
  },
];

const sampleReviews: Review[] = [
  {
    id: '1',
    user_name: 'Michael R.',
    user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    rating: 5,
    comment: 'Absolutely the best dispensary in Denver! The staff is incredibly knowledgeable and always takes the time to help me find exactly what I\'m looking for. Their flower selection is top-notch, and I love their loyalty program. Highly recommend the Blue Dream - it\'s become my go-to strain!',
    created_at: '2024-01-15',
    helpful_count: 47,
  },
  {
    id: '2',
    user_name: 'Sarah K.',
    user_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    rating: 5,
    comment: 'First time visiting and was blown away by the experience. The budtender took time to understand my needs and recommended the perfect products for my anxiety. Clean store, great prices, and amazing selection. Will definitely be back!',
    created_at: '2024-01-12',
    helpful_count: 32,
  },
  {
    id: '3',
    user_name: 'David L.',
    user_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    rating: 4,
    comment: 'Great selection and quality products. The only reason I\'m not giving 5 stars is because it can get pretty busy on weekends. Pro tip: come during weekday mornings for the best experience. Their concentrates are some of the best I\'ve had!',
    created_at: '2024-01-08',
    helpful_count: 28,
  },
  {
    id: '4',
    user_name: 'Jennifer M.',
    user_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    rating: 5,
    comment: 'As a medical patient, I really appreciate the care and attention I receive here. They always have my preferred strains in stock and the staff remembers my preferences. The veteran discount is a nice bonus too!',
    created_at: '2024-01-05',
    helpful_count: 19,
  },
  {
    id: '5',
    user_name: 'Chris T.',
    rating: 4,
    comment: 'Solid dispensary with good deals. Love their daily specials and the quality is always consistent. The parking lot can be a bit tight during peak hours but overall a great experience.',
    created_at: '2024-01-02',
    helpful_count: 15,
  },
];

const categories = [
  { id: 'all', label: 'All Products', icon: ShoppingBag },
  { id: 'flower', label: 'Flower', icon: Leaf },
  { id: 'concentrate', label: 'Concentrates', icon: DollarSign },
  { id: 'edible', label: 'Edibles', icon: ShoppingBag },
  { id: 'cartridge', label: 'Cartridges', icon: ShoppingBag },
  { id: 'preroll', label: 'Pre-Rolls', icon: ShoppingBag },
  { id: 'tincture', label: 'Tinctures', icon: ShoppingBag },
];

const amenityInfo: Record<string, { label: string; icon: React.ElementType }> = {
  atm: { label: 'ATM', icon: CreditCard },
  parking: { label: 'Parking', icon: Car },
  wheelchair: { label: 'ADA Accessible', icon: Accessibility },
  veteran_discount: { label: 'Veteran Discount', icon: Shield },
  curbside: { label: 'Curbside Pickup', icon: Car },
  delivery: { label: 'Delivery', icon: Navigation },
  first_time_discount: { label: 'First Time Discount', icon: Percent },
  loyalty_program: { label: 'Loyalty Program', icon: Users },
};

export default function DispensaryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [dispensary, setDispensary] = useState<Dispensary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews' | 'about'>('menu');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('popular');
  const [showAllHours, setShowAllHours] = useState(false);

  // Fetch dispensary details
  const fetchDispensary = useCallback(async () => {
    try {
      setLoading(true);
	   setDispensary(sampleDispensary);
      setProducts(sampleProducts);
      setReviews(sampleReviews);
      /*const response = await axios.get(`/api/dispensary/${slug}`);

      if (response.data.status === 'success') {
        setDispensary(response.data.data.dispensary);
        setProducts(response.data.data.products || []);
        setReviews(response.data.data.reviews || []);
      } else {
        // Use sample data
        setDispensary(sampleDispensary);
        setProducts(sampleProducts);
        setReviews(sampleReviews);
      }*/
    } catch (error) {
      console.error('Error fetching dispensary:', error);
      // Use sample data on error
      setDispensary(sampleDispensary);
      setProducts(sampleProducts);
      setReviews(sampleReviews);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchDispensary();
    }
  }, [slug, fetchDispensary]);

  useEffect(() => {
    // Check if favorited
    const favorites = JSON.parse(localStorage.getItem('dispensary_favorites') || '[]');
    setIsFavorite(favorites.includes(dispensary?.id));
  }, [dispensary]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('dispensary_favorites') || '[]');
    let newFavorites;
    if (isFavorite) {
      newFavorites = favorites.filter((f: string) => f !== dispensary?.id);
    } else {
      newFavorites = [...favorites, dispensary?.id];
    }
    localStorage.setItem('dispensary_favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites', {
      position: 'bottom-center',
      autoClose: 2000,
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: dispensary?.name,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard', {
        position: 'bottom-center',
        autoClose: 2000,
      });
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getStrainColor = (type?: string) => {
    switch (type) {
      case 'indica': return 'bg-purple-100 text-purple-700';
      case 'sativa': return 'bg-orange-100 text-orange-700';
      case 'hybrid': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredProducts = products.filter(
    (product) => selectedCategory === 'all' || product.category === selectedCategory
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price_low':
        return a.price - b.price;
      case 'price_high':
        return b.price - a.price;
      case 'thc':
        return (b.thc_percentage || 0) - (a.thc_percentage || 0);
      default:
        return 0;
    }
  });

  const getTodayHours = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return dispensary?.hours.find((h) => h.day === today);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading dispensary...</p>
        </div>
      </div>
    );
  }

  if (!dispensary) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Dispensary Not Found</h2>
          <p className="text-gray-600 mb-6">The dispensary you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/dispensary')}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
          >
            Browse Dispensaries
          </button>
        </div>
      </div>
    );
  }

  const todayHours = getTodayHours();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 bg-gray-200">
        {dispensary.cover_image ? (
          <Image
            src={dispensary.cover_image}
            alt={dispensary.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-teal-500 to-teal-700" />
        )}
        <div className="absolute inset-0 bg-black/30" />

        {/* Back Button */}
        <button
          onClick={() => router.push('/dispensary')}
          className="absolute top-4 left-4 p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
          >
            <Share2 className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={toggleFavorite}
            className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-700'}`} />
          </button>
        </div>
      </div>

      {/* Dispensary Header */}
      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Logo */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border-4 border-white shadow-md">
              {dispensary.logo ? (
                <Image
                  src={dispensary.logo}
                  alt={dispensary.name}
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600">
                  <Leaf className="w-12 h-12 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{dispensary.name}</h1>
                {dispensary.is_verified && (
                  <Verified className="w-6 h-6 text-teal-600" />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  {renderStars(dispensary.rating, 'md')}
                  <span className="font-bold text-gray-900">{dispensary.rating}</span>
                  <span className="text-gray-500">({dispensary.review_count.toLocaleString()} reviews)</span>
                </div>
                <span className="text-gray-300">|</span>
                <span className="text-gray-600">{dispensary.followers.toLocaleString()} followers</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {dispensary.is_medical && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">Medical</span>
                )}
                {dispensary.is_recreational && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">Recreational</span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  dispensary.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {dispensary.is_open ? 'Open Now' : 'Closed'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <span>{dispensary.address}, {dispensary.city}, {dispensary.state} {dispensary.zip_code}</span>
                </div>
                {dispensary.phone && (
                  <a href={`tel:${dispensary.phone}`} className="flex items-center gap-2 text-teal-600 hover:text-teal-700">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{dispensary.phone}</span>
                  </a>
                )}
                {todayHours && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    <span>Today: {todayHours.is_closed ? 'Closed' : `${todayHours.open} - ${todayHours.close}`}</span>
                  </div>
                )}
                {dispensary.website && (
                  <a href={dispensary.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-teal-600 hover:text-teal-700">
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    <span>Visit Website</span>
                  </a>
                )}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <a
                href={`https://maps.google.com/?q=${dispensary.latitude},${dispensary.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
              >
                <Navigation className="w-5 h-5" />
                Get Directions
              </a>
              {dispensary.phone && (
                <a
                  href={`tel:${dispensary.phone}`}
                  className="px-6 py-3 border border-teal-600 text-teal-600 rounded-lg font-semibold hover:bg-teal-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Call
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'menu', label: 'Menu', icon: ShoppingBag, count: products.length },
              { id: 'reviews', label: 'Reviews', icon: MessageSquare, count: dispensary.review_count },
              { id: 'about', label: 'About', icon: Info },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 md:flex-none px-6 py-4 font-medium text-sm flex items-center justify-center gap-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count && (
                  <span className="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                    {tab.count.toLocaleString()}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Menu Tab */}
          {activeTab === 'menu' && (
            <div className="p-6">
              {/* Category Pills */}
              <div className="flex overflow-x-auto gap-2 pb-4 mb-6 -mx-6 px-6 scrollbar-hide">
                {categories.map((category) => {
                  const count = category.id === 'all' 
                    ? products.length 
                    : products.filter(p => p.category === category.id).length;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                        selectedCategory === category.id
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category.label}
                      <span className={`text-xs ${selectedCategory === category.id ? 'text-teal-200' : 'text-gray-500'}`}>
                        ({count})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Filters Bar */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">
                  <span className="font-semibold text-gray-900">{sortedProducts.length}</span> products
                </p>
                <div className="flex items-center gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="popular">Most Popular</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="thc">Highest THC</option>
                  </select>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600'}`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              {sortedProducts.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No products in this category</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sortedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                    >
                      <div className="relative aspect-square bg-gray-100">
                        {product.image ? (
                          <Image src={product.image} alt={product.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Leaf className="w-12 h-12 text-gray-300" />
                          </div>
                        )}
                        {product.is_deal && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                            DEAL
                          </div>
                        )}
                        {!product.in_stock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-semibold">Out of Stock</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        {product.strain_type && (
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded mb-2 ${getStrainColor(product.strain_type)}`}>
                            {product.strain_type.charAt(0).toUpperCase() + product.strain_type.slice(1)}
                          </span>
                        )}
                        <h3 className="font-semibold text-gray-900 text-sm group-hover:text-teal-600 transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        {product.brand && (
                          <p className="text-xs text-gray-500 mt-1">{product.brand}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {product.thc_percentage && (
                            <span className="text-xs text-gray-600">THC: {product.thc_percentage}%</span>
                          )}
                          {product.cbd_percentage && product.cbd_percentage > 0 && (
                            <span className="text-xs text-gray-600">CBD: {product.cbd_percentage}%</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div>
                            <span className="font-bold text-gray-900">${product.price}</span>
                            {product.original_price && (
                              <span className="text-sm text-gray-400 line-through ml-2">${product.original_price}</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{product.unit}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer flex gap-4"
                    >
                      <div className="relative w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                        {product.image ? (
                          <Image src={product.image} alt={product.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Leaf className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 hover:text-teal-600 transition-colors">
                              {product.name}
                            </h3>
                            {product.brand && (
                              <p className="text-sm text-gray-500">{product.brand}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-gray-900">${product.price}</span>
                            <span className="text-sm text-gray-500 ml-1">/ {product.unit}</span>
                            {product.original_price && (
                              <div className="text-sm text-gray-400 line-through">${product.original_price}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          {product.strain_type && (
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStrainColor(product.strain_type)}`}>
                              {product.strain_type.charAt(0).toUpperCase() + product.strain_type.slice(1)}
                            </span>
                          )}
                          {product.thc_percentage && (
                            <span className="text-xs text-gray-600">THC: {product.thc_percentage}%</span>
                          )}
                          {product.cbd_percentage && product.cbd_percentage > 0 && (
                            <span className="text-xs text-gray-600">CBD: {product.cbd_percentage}%</span>
                          )}
                          {product.is_deal && (
                            <span className="text-xs text-red-600 font-medium">DEAL</span>
                          )}
                          {!product.in_stock && (
                            <span className="text-xs text-red-600 font-medium">Out of Stock</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="p-6">
              {/* Rating Summary */}
              <div className="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b border-gray-200">
                <div className="text-center md:text-left">
                  <div className="text-5xl font-bold text-gray-900 mb-2">{dispensary.rating}</div>
                  {renderStars(dispensary.rating, 'md')}
                  <p className="text-gray-500 mt-2">{dispensary.review_count.toLocaleString()} reviews</p>
                </div>
                <div className="flex-1">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviews.filter((r) => Math.floor(r.rating) === stars).length;
                    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3 mb-2">
                        <span className="text-sm text-gray-600 w-8">{stars} ★</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="text-sm text-gray-500 w-12">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="pb-6 border-b border-gray-200 last:border-0">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {review.user_avatar ? (
                          <Image src={review.user_avatar} alt={review.user_name} width={48} height={48} className="rounded-full object-cover" />
                        ) : (
                          <span className="text-gray-600 font-semibold text-lg">{review.user_name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900">{review.user_name}</span>
                          <span className="text-sm text-gray-500">{review.created_at}</span>
                        </div>
                        {renderStars(review.rating)}
                        <p className="text-gray-700 mt-3 leading-relaxed">{review.comment}</p>
                        <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-teal-600 mt-3 transition-colors">
                          <ThumbsUp className="w-4 h-4" />
                          Helpful ({review.helpful_count})
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-6 py-3 border border-teal-600 text-teal-600 rounded-lg font-medium hover:bg-teal-50 transition-colors">
                Write a Review
              </button>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="p-6">
              {/* Description */}
              {dispensary.description && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                  <p className="text-gray-700 leading-relaxed">{dispensary.description}</p>
                </div>
              )}

              {/* Hours */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Hours</h3>
                <div className="space-y-2">
                  {(showAllHours ? dispensary.hours : dispensary.hours.slice(0, 3)).map((day) => {
                    const isToday = day.day === ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
                    return (
                      <div key={day.day} className={`flex justify-between text-sm py-2 px-3 rounded ${isToday ? 'bg-teal-50' : ''}`}>
                        <span className={`${isToday ? 'font-semibold text-teal-700' : 'text-gray-600'}`}>
                          {day.day} {isToday && '(Today)'}
                        </span>
                        <span className={`font-medium ${isToday ? 'text-teal-700' : 'text-gray-900'}`}>
                          {day.is_closed ? 'Closed' : `${day.open} - ${day.close}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {dispensary.hours.length > 3 && (
                  <button
                    onClick={() => setShowAllHours(!showAllHours)}
                    className="text-teal-600 hover:text-teal-700 text-sm font-medium mt-2"
                  >
                    {showAllHours ? 'Show less' : 'Show all hours'}
                  </button>
                )}
              </div>

              {/* Amenities */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {dispensary.amenities.map((amenity) => {
                    const info = amenityInfo[amenity];
                    if (!info) return null;
                    const Icon = info.icon;
                    return (
                      <div key={amenity} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-teal-600" />
                        </div>
                        <span className="text-gray-700 font-medium">{info.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* License */}
              {dispensary.license_number && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">License Information</h3>
                  <p className="text-gray-700">License #: {dispensary.license_number}</p>
                </div>
              )}

              {/* Contact */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact</h3>
                <div className="space-y-3">
                  {dispensary.phone && (
                    <a href={`tel:${dispensary.phone}`} className="flex items-center gap-3 text-teal-600 hover:text-teal-700 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5" />
                      <span className="font-medium">{dispensary.phone}</span>
                    </a>
                  )}
                  {dispensary.email && (
                    <a href={`mailto:${dispensary.email}`} className="flex items-center gap-3 text-teal-600 hover:text-teal-700 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5" />
                      <span className="font-medium">{dispensary.email}</span>
                    </a>
                  )}
                  {dispensary.website && (
                    <a href={dispensary.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-teal-600 hover:text-teal-700 p-3 bg-gray-50 rounded-lg">
                      <Globe className="w-5 h-5" />
                      <span className="font-medium">Visit Website</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-xs text-amber-800 text-center">
            <strong>Disclaimer:</strong> Marijuana is for use by qualified patients only. Keep out of reach of children. 
            Marijuana use during pregnancy or breastfeeding poses potential harms. Marijuana is not approved by the FDA 
            to treat, cure, or prevent any disease. Do not operate a vehicle or machinery under the influence of marijuana.
          </p>
        </div>
      </div>
    </div>
  );
}