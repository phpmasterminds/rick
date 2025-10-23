'use client';

import Head from "next/head";
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from "next/link";

// Mock Data
const STORES = [
  { id: "okc-green-mile", name: "Green Mile Dispensary", rating: 4.7, reviews: 213, distanceMi: 1.2, openUntil: "10:00 PM", pickup: true, delivery: false, verified: true, medicalOnly: true, heroImg: "https://images.unsplash.com/photo-1540317580380-c0e9683977a1?q=80&w=1600&auto=format&fit=crop" },
  { id: "okc-bliss", name: "Bliss Botanicals", rating: 4.6, reviews: 148, distanceMi: 2.4, openUntil: "11:00 PM", pickup: true, delivery: true, verified: true, medicalOnly: true, heroImg: "https://images.unsplash.com/photo-1622691008798-397776b77c5d?q=80&w=1600&auto=format&fit=crop" },
  { id: "okc-redbud", name: "Redbud Collective", rating: 4.9, reviews: 512, distanceMi: 3.1, openUntil: "9:00 PM", pickup: true, delivery: false, verified: true, medicalOnly: true, heroImg: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?q=80&w=1600&auto=format&fit=crop" },
  { id: "okc-405-wellness", name: "405 Wellness Co.", rating: 4.5, reviews: 89, distanceMi: 4.8, openUntil: "8:30 PM", pickup: false, delivery: false, verified: false, medicalOnly: true, heroImg: "https://images.unsplash.com/photo-1595974412210-9a21a2ec2f4f?q=80&w=1600&auto=format&fit=crop" },
];

const DEALS = [
  { id: "deal-1", title: "BOGO 50% Off Carts", store: "Bliss Botanicals", endsIn: "2d", code: "OKC-BOGO50" },
  { id: "deal-2", title: "$20 1/8ths (Select Shelf)", store: "Green Mile Dispensary", endsIn: "Today", code: "EIGHTS20" },
  { id: "deal-3", title: "Free Pre-roll w/ $60+", store: "Redbud Collective", endsIn: "5d", code: "RED-ROLL" },
  { id: "deal-4", title: "10% Off Veterans", store: "405 Wellness Co.", endsIn: "Always On", code: "VET10" },
];

const BANNERS = [
  { id: "banner-1", title: "New Patient Specials", subtitle: "Extra 10% off first order", cta: "Browse deals", href: "#deals", img: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=2400&auto=format&fit=crop" },
  { id: "banner-2", title: "Top-rated Dispensaries", subtitle: "See what OKC loves this week", cta: "View featured", href: "#featured", img: "https://images.unsplash.com/photo-1520975922284-9fa99e48b1e8?q=80&w=2400&auto=format&fit=crop" },
  { id: "banner-3", title: "Explore Strains", subtitle: "Effects, terpenes, and nearby inventory", cta: "Explore strains", href: "#", img: "https://images.unsplash.com/photo-1519904981063-b0cf448d479d?q=80&w=2400&auto=format&fit=crop" },
];

// Icons
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

const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <circle cx={11} cy={11} r={7} strokeWidth={2} />
    <line x1={21} y1={21} x2={16.65} y2={16.65} strokeWidth={2} />
  </svg>
);

const NavIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <polygon points="3 11 22 2 13 21 11 13 3 11" strokeWidth={2} />
  </svg>
);

const TagIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path d="M20.59 13.41L11 3H4v7l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82z" strokeWidth={2} />
    <circle cx={7.5} cy={7.5} r={1.5} strokeWidth={2} />
  </svg>
);

// Components
const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium text-slate-700 border-slate-200 bg-white/70 backdrop-blur">
    {children}
  </span>
);

const BannerCard = ({ item }: { item: typeof BANNERS[0] }) => (
  <div className="relative h-56 w-[92vw] max-w-4xl flex-shrink-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm sm:h-64">
    <img src={item.img} alt="promo" className="absolute inset-0 h-full w-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
    <div className="relative z-10 flex h-full flex-col justify-center p-6 text-white sm:p-8">
      <h3 className="text-2xl font-bold drop-shadow-sm">{item.title}</h3>
      <p className="mt-1 max-w-md text-sm opacity-90">{item.subtitle}</p>
      <div className="mt-3">
        <a href={item.href} className="inline-flex rounded-xl bg-white/95 px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-white">
          {item.cta}
        </a>
      </div>
    </div>
  </div>
);

const BannerScroller = ({ banners }: { banners: typeof BANNERS }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hoverRef = useRef(false);

  const scrollToIdx = (idx: number) => {
    const el = ref.current;
    if (!el) return;
    const slide = el.querySelector('[data-slide]');
    const gap = 16;
    const slideW = slide ? slide.getBoundingClientRect().width + gap : el.clientWidth;
    el.scrollTo({ left: idx * slideW, behavior: 'smooth' });
    setCurrentIdx(idx);
  };

  const next = () => {
    const el = ref.current;
    if (!el) return;
    const slideCount = el.querySelectorAll('[data-slide]').length;
    scrollToIdx((currentIdx + 1) % slideCount);
  };

  const prev = () => {
    const el = ref.current;
    if (!el) return;
    const slideCount = el.querySelectorAll('[data-slide]').length;
    scrollToIdx((currentIdx - 1 + slideCount) % slideCount);
  };

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const start = () => {
      if (timerRef.current) return;
      timerRef.current = setInterval(() => {
        if (!hoverRef.current) next();
      }, 3500);
    };

    const stop = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    start();
    return stop;
  }, [currentIdx]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let to: NodeJS.Timeout;

    const onScrollEnd = () => {
      const slide = el.querySelector('[data-slide]');
      const gap = 16;
      const slideW = slide ? slide.getBoundingClientRect().width + gap : el.clientWidth;
      setCurrentIdx(Math.round(el.scrollLeft / slideW));
    };

    const onScroll = () => {
      clearTimeout(to);
      to = setTimeout(onScrollEnd, 120);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(to);
      el.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 pt-4 pb-6">
      <div
        ref={ref}
        className="no-scrollbar relative flex gap-4 overflow-x-auto rounded-3xl p-1 snap-x snap-mandatory scroll-smooth"
        onMouseEnter={() => (hoverRef.current = true)}
        onMouseLeave={() => (hoverRef.current = false)}
        onFocus={() => (hoverRef.current = true)}
        onBlur={() => (hoverRef.current = false)}
        aria-roledescription="carousel"
        aria-label="Promotional banners"
      >
        {banners.map((b) => (
          <div key={b.id} data-slide className="snap-start">
            <BannerCard item={b} />
          </div>
        ))}
        <button
          type="button"
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md ring-1 ring-slate-200 hover:bg-white"
          aria-label="Previous banner"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
            <path d="M15 18l-6-6 6-6" strokeWidth={2} />
          </svg>
        </button>
        <button
          type="button"
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md ring-1 ring-slate-200 hover:bg-white"
          aria-label="Next banner"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
            <path d="M9 6l6 6-6 6" strokeWidth={2} />
          </svg>
        </button>
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        {banners.map((b, i) => (
          <button
            key={b.id + '-dot'}
            onClick={() => scrollToIdx(i)}
            className={`h-1.5 w-5 rounded-full ${i === currentIdx ? 'bg-emerald-600' : 'bg-slate-300'}`}
            aria-selected={i === currentIdx}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

const StoreCard = ({ store }: { store: typeof STORES[0] }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="aspect-[16/9] w-full overflow-hidden">
      <img
        src={store.heroImg}
        alt="Store cover"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
    <div className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{store.name}</h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1">
              <StarIcon className="h-4 w-4 text-emerald-600" /> {store.rating}{' '}
              <span className="text-slate-400">({store.reviews})</span>
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="inline-flex items-center gap-1">
              <PinIcon className="h-4 w-4" /> {store.distanceMi} mi
            </span>
          </div>
        </div>
        {store.verified && <Badge>Verified</Badge>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge>Open until {store.openUntil}</Badge>
        {store.pickup && <Badge>Pickup</Badge>}
        {store.delivery && <Badge>Delivery</Badge>}
        {store.medicalOnly && <Badge>Medical</Badge>}
      </div>
      <div className="flex gap-2 pt-1">
        <button className="inline-flex flex-1 items-center justify-center accent-bg accent-hover rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white active:scale-[.99]">
          View menu
        </button>
        <button className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Details
        </button>
      </div>
    </div>
  </div>
);

const DealCard = ({ deal, onClaim }: { deal: typeof DEALS[0]; onClaim: (code: string) => void }) => (
  <div className="min-w-[300px] max-w-[300px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-2 text-emerald-700">
      <TagIcon className="h-5 w-5" />
      <span className="text-xs font-semibold uppercase tracking-wide">Deal</span>
    </div>
    <h3 className="mt-2 text-lg font-semibold text-slate-900">{deal.title}</h3>
    <p className="text-sm text-slate-600">{deal.store}</p>
    <p className="mt-2 text-xs text-slate-500">Ends in {deal.endsIn}</p>
    <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 p-2 text-sm text-slate-700">
      <span className="rounded-md bg-white px-2 py-1 font-mono text-xs">{deal.code}</span>
      <button
        onClick={() => onClaim(deal.code)}
        className="inline-flex items-center gap-1 rounded-lg accent-bg accent-hover px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
      >
        Claim
      </button>
    </div>
  </div>
);

const DealsRail = ({ deals, onClaim }: { deals: typeof DEALS; onClaim: (code: string) => void }) => (
  <section id="deals" className="mx-auto max-w-6xl px-4 pt-2 pb-16">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-xl font-bold text-slate-900">Today's Deals in OK</h2>
      <div className="text-sm text-slate-600">Updated hourly</div>
    </div>
    <div className="no-scrollbar flex gap-4 overflow-x-auto rounded-2xl p-1">
      {deals.map((d) => (
        <DealCard key={d.id} deal={d} onClaim={onClaim} />
      ))}
    </div>
  </section>
);

const Hero = ({
  onLocate,
  search,
  setSearch,
  tab,
  setTab,
}: {
  onLocate: () => void;
  search: string;
  setSearch: (s: string) => void;
  tab: string;
  setTab: (t: string) => void;
}) => {
  const tabs = ['All', 'Dispensaries', 'Products', 'Deals', 'Doctors'];
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50 via-white to-white" />
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-8 sm:pt-24">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Find medical cannabis near you
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Search dispensaries, menus, and deals across Oklahoma City.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  tab === t
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="mt-6 w-full max-w-3xl">
            <div className="group relative flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm ring-emerald-500 focus-within:ring-2">
              <SearchIcon className="ml-2 h-5 w-5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dispensaries, products, or strains..."
                className="flex-1 border-none bg-transparent py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={onLocate}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 active:scale-[.99]"
              >
                <NavIcon className="h-4 w-4" /> Use my location
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Oklahoma medical use only. By continuing, you confirm you are 18+.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};


export default function pageContent() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('All');
  const [nearby, setNearby] = useState(STORES);

  useEffect(() => {
    const filtered = STORES.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
    setNearby(filtered);
  }, [search]);

  const onLocate = () => {
    alert('Using a demo location: Downtown OKC (73102). Results sorted by distance.');
  };

  const onClaim = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      alert('Copied ' + code);
    } catch {
      alert('Code: ' + code);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Hero onLocate={onLocate} search={search} setSearch={setSearch} tab={tab} setTab={setTab} />
      <BannerScroller banners={BANNERS} />
      <section id="featured" className="mx-auto max-w-6xl px-4 pb-14">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Featured Dispensaries</h2>
          <a className="text-sm font-medium text-emerald-700 hover:underline" href="#">
            See all featured
          </a>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STORES.slice(0, 4).map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      </section>
      <DealsRail deals={DEALS} onClaim={onClaim} />
      <section className="mx-auto max-w-6xl px-4 pb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Near you in Oklahoma City</h2>
          <button className="text-sm font-medium text-emerald-700 hover:underline">See all</button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {nearby.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      </section>
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-6xl px-4 text-xs text-slate-500">
          Oklahoma medical cannabis only. © {new Date().getFullYear()} Nature's High.
        </div>
      </footer>
    </div>
  );
}