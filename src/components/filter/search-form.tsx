"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchFormProps {
  currentSearch: string;
  currentStatus: string;
  baseUrl: string;
}

export function SearchForm({
  currentSearch,
  currentStatus,
  baseUrl,
}: SearchFormProps) {
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get("search") as string;
    
    const params = new URLSearchParams();
    if (search && search.trim()) params.set("search", search.trim());
    if (currentStatus && currentStatus !== "all") params.set("status", currentStatus);
    
    const query = params.toString();
    const url = query ? `${baseUrl}?${query}` : baseUrl;
    router.push(url);
  };

  return (
    <form onSubmit={handleSearch} className="flex-1 flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#A0917F]" />
        <Input
          type="text"
          name="search"
          placeholder="Cari layanan atau keterangan..."
          defaultValue={currentSearch}
          className="h-10 rounded-xl border-[#DDD5C3] bg-white pl-9 text-sm placeholder:text-[#A0917F] focus-visible:border-[#EE1C25]/50 focus-visible:ring-1 focus-visible:ring-[#EE1C25]/30"
        />
      </div>
      <Button 
        type="submit" 
        variant="outline" 
        size="sm"
        className="h-10 px-4 border-[#DDD5C3] hover:border-[#EE1C25] hover:bg-[#EE1C25]/5 hover:text-[#EE1C25]"
      >
        <Search className="size-4" />
      </Button>
    </form>
  );
}