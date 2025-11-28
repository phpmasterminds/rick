'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Loader2, Search, MapPin, Star, Clock, Phone, X, Navigation, Verified, 
  Leaf, ChevronLeft, ChevronRight, List, Map as MapIcon, Filter
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your Mapbox access token here
// You should move this to an environment variable: process.env.NEXT_PUBLIC_MAPBOX_TOKEN
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'YOUR_MAPBOX_ACCESS_TOKEN';

interface Dispensary {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone?: string;
  rating: number;
  review_count: number;
  is_open: boolean;
  opening_time?: string;
  closing_time?: string;
  is_verified: boolean;
  is_medical: boolean;
  is_recreational: boolean;
  distance?: number;
  latitude: number;
  longitude: number;
}

// Sample Data for Denver area dispensaries
const sampleDispensaries: Dispensary[] = [
  {
    id: '1',
    name: 'The Green Solution',
    slug: 'the-green-solution',
    logo: 'https://images.unsplash.com/photo-1589484535988-f7d6cc6e0d5e?w=200&h=200&fit=crop',
    address: '2601 W Alameda Ave',
    city: 'Denver',
    state: 'CO',
    zip_code: '80219',
    phone: '(303) 990-9723',
    rating: 4.8,
    review_count: 1245,
    is_open: true,
    opening_time: '8:00 AM',
    closing_time: '9:45 PM',
    is_verified: true,
    is_medical: true,
    is_recreational: true,
    distance: 0.8,
    latitude: 39.7092,
    longitude: -105.0235,
  },
  {
    id: '2',
    name: 'Native Roots - Downtown',
    slug: 'native-roots-downtown',
    logo: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=200&h=200&fit=crop',
    address: '1536 Wazee St',
    city: 'Denver',
    state: 'CO',
    zip_code: '80202',
    phone: '(720) 458-9663',
    rating: 4.6,
    review_count: 892,
    is_open: true,
    opening_time: '9:00 AM',
    closing_time: '9:00 PM',
    is_verified: true,
    is_medical: true,
    is_recreational: true,
    distance: 1.2,
    latitude: 39.7535,
    longitude: -104.9990,
  },
  {
    id: '3',
    name: 'LivWell Enlightened Health',
    slug: 'livwell-enlightened-health',
    logo: 'https://images.unsplash.com/photo-1571942676516-bcab84649e44?w=200&h=200&fit=crop',
    address: '1538 Wazee St',
    city: 'Denver',
    state: 'CO',
    zip_code: '80202',
    phone: '(303) 455-4430',
    rating: 4.5,
    review_count: 756,
    is_open: false,
    opening_time: '10:00 AM',
    closing_time: '7:00 PM',
    is_verified: true,
    is_medical: true,
    is_recreational: false,
    distance: 1.5,
    latitude: 39.7540,
    longitude: -104.9985,
  },
  {
    id: '4',
    name: 'Starbuds - Brighton Blvd',
    slug: 'starbuds-brighton',
    logo: 'https://images.unsplash.com/photo-1585063560314-dab87cc48ac5?w=200&h=200&fit=crop',
    address: '4690 Brighton Blvd',
    city: 'Denver',
    state: 'CO',
    zip_code: '80216',
    phone: '(720) 379-5948',
    rating: 4.7,
    review_count: 623,
    is_open: true,
    opening_time: '8:00 AM',
    closing_time: '11:00 PM',
    is_verified: true,
    is_medical: false,
    is_recreational: true,
    distance: 2.3,
    latitude: 39.7785,
    longitude: -104.9715,
  },
  {
    id: '5',
    name: 'Medicine Man Denver',
    slug: 'medicine-man-denver',
    logo: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=200&h=200&fit=crop',
    address: '4750 Nome St',
    city: 'Denver',
    state: 'CO',
    zip_code: '80239',
    phone: '(303) 373-0752',
    rating: 4.9,
    review_count: 1567,
    is_open: true,
    opening_time: '8:00 AM',
    closing_time: '9:45 PM',
    is_verified: true,
    is_medical: true,
    is_recreational: true,
    distance: 3.1,
    latitude: 39.7805,
    longitude: -104.8850,
  },
  {
    id: '6',
    name: 'Diego Pellicer',
    slug: 'diego-pellicer',
    logo: 'https://images.unsplash.com/photo-1571942676516-bcab84649e44?w=200&h=200&fit=crop',
    address: '2949 W Alameda Ave',
    city: 'Denver',
    state: 'CO',
    zip_code: '80219',
    phone: '(303) 955-0186',
    rating: 4.4,
    review_count: 412,
    is_open: true,
    opening_time: '9:00 AM',
    closing_time: '8:00 PM',
    is_verified: false,
    is_medical: false,
    is_recreational: true,
    distance: 3.5,
    latitude: 39.7090,
    longitude: -105.0310,
  },
  {
    id: '7',
    name: 'Kind Love',
    slug: 'kind-love',
    logo: 'https://images.unsplash.com/photo-1589484535988-f7d6cc6e0d5e?w=200&h=200&fit=crop',
    address: '2369 S Delaware St',
    city: 'Denver',
    state: 'CO',
    zip_code: '80223',
    phone: '(720) 252-4387',
    rating: 4.8,
    review_count: 934,
    is_open: true,
    opening_time: '9:00 AM',
    closing_time: '9:50 PM',
    is_verified: true,
    is_medical: true,
    is_recreational: true,
    distance: 4.8,
    latitude: 39.6755,
    longitude: -104.9945,
  },
  {
    id: '8',
    name: 'Green Dragon - Colfax',
    slug: 'green-dragon-colfax',
    logo: 'https://images.unsplash.com/photo-1585063560314-dab87cc48ac5?w=200&h=200&fit=crop',
    address: '1517 N Marion St',
    city: 'Denver',
    state: 'CO',
    zip_code: '80218',
    phone: '(720) 328-4420',
    rating: 4.3,
    review_count: 289,
    is_open: false,
    opening_time: '10:00 AM',
    closing_time: '7:00 PM',
    is_verified: true,
    is_medical: true,
    is_recreational: true,
    distance: 2.1,
    latitude: 39.7410,
    longitude: -104.9690,
  },
];

export default function DispensaryMapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [filteredDispensaries, setFilteredDispensaries] = useState<Dispensary[]>([]);
  const [selectedDispensary, setSelectedDispensary] = useState<Dispensary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showList, setShowList] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [filters, setFilters] = useState({
    type: 'all',
    open_now: false,
    rating: 0,
  });

  // Default center (Denver, CO)
  const defaultCenter = { lat: 39.7392, lng: -104.9903 };

  // Get user's location
  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          if (map.current) {
            map.current.flyTo({
              center: [longitude, latitude],
              zoom: 12,
              essential: true
            });
          }
        },
        (error) => {
          console.log('Geolocation error:', error);
          toast.info('Unable to get your location. Showing Denver area.', {
            position: 'bottom-center',
            autoClose: 3000,
          });
        }
      );
    }
  }, []);

  // Fetch dispensaries
  const fetchDispensaries = useCallback(async () => {
    try {
      setLoading(true);

      const city = searchParams.get('city');
      const state = searchParams.get('state');
		setDispensaries(sampleDispensaries);
      setFilteredDispensaries(sampleDispensaries);
      /*const response = await axios.get('/api/dispensaries', {
        params: { city, state },
      });

      if (response.data.status === 'success' && response.data.data?.length > 0) {
        setDispensaries(response.data.data);
        setFilteredDispensaries(response.data.data);
      } else {
        setDispensaries(sampleDispensaries);
        setFilteredDispensaries(sampleDispensaries);
      }*/
    } catch (error) {
      console.error('Error fetching dispensaries:', error);
      setDispensaries(sampleDispensaries);
      setFilteredDispensaries(sampleDispensaries);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [defaultCenter.lng, defaultCenter.lat],
      zoom: 11,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'bottom-right'
    );

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Add markers when dispensaries change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    filteredDispensaries.forEach((dispensary) => {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.innerHTML = `
        <div class="marker-container ${selectedDispensary?.id === dispensary.id ? 'selected' : ''}">
          <div class="marker-pin ${dispensary.is_open ? 'open' : 'closed'}">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        </div>
      `;

      el.addEventListener('click', () => {
        setSelectedDispensary(dispensary);
        map.current?.flyTo({
          center: [dispensary.longitude, dispensary.latitude],
          zoom: 14,
          essential: true
        });
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([dispensary.longitude, dispensary.latitude])
        .addTo(map.current!);

      markers.current.push(marker);
    });

    // Fit bounds to show all markers
    if (filteredDispensaries.length > 0 && !selectedDispensary) {
      const bounds = new mapboxgl.LngLatBounds();
      filteredDispensaries.forEach(d => {
        bounds.extend([d.longitude, d.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 13 });
    }
  }, [filteredDispensaries, mapLoaded, selectedDispensary]);

  // Apply filters
  useEffect(() => {
    let result = [...dispensaries];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.city.toLowerCase().includes(query) ||
          d.address.toLowerCase().includes(query)
      );
    }

    if (filters.type !== 'all') {
      if (filters.type === 'medical') {
        result = result.filter((d) => d.is_medical);
      } else if (filters.type === 'recreational') {
        result = result.filter((d) => d.is_recreational);
      }
    }

    if (filters.open_now) {
      result = result.filter((d) => d.is_open);
    }

    if (filters.rating > 0) {
      result = result.filter((d) => d.rating >= filters.rating);
    }

    result.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    setFilteredDispensaries(result);
  }, [dispensaries, searchQuery, filters]);

  // Initialize
  useEffect(() => {
    fetchDispensaries();
    getUserLocation();
  }, [fetchDispensaries, getUserLocation]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const handleDispensaryClick = (dispensary: Dispensary) => {
    setSelectedDispensary(dispensary);
    if (map.current) {
      map.current.flyTo({
        center: [dispensary.longitude, dispensary.latitude],
        zoom: 14,
        essential: true
      });
    }
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      open_now: false,
      rating: 0,
    });
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Finding dispensaries near you...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Custom CSS for markers */}
      <style jsx global>{`
        .custom-marker {
          cursor: pointer;
        }
        .marker-container {
          transition: transform 0.2s ease;
        }
        .marker-container:hover,
        .marker-container.selected {
          transform: scale(1.2);
        }
        .marker-pin {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .marker-pin svg {
          transform: rotate(45deg);
        }
        .marker-pin.open {
          background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
          color: white;
        }
        .marker-pin.closed {
          background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
          color: white;
        }
        .marker-container.selected .marker-pin {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
        .mapboxgl-ctrl-group {
          border-radius: 8px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
        }
      `}</style>

      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 z-20">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            {/* Back Button */}
            <button
              onClick={() => router.push('/dispensary')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search dispensaries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Filters */}
            <div className="hidden md:flex items-center gap-2">
              <select
                value={filters.type}
                onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Types</option>
                <option value="medical">Medical</option>
                <option value="recreational">Recreational</option>
              </select>

              <button
                onClick={() => setFilters((prev) => ({ ...prev, open_now: !prev.open_now }))}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  filters.open_now ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                Open Now
              </button>
            </div>

            {/* Toggle List/Map on Mobile */}
            <button
              onClick={() => setShowList(!showList)}
              className="md:hidden p-2 bg-gray-100 rounded-lg"
            >
              {showList ? <MapIcon className="w-5 h-5" /> : <List className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Dispensary List */}
          <div
            className={`${
              showList ? 'flex' : 'hidden'
            } md:flex flex-col w-full md:w-96 bg-white border-r border-gray-200 overflow-hidden z-10`}
          >
            {/* Results Count */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{filteredDispensaries.length}</span> dispensaries found
                </p>
                {(filters.type !== 'all' || filters.open_now || filters.rating > 0 || searchQuery) && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Dispensary List */}
            <div className="flex-1 overflow-y-auto">
              {filteredDispensaries.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Leaf className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-800 mb-2">No dispensaries found</h3>
                  <p className="text-sm text-gray-600 mb-4">Try adjusting your filters</p>
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredDispensaries.map((dispensary) => (
                    <div
                      key={dispensary.id}
                      onClick={() => handleDispensaryClick(dispensary)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedDispensary?.id === dispensary.id ? 'bg-teal-50 border-l-4 border-teal-600' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Logo */}
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                          {dispensary.logo ? (
                            <Image
                              src={dispensary.logo}
                              alt={dispensary.name}
                              width={64}
                              height={64}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600">
                              <Leaf className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">
                              {dispensary.name}
                            </h3>
                            {dispensary.is_verified && (
                              <Verified className="w-4 h-4 text-teal-600 flex-shrink-0" />
                            )}
                          </div>

                          <div className="flex items-center gap-2 mb-1">
                            {renderStars(dispensary.rating)}
                            <span className="text-xs text-gray-500">({dispensary.review_count})</span>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{dispensary.address}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-medium ${
                              dispensary.is_open ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {dispensary.is_open ? 'Open' : 'Closed'}
                            </span>
                            {dispensary.distance && (
                              <span className="text-xs text-gray-500">
                                {dispensary.distance} mi
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 self-center" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Map Container */}
          <div className={`${showList ? 'hidden md:block' : 'block'} flex-1 relative`}>
            <div ref={mapContainer} className="absolute inset-0" />

            {/* Selected Dispensary Card */}
            {selectedDispensary && (
              <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-lg shadow-lg overflow-hidden z-20">
                <div className="p-4">
                  <button
                    onClick={() => setSelectedDispensary(null)}
                    className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>

                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                      {selectedDispensary.logo ? (
                        <Image
                          src={selectedDispensary.logo}
                          alt={selectedDispensary.name}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600">
                          <Leaf className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <h3 className="font-bold text-gray-900 truncate">{selectedDispensary.name}</h3>
                        {selectedDispensary.is_verified && (
                          <Verified className="w-4 h-4 text-teal-600" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(selectedDispensary.rating)}
                        <span className="text-sm text-gray-500">({selectedDispensary.review_count})</span>
                      </div>

                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {selectedDispensary.address}, {selectedDispensary.city}
                      </p>

                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-sm font-medium ${
                          selectedDispensary.is_open ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {selectedDispensary.is_open ? 'Open' : 'Closed'}
                        </span>
                        {selectedDispensary.distance && (
                          <span className="text-sm text-gray-500">{selectedDispensary.distance} mi away</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => router.push(`/dispensary/${selectedDispensary.slug}`)}
                      className="flex-1 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors text-sm"
                    >
                      View Menu
                    </button>
                    <a
                      href={`https://maps.google.com/?q=${selectedDispensary.latitude},${selectedDispensary.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm flex items-center justify-center"
                    >
                      <Navigation className="w-4 h-4" />
                    </a>
                    {selectedDispensary.phone && (
                      <a
                        href={`tel:${selectedDispensary.phone}`}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm flex items-center justify-center"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Map Legend */}
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-3 z-10">
              <p className="text-xs font-semibold text-gray-700 mb-2">Legend</p>
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                <div className="w-4 h-4 rounded-full bg-teal-500"></div>
                <span>Open</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                <span>Closed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}