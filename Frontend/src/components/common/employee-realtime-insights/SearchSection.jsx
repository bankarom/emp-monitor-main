import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

function SearchSection({ search, setSearch }) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Search
            </label>
            <div className="relative w-full max-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-10 rounded-full bg-slate-50 border-slate-200 text-xs"
                />
            </div>
        </div>
    );
}

export default React.memo(SearchSection);
