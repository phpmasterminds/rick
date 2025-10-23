'use client';

const FEATURED_STORES = [
  { id: 1, name: 'Green Mile Dispensary', rating: 4.7, reviews: 213, badge: 'Top Rated', distanceMi: 1.2, openUntil: '10:00 PM', pickup: true, delivery: false, verified: true, description: 'Premium flower selection with knowledgeable staff', heroImg: 'https://images.unsplash.com/photo-1540317580380-c0e9683977a1?q=80&w=1600&auto=format&fit=crop', specialties: ['Flower', 'Pre-Rolls'] },
  { id: 2, name: 'Bliss Botanicals', rating: 4.6, reviews: 148, badge: 'Best Deals', distanceMi: 2.4, openUntil: '11:00 PM', pickup: true, delivery: true, verified: true, description: 'Wide variety of concentrates and edibles', heroImg: 'https://images.unsplash.com/photo-1622691008798-397776b77c5d?q=80&w=1600&auto=format&fit=crop', specialties: ['Concentrates', 'Edibles'] },
  { id: 3, name: 'Redbud Collective', rating: 4.9, reviews: 512, badge: 'Community Favorite', distanceMi: 3.1, openUntil: '9:00 PM', pickup: true, delivery: false, verified: true, description: 'Organic cultivation with focus on quality', heroImg: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?q=80&w=1600&auto=format&fit=crop', specialties: ['Organic', 'Craft Flower'] },
  { id: 4, name: '405 Wellness Co.', rating: 4.5, reviews: 89, badge: 'New Listing', distanceMi: 4.8, openUntil: '8:30 PM', pickup: false, delivery: false, verified: false, description: 'Medical-focused with veteran discounts', heroImg: 'https://images.unsplash.com/photo-1595974412210-9a21a2ec2f4f?q=80&w=1600&auto=format&fit=crop', specialties: ['Medical', 'Wellness'] },
];

const FEATURED_PRODUCTS = [
  { id: 1, name: 'Purple Haze Premium', category: 'Flower', store: 'Green Mile', price: 45, thc: '24%', featured: 'Editor\'s Pick', img: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=500&h=500&fit=crop' },
  { id: 2, name: 'Blue Dream Live Resin', category: 'Concentrates', store: 'Bliss Botanicals', price: 55, thc: '89%', featured: 'Most Popular', img: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=500&h=500&fit=crop' },
  { id: 3, name: 'Craft Gummy Collection', category: 'Edibles', store: 'Redbud Collective', price: 30, thc: '10mg/pc', featured: 'Best Value', img: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=500&h=500&fit=crop' },
];

const StarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 .587l3.668 7.431L24 9.748l-6 5.853 1.416 8.26L12 19.771 4.584 23.86 6 15.601 0 9.748l8.332-1.73z" />
  </svg>
);

const PinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path d="M12 22s-6-5.5-6-10a6 6 0 1 1 12 0c0 4.5-6 10-6 10Z" strokeWidth={2} />
    <circle cx={12} cy={12} r={2} strokeWidth={2} />
  </svg>
);

const BadgeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <circle cx={12} cy={8} r={7} strokeWidth={2} />
    <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" strokeWidth={2} />
  </svg>
);

const TrendingIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path d="M23 6l-9.5 9.5-5-5L1 18" strokeWidth={2} />
    <path d="M17 6h6v6" strokeWidth={2} />
  </svg>
);

export default function FeaturedPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=2400')] bg-cover bg-center opacity-10" />
        <div className="relative mx-auto max-w-6xl px-4 py-20">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur">
              <TrendingIcon className="h-5 w-5" />
              <span className="text-sm font-semibold">Curated Selection</span>
            </div>
            <h1 className="text-4xl font-bold sm:text-5xl">Featured This Week</h1>
            <p className="mt-4 text-lg text-emerald-50">
              Hand-picked dispensaries and products loved by the Oklahoma cannabis community
            </p>
          </div>
        </div>
      </section>

      {/* Featured Dispensaries */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">⭐ Featured Dispensaries</h2>
            <p className="mt-2 text-slate-600">Top-rated locations chosen by our team</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {FEATURED_STORES.map((store) => (
            <div
              key={store.id}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg transition-shadow hover:shadow-xl"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={store.heroImg}
                  alt={store.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-3 py-1 text-sm font-bold text-white">
                    <BadgeIcon className="h-4 w-4" />
                    {store.badge}
                  </div>
                  {store.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-slate-900 backdrop-blur">
                      ✓ Verified
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-2xl font-bold text-slate-900">{store.name}</h3>
                <p className="mt-2 text-slate-600">{store.description}</p>

                <div className="mt-4 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <StarIcon className="h-4 w-4 text-emerald-600" />
                    <span className="font-semibold text-slate-900">{store.rating}</span>
                    <span className="text-slate-500">({store.reviews})</span>
                  </div>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <div className="flex items-center gap-1 text-slate-600">
                    <PinIcon className="h-4 w-4" />
                    {store.distanceMi} mi
                  </div>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span className="text-slate-600">Open until {store.openUntil}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {store.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex gap-3">
                  <button className="flex-1 rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700">
                    View Menu
                  </button>
                  <button className="rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50">
                    Get Directions
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-slate-900">🌟 Featured Products</h2>
            <p className="mt-2 text-slate-600">Standout products from our featured dispensaries</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_PRODUCTS.map((product) => (
              <div
                key={product.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                  <img
                    src={product.img}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-3 left-3 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-slate-900">
                    {product.featured}
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {product.category}
                    </span>
                    <span className="text-xl font-bold text-slate-900">${product.price}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{product.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{product.store}</p>

                  <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm font-semibold text-emerald-700">
                    THC {product.thc}
                  </div>

                  <button className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                    View Product
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Featured Section */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-8 md:p-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">Why Featured?</h2>
            <p className="mt-4 text-lg text-slate-600">
              Our featured selections are based on quality, community feedback, and verified excellence
            </p>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
                <span className="text-3xl">🏆</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Top Rated</h3>
              <p className="mt-2 text-sm text-slate-600">
                Consistently high ratings and positive reviews from the community
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
                <span className="text-3xl">✓</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Verified Quality</h3>
              <p className="mt-2 text-sm text-slate-600">
                All products tested and verified for potency and safety
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
                <span className="text-3xl">💚</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Community Favorite</h3>
              <p className="mt-2 text-sm text-slate-600">
                Loved and recommended by Oklahoma cannabis patients
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}