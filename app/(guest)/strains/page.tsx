'use client';

import { useState } from 'react';

const STRAINS = [
  { id: 1, name: 'Blue Dream', type: 'Hybrid', thc: '18-24%', cbd: '0.1-0.5%', effects: ['Happy', 'Relaxed', 'Euphoric'], flavors: ['Berry', 'Sweet', 'Herbal'], img: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=600&h=400&fit=crop', rating: 4.7, available: 12 },
  { id: 2, name: 'OG Kush', type: 'Hybrid', thc: '20-25%', cbd: '0.1-0.3%', effects: ['Relaxed', 'Happy', 'Sleepy'], flavors: ['Earthy', 'Pine', 'Woody'], img: 'https://images.unsplash.com/photo-1614520412073-009c37b916f9?w=600&h=400&fit=crop', rating: 4.8, available: 8 },
  { id: 3, name: 'Sour Diesel', type: 'Sativa', thc: '20-26%', cbd: '0.1-0.5%', effects: ['Energetic', 'Creative', 'Focused'], flavors: ['Diesel', 'Pungent', 'Citrus'], img: 'https://images.unsplash.com/photo-1536964310528-e47dd655ecf3?w=600&h=400&fit=crop', rating: 4.6, available: 15 },
  { id: 4, name: 'Purple Haze', type: 'Sativa', thc: '18-24%', cbd: '0.1-0.3%', effects: ['Euphoric', 'Creative', 'Happy'], flavors: ['Berry', 'Sweet', 'Spicy'], img: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&h=400&fit=crop', rating: 4.5, available: 10 },
  { id: 5, name: 'Granddaddy Purple', type: 'Indica', thc: '17-23%', cbd: '0.1-0.3%', effects: ['Relaxed', 'Sleepy', 'Happy'], flavors: ['Grape', 'Berry', 'Sweet'], img: 'https://images.unsplash.com/photo-1583912086296-be5b665036da?w=600&h=400&fit=crop', rating: 4.7, available: 6 },
  { id: 6, name: 'Jack Herer', type: 'Sativa', thc: '18-24%', cbd: '0.1-0.5%', effects: ['Energetic', 'Creative', 'Uplifted'], flavors: ['Pine', 'Earthy', 'Woody'], img: 'https://images.unsplash.com/photo-1530564459304-0c430e0d6c33?w=600&h=400&fit=crop', rating: 4.9, available: 14 },
  { id: 7, name: 'Girl Scout Cookies', type: 'Hybrid', thc: '19-28%', cbd: '0.1-0.5%', effects: ['Happy', 'Relaxed', 'Euphoric'], flavors: ['Sweet', 'Earthy', 'Mint'], img: 'https://images.unsplash.com/photo-1595941120349-d4ba0e5d2939?w=600&h=400&fit=crop', rating: 4.8, available: 11 },
  { id: 8, name: 'Northern Lights', type: 'Indica', thc: '16-21%', cbd: '0.1-0.3%', effects: ['Relaxed', 'Sleepy', 'Happy'], flavors: ['Sweet', 'Earthy', 'Spicy'], img: 'https://images.unsplash.com/photo-1612834153723-1ce324f0555e?w=600&h=400&fit=crop', rating: 4.7, available: 9 },
];

const STRAIN_TYPES = ['All', 'Indica', 'Sativa', 'Hybrid'];
const EFFECTS = ['Happy', 'Relaxed', 'Energetic', 'Creative', 'Euphoric', 'Sleepy', 'Focused', 'Uplifted'];

const StarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 .587l3.668 7.431L24 9.748l-6 5.853 1.416 8.26L12 19.771 4.584 23.86 6 15.601 0 9.748l8.332-1.73z" />
  </svg>
);

const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <circle cx={11} cy={11} r={7} strokeWidth={2} />
    <line x1={21} y1={21} x2={16.65} y2={16.65} strokeWidth={2} />
  </svg>
);

const LeafIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" strokeWidth={2} />
    <path d="M12 6v12M6 12h12" strokeWidth={2} />
  </svg>
);

export default function StrainsPage() {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);

  const filteredStrains = STRAINS.filter(strain => {
    const matchesSearch = strain.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'All' || strain.type === selectedType;
    const matchesEffect = !selectedEffect || strain.effects.includes(selectedEffect);
    return matchesSearch && matchesType && matchesEffect;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-emerald-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-emerald-700">
              <LeafIcon className="h-5 w-5" />
              <span className="text-sm font-semibold">Strain Library</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">Explore Cannabis Strains</h1>
            <p className="mt-4 text-lg text-slate-600">
              Discover effects, flavors, and availability across Oklahoma dispensaries
            </p>
          </div>

          {/* Search Bar */}
          <div className="mx-auto mt-8 max-w-2xl">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search strains by name, effect, or flavor..."
                className="w-full rounded-2xl border border-slate-200 py-4 pl-12 pr-4 text-slate-900 placeholder-slate-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="space-y-4">
          {/* Type Filter */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Strain Type</h3>
            <div className="flex flex-wrap gap-2">
              {STRAIN_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    selectedType === type
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Effect Filter */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Effects</h3>
            <div className="flex flex-wrap gap-2">
              {EFFECTS.map((effect) => (
                <button
                  key={effect}
                  onClick={() => setSelectedEffect(selectedEffect === effect ? null : effect)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    selectedEffect === effect
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
                  }`}
                >
                  {effect}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Strains Grid */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            {filteredStrains.length} Strains Found
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStrains.map((strain) => (
            <div
              key={strain.id}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <img
                  src={strain.img}
                  alt={strain.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      strain.type === 'Indica'
                        ? 'bg-purple-500 text-white'
                        : strain.type === 'Sativa'
                        ? 'bg-orange-500 text-white'
                        : 'bg-green-500 text-white'
                    }`}
                  >
                    {strain.type}
                  </span>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold backdrop-blur">
                  <StarIcon className="h-3 w-3 text-yellow-500" />
                  {strain.rating}
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-xl font-bold text-slate-900">{strain.name}</h3>
                <div className="mt-3 flex items-center gap-4 text-sm text-slate-600">
                  <div>
                    <span className="font-medium">THC:</span> {strain.thc}
                  </div>
                  <div>
                    <span className="font-medium">CBD:</span> {strain.cbd}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Effects</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {strain.effects.map((effect) => (
                      <span
                        key={effect}
                        className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                      >
                        {effect}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Flavors</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {strain.flavors.map((flavor) => (
                      <span
                        key={flavor}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                      >
                        {flavor}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    Available at <span className="font-semibold">{strain.available}</span> locations
                  </span>
                </div>

                <button className="mt-4 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                  View Availability
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Educational Section */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-purple-50 to-white p-6">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <span className="text-2xl">🟣</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Indica</h3>
            <p className="mt-2 text-sm text-slate-600">
              Known for relaxing effects, often used in the evening. May help with sleep and pain relief.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-orange-50 to-white p-6">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
              <span className="text-2xl">🟠</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Sativa</h3>
            <p className="mt-2 text-sm text-slate-600">
              Energizing and uplifting effects, ideal for daytime use. May enhance creativity and focus.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-green-50 to-white p-6">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <span className="text-2xl">🟢</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Hybrid</h3>
            <p className="mt-2 text-sm text-slate-600">
              Balanced effects combining indica and sativa. Offers versatile benefits for various needs.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}