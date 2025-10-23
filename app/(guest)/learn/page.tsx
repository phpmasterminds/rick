'use client';

import { useState } from 'react';

const ARTICLES = [
  { id: 1, title: 'Cannabis 101: A Beginner\'s Guide', category: 'Getting Started', readTime: '8 min', img: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=600&h=400&fit=crop', excerpt: 'Everything you need to know about medical cannabis, from basics to consumption methods.' },
  { id: 2, title: 'Understanding THC vs CBD', category: 'Cannabinoids', readTime: '6 min', img: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&h=400&fit=crop', excerpt: 'Learn the differences between these two primary cannabinoids and their effects.' },
  { id: 3, title: 'How to Choose the Right Strain', category: 'Strains', readTime: '10 min', img: 'https://images.unsplash.com/photo-1536964310528-e47dd655ecf3?w=600&h=400&fit=crop', excerpt: 'A comprehensive guide to selecting strains based on your needs and preferences.' },
  { id: 4, title: 'Oklahoma Medical Cannabis Laws', category: 'Legal', readTime: '12 min', img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop', excerpt: 'Understanding your rights and responsibilities as an Oklahoma medical patient.' },
  { id: 5, title: 'Consumption Methods Explained', category: 'Methods', readTime: '7 min', img: 'https://images.unsplash.com/photo-1585759065152-3b0e2524e869?w=600&h=400&fit=crop', excerpt: 'From smoking to edibles: find the right consumption method for you.' },
  { id: 6, title: 'Terpenes and Their Effects', category: 'Science', readTime: '9 min', img: 'https://images.unsplash.com/photo-1614520412073-009c37b916f9?w=600&h=400&fit=crop', excerpt: 'Discover how terpenes influence cannabis effects and flavors.' },
];

const FAQS = [
  { q: 'How do I get a medical cannabis card in Oklahoma?', a: 'Oklahoma residents 18+ can apply online through the OMMA website. You\'ll need a physician recommendation, valid ID, proof of residency, and the application fee ($100 for 2 years). The process typically takes 14 business days.' },
  { q: 'What conditions qualify for medical cannabis?', a: 'Oklahoma has an open medical program - any condition that a licensed physician believes could benefit from cannabis qualifies. Common conditions include chronic pain, anxiety, PTSD, cancer, and epilepsy.' },
  { q: 'How much cannabis can I possess?', a: 'Oklahoma medical patients can possess up to 3 oz of cannabis on their person, 8 oz at their residence, 1 oz of concentrate, and 72 oz of edibles.' },
  { q: 'Can I grow my own cannabis?', a: 'Yes! Oklahoma medical patients can grow up to 6 mature plants and 6 seedlings at their residence for personal use.' },
  { q: 'Where can I consume cannabis legally?', a: 'You can consume on private property with permission. Public consumption is prohibited, including in vehicles, parks, and sidewalks.' },
];

const CATEGORIES = ['All', 'Getting Started', 'Cannabinoids', 'Strains', 'Legal', 'Methods', 'Science'];

const BookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeWidth={2} />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeWidth={2} />
  </svg>
);

const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <circle cx={12} cy={12} r={10} strokeWidth={2} />
    <path d="M12 6v6l4 2" strokeWidth={2} />
  </svg>
);

const QuestionIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <circle cx={12} cy={12} r={10} strokeWidth={2} />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeWidth={2} />
    <line x1={12} y1={17} x2={12.01} y2={17} strokeWidth={2} />
  </svg>
);

const ChevronIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path d="M6 9l6 6 6-6" strokeWidth={2} />
  </svg>
);

export default function LearnPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const filteredArticles = selectedCategory === 'All'
    ? ARTICLES
    : ARTICLES.filter(article => article.category === selectedCategory);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-emerald-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-emerald-700">
              <BookIcon className="h-5 w-5" />
              <span className="text-sm font-semibold">Education Center</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">Learn About Cannabis</h1>
            <p className="mt-4 text-lg text-slate-600">
              Your complete guide to medical cannabis in Oklahoma
            </p>
          </div>
        </div>
      </section>

      {/* Quick Start Guide */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8 md:p-12">
          <h2 className="text-2xl font-bold text-slate-900">🚀 Quick Start Guide</h2>
          <p className="mt-2 text-slate-600">New to medical cannabis? Start here.</p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl">
                1️⃣
              </div>
              <h3 className="text-lg font-bold text-slate-900">Get Your Card</h3>
              <p className="mt-2 text-sm text-slate-600">
                Apply for your Oklahoma medical cannabis card through OMMA
              </p>
              <button className="mt-4 text-sm font-semibold text-emerald-700 hover:underline">
                Learn more →
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl">
                2️⃣
              </div>
              <h3 className="text-lg font-bold text-slate-900">Find Dispensaries</h3>
              <p className="mt-2 text-sm text-slate-600">
                Browse verified dispensaries near you with quality products
              </p>
              <button className="mt-4 text-sm font-semibold text-emerald-700 hover:underline">
                Browse now →
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl">
                3️⃣
              </div>
              <h3 className="text-lg font-bold text-slate-900">Choose Products</h3>
              <p className="mt-2 text-sm text-slate-600">
                Learn about strains, effects, and find what works for you
              </p>
              <button className="mt-4 text-sm font-semibold text-emerald-700 hover:underline">
                Explore strains →
              </button>
            </div>
          </div>
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

      {/* Articles Grid */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Educational Articles</h2>
          <p className="mt-1 text-slate-600">{filteredArticles.length} articles available</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => (
            <article
              key={article.id}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <img
                  src={article.img}
                  alt={article.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div className="p-5">
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                    {article.category}
                  </span>
                  <div className="flex items-center gap-1 text-slate-500">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {article.readTime}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700">
                  {article.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{article.excerpt}</p>

                <button className="mt-4 text-sm font-semibold text-emerald-700 hover:underline">
                  Read article →
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-slate-700">
              <QuestionIcon className="h-5 w-5" />
              <span className="text-sm font-semibold">Frequently Asked Questions</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Common Questions</h2>
            <p className="mt-2 text-slate-600">Quick answers to help you get started</p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="pr-4 text-lg font-semibold text-slate-900">{faq.q}</span>
                  <ChevronIcon
                    className={`h-5 w-5 flex-shrink-0 text-slate-400 transition-transform ${
                      expandedFaq === idx ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedFaq === idx && (
                  <div className="border-t border-slate-100 bg-slate-50 p-5">
                    <p className="text-slate-600">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Additional Resources</h2>
          <p className="mt-2 text-slate-600">External links and helpful tools</p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <a
            href="#"
            className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-emerald-300 hover:shadow-md"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl">
              🏛️
            </div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700">
              OMMA Official Site
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Oklahoma Medical Marijuana Authority official resources
            </p>
          </a>

          <a
            href="#"
            className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-emerald-300 hover:shadow-md"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl">
              📚
            </div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700">
              Strain Database
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Comprehensive database of cannabis strains and genetics
            </p>
          </a>

          <a
            href="#"
            className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-emerald-300 hover:shadow-md"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl">
              👨‍⚕️
            </div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700">
              Find a Doctor
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Locate physicians who can recommend medical cannabis
            </p>
          </a>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-emerald-600 to-emerald-700 p-8 text-center text-white md:p-12">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="mt-3 text-lg text-emerald-50">
            Browse dispensaries and find the right products for your needs
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <button className="rounded-xl bg-white px-8 py-3 font-semibold text-emerald-700 hover:bg-emerald-50">
              Browse Dispensaries
            </button>
            <button className="rounded-xl border-2 border-white px-8 py-3 font-semibold text-white hover:bg-white/10">
              Explore Strains
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}