'use client';

import { useState } from 'react';

const DEALS = [
  { id: 1, title: 'BOGO 50% Off Cartridges', store: 'Bliss Botanicals', discount: '50%', endsIn: '2d', code: 'CART50', category: 'Vapes', img: 'https://images.unsplash.com/photo-1585759065152-3b0e2524e869?w=600&h=400&fit=crop', featured: true },
  { id: 2, title: '$20 Eighth Ounces', store: 'Green Mile Dispensary', discount: '$20', endsIn: 'Today', code: 'EIGHTS20', category: 'Flower', img: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=600&h=400&fit=crop', featured: true },
  { id: 3, title: 'Free Pre-roll with $60+ Purchase', store: 'Redbud Collective', discount: 'Free Gift', endsIn: '5d', code: 'PREROLL60', category: 'Pre-Rolls', img: 'https://images.unsplash.com/photo-1617146719780-a66d6dd67ec2?w=600&h=400&fit=crop', featured: true },
  { id: 4, title: '10% Off for Veterans', store: '405 Wellness Co.', discount: '10%', endsIn: 'Always On', code: 'VET10', category: 'All Products', img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop', featured: false },
  { id: 5, title: 'Happy Hour: 25% Off Edibles', store: 'Bliss Botanicals', discount: '25%', endsIn: '12h', code: 'EDIBLE25', category: 'Edibles', img: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&h=400&fit=crop', featured: false },
  { id: 6, title: 'Bundle Deal: 3 for $90', store: 'Green Mile Dispensary', discount: '$90', endsIn: '3d', code: 'BUNDLE90', category: 'Flower', img: 'https://images.unsplash.com/photo-1614520412073-009c37b916f9?w=600&h=400&fit=crop', featured: false },
  { id: 7, title: 'New Patient: 20% Off First Visit', store: 'Redbud Collective', discount: '20%', endsIn: 'Ongoing', code: 'NEWPATIENT', category: 'All Products', img: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600&h=400&fit=crop', featured: false },
  { id: 8, title: 'Concentrate Day: $25 Grams', store: '405 Wellness Co.', discount: '$25', endsIn: 'Today', code: 'CONC25', category: 'Concentrates', img: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&h=400&fit=crop', featured: false },
];

const CATEGORIES = ['All', 'Flower', 'Vapes', 'Edibles', 'Concentrates', 'Pre-Rolls'];

const TagIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path d="M20.59 13.41L11 3H4v7l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82z" strokeWidth={2} />
    <circle cx={7.5} cy={7.5} r={1.5} strokeWidth={2} />
  </svg>
);

const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <circle cx={12} cy={12} r={10} strokeWidth={2} />
    <path d="M12 6v6l4 2" strokeWidth={2} />
  </svg>
);

const CopyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <rect x={9} y={9} width={13} height={13} rx={2} strokeWidth={2} />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth={2} />
  </svg>
);

export default function DealsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      alert('Code: ' + code);
    }
  };

  const filteredDeals = selectedCategory === 'All' 
    ? DEALS 
    : DEALS.filter(deal => deal.category === selectedCategory);

  const featuredDeals = DEALS.filter(deal => deal.featured);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-emerald-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-emerald-700">
              <TagIcon className="h-5 w-5" />
              <span className="text-sm font-semibold">Updated Hourly</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">Today's Best Deals</h1>
            <p className="mt-4 text-lg text-slate-600">Save big on your favorite cannabis products across Oklahoma City</p>
          </div>
        </div>
      </section>

      {/* Featured Deals Carousel */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">🔥 Featured Deals</h2>
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-4">
          {featuredDeals.map((deal) => (
            <div key={deal.id} className="min-w-[340px] max-w-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="relative h-40 overflow-hidden">
                <img src={deal.img} alt={deal.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <span className="inline-block rounded-full bg-emerald-500 px-3 py-1 text-sm font-bold text-white">
                    {deal.discount} OFF
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-slate-900">{deal.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{deal.store}</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <ClockIcon className="h-4 w-4" />
                  <span>Ends in {deal.endsIn}</span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex-1 rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm font-semibold text-slate-900">
                    {deal.code}
                  </div>
                  <button
                    onClick={() => handleCopyCode(deal.code)}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    <CopyIcon className="h-4 w-4" />
                    {copiedCode === deal.code ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Category Filter */}
      <section className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* All Deals Grid */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">All Active Deals</h2>
          <p className="text-sm text-slate-600">{filteredDeals.length} deals available</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDeals.map((deal) => (
            <div key={deal.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <img src={deal.img} alt={deal.title} className="h-full w-full object-cover" />
                <div className="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-emerald-700 backdrop-blur">
                  {deal.discount}
                </div>
              </div>
              <div className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {deal.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {deal.endsIn}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{deal.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{deal.store}</p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex-1 rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm font-semibold text-slate-900">
                    {deal.code}
                  </div>
                  <button
                    onClick={() => handleCopyCode(deal.code)}
                    className="rounded-lg bg-emerald-600 p-2 text-white hover:bg-emerald-700"
                  >
                    <CopyIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Don't Miss Out on Daily Deals</h2>
          <p className="mt-2 text-slate-600">Sign up to get deal alerts sent directly to your phone</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <input
              type="tel"
              placeholder="Enter your phone number"
              className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:w-64"
            />
            <button className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700">
              Get Deal Alerts
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            By signing up, you agree to receive promotional texts. Message and data rates may apply.
          </p>
        </div>
      </section>
    </div>
  );
}