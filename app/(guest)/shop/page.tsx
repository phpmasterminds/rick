'use client';

import { useState } from 'react';

const CATEGORIES = [
  { id: 'flower', name: 'Flower', count: 234, icon: '🌿' },
  { id: 'concentrates', name: 'Concentrates', count: 156, icon: '💎' },
  { id: 'edibles', name: 'Edibles', count: 189, icon: '🍫' },
  { id: 'vapes', name: 'Vapes', count: 142, icon: '💨' },
  { id: 'prerolls', name: 'Pre-Rolls', count: 98, icon: '🚬' },
  { id: 'topicals', name: 'Topicals', count: 67, icon: '🧴' },
  { id: 'tinctures', name: 'Tinctures', count: 45, icon: '💧' },
  { id: 'accessories', name: 'Accessories', count: 203, icon: '🔧' },
];

const FEATURED_PRODUCTS = [
  { id: 1, name: 'Purple Haze', category: 'Flower', thc: '24%', cbd: '0.5%', price: 45, store: 'Green Mile', img: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=400&h=400&fit=crop' },
  { id: 2, name: 'Live Resin Cart', category: 'Vapes', thc: '87%', cbd: '1%', price: 35, store: 'Bliss Botanicals', img: 'https://images.unsplash.com/photo-1585759065152-3b0e2524e869?w=400&h=400&fit=crop' },
  { id: 3, name: 'Gummy Bears 100mg', category: 'Edibles', thc: '10mg/pc', cbd: '0mg', price: 25, store: 'Redbud Collective', img: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&h=400&fit=crop' },
  { id: 4, name: 'OG Kush', category: 'Flower', thc: '22%', cbd: '0.3%', price: 40, store: 'Green Mile', img: 'https://images.unsplash.com/photo-1614520412073-009c37b916f9?w=400&h=400&fit=crop' },
  { id: 5, name: 'CBD Relief Balm', category: 'Topicals', thc: '0%', cbd: '500mg', price: 30, store: '405 Wellness', img: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop' },
  { id: 6, name: 'Sour Diesel', category: 'Flower', thc: '26%', cbd: '0.4%', price: 50, store: 'Bliss Botanicals', img: 'https://images.unsplash.com/photo-1536964310528-e47dd655ecf3?w=400&h=400&fit=crop' },
  { id: 7, name: 'THC Tincture', category: 'Tinctures', thc: '1000mg', cbd: '0mg', price: 55, store: 'Redbud Collective', img: 'https://images.unsplash.com/photo-1611689037241-d8dfe4280f2e?w=400&h=400&fit=crop' },
  { id: 8, name: 'Pre-Roll 5pk', category: 'Pre-Rolls', thc: '20%', cbd: '0.5%', price: 28, store: 'Green Mile', img: 'https://images.unsplash.com/photo-1617146719780-a66d6dd67ec2?w=400&h=400&fit=crop' },
];

const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <circle cx={11} cy={11} r={7} strokeWidth={2} />
    <line x1={21} y1={21} x2={16.65} y2={16.65} strokeWidth={2} />
  </svg>
);

const FilterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <line x1={4} y1={6} x2={20} y2={6} strokeWidth={2} />
    <line x1={4} y1={12} x2={20} y2={12} strokeWidth={2} />
    <line x1={4} y1={18} x2={20} y2={18} strokeWidth={2} />
  </svg>
);

export default function ShopPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-emerald-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">Shop Cannabis Products</h1>
            <p className="mt-4 text-lg text-slate-600">Browse our curated selection from top Oklahoma dispensaries</p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Browse by Category</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex flex-col items-center rounded-2xl border p-4 transition-all ${
                selectedCategory === cat.id
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 bg-white hover:border-emerald-300'
              }`}
            >
              <span className="text-3xl">{cat.icon}</span>
              <span className="mt-2 text-sm font-semibold text-slate-900">{cat.name}</span>
              <span className="mt-1 text-xs text-slate-500">{cat.count}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Search & Filters */}
      <section className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="thc">THC %</option>
              <option value="cbd">CBD %</option>
            </select>
            <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-50">
              <FilterIcon className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-slate-600">{FEATURED_PRODUCTS.length} products found</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_PRODUCTS.map((product) => (
            <div key={product.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="aspect-square overflow-hidden bg-slate-100">
                <img
                  src={product.img}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                    {product.category}
                  </span>
                  <span className="text-lg font-bold text-slate-900">${product.price}</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900">{product.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{product.store}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
                  <span className="rounded bg-slate-100 px-2 py-1">THC {product.thc}</span>
                  <span className="rounded bg-slate-100 px-2 py-1">CBD {product.cbd}</span>
                </div>
                <button className="mt-4 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Info Banner */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-emerald-50 to-white p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Can't find what you're looking for?</h2>
          <p className="mt-2 text-slate-600">Contact your nearest dispensary or browse our strain library</p>
          <div className="mt-6 flex justify-center gap-4">
            <button className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700">
              Contact Dispensary
            </button>
            <button className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-50">
              Browse Strains
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}