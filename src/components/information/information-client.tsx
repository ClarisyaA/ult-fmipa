"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  ImageOff,
  Megaphone,
  Search,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface InformationPost {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  summary: string | null;
  content: string;
  publishedAt: string | null;
}

interface InformationImage {
  id: string;
  altText: string | null;
  originalName: string;
  isCover: boolean;
  imageFit: "cover" | "contain";
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function InformasiClient({ 
  initialPosts, 
  initialCategories 
}: { 
  initialPosts: Array<{ post: InformationPost; coverImage: InformationImage | null }>;
  initialCategories: string[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredPosts = useMemo(() => {
    return initialPosts.filter(({ post }) => {
      const matchesSearch = post.title
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      
      const matchesCategory =
        selectedCategory === "all" || post.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [initialPosts, searchQuery, selectedCategory]);

  return (
    <>
      {/* SEARCH & FILTER */}
      <section className="search-sec bg-[#FEFDF9] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="layanan-search flex flex-col gap-4 md:flex-row md:items-end">
            <div className="w-full md:w-2/3">
              <label
                htmlFor="informasi-search"
                className="mb-2 ml-1 block text-[11px] font-bold uppercase tracking-widest text-[#6B5E52]"
              >
                Cari Informasi
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#A0917F]" />
                <Input
                  id="informasi-search"
                  placeholder="Cari judul informasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-13 rounded-2xl border-[#DDD5C3] bg-white pl-12 text-[#18130E] placeholder:text-[#A0917F] shadow-sm transition-all duration-200 focus-visible:border-[#EE1C25]/50 focus-visible:ring-1 focus-visible:ring-[#EE1C25]/30"
                />
              </div>
            </div>

            <div className="w-full md:w-1/3">
              <label
                htmlFor="informasi-category"
                className="mb-2 ml-1 block text-[11px] font-bold uppercase tracking-widest text-[#6B5E52]"
              >
                Kategori
              </label>
              <div className="relative">
                <select
                  id="informasi-category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-13 w-full appearance-none rounded-2xl border border-[#DDD5C3] bg-white px-4 pr-10 text-sm font-medium text-[#18130E] shadow-sm transition-all duration-200 focus:outline-none focus-visible:border-[#EE1C25]/50 focus-visible:ring-1 focus-visible:ring-[#EE1C25]/30"
                >
                  <option value="all">Semua Kategori</option>
                  {initialCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#A0917F]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DAFTAR INFORMASI */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        {filteredPosts.length === 0 ? (
          <div className="fade-up rounded-3xl border border-[#F5F0E8] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#EE1C25]/10">
              <Megaphone className="size-6 text-[#EE1C25]" strokeWidth={1.5} />
            </div>
            <p className="mt-4 text-sm text-[#7A6A5C]">
              {initialPosts.length > 0 
                ? "Tidak ada informasi yang sesuai dengan pencarian." 
                : "Belum ada informasi yang dipublikasikan."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map(({ post, coverImage }, index) => {
              const imageClass =
                coverImage?.imageFit === "contain"
                  ? "object-contain object-center p-4"
                  : "object-cover object-center transition-transform duration-500 group-hover:scale-105";

              return (
              <Link
                key={post.id}
                href={`/informasi/${post.slug}`}
                className="fade-up group relative flex flex-col overflow-hidden rounded-[1.8rem] border border-[#E8DECE] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#18130E]/15 hover:shadow-xl"
                style={{ animationDelay: `${Math.min(index, 6) * 80}ms` }}
              >
                <div className="relative aspect-video w-full overflow-hidden bg-[#F7F3EA]">
                  {coverImage ? (
                    <Image
                      src={`/api/information/images/${coverImage.id}`}
                      alt={coverImage.altText ?? coverImage.originalName}
                      fill
                      unoptimized
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className={imageClass}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageOff className="size-8 text-[#DDD5C3]" strokeWidth={1.5} />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    {post.category && (
                      <span className="rounded-full bg-[#EE1C25]/10 px-2.5 py-1 text-xs font-semibold text-[#EE1C25]">
                        {post.category}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-[#A0917F]">
                      <CalendarDays className="size-3.5" />
                      {formatDate(post.publishedAt)}
                    </span>
                  </div>

                  <h2 className="mt-3 text-[1.05rem] font-black leading-snug tracking-tight text-[#18130E] transition-colors group-hover:text-[#EE1C25]">
                    {post.title}
                  </h2>

                  {post.summary && (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#7A6A5C]">
                      {post.summary}
                    </p>
                  )}

                  <div className="mt-auto pt-6">
                    <span className="relative inline-flex items-center gap-1.5 text-sm font-bold text-[#EE1C25] transition-all duration-200 group-hover:translate-x-0.5">
                      Baca Informasi
                      <ArrowRight className="size-4" />
                      <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-[#EE1C25] transition-transform duration-300 group-hover:scale-x-100" />
                    </span>
                  </div>
                </div>
              </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
