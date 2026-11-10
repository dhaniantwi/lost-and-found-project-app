import React, { useState, useMemo } from 'react';
import { ItemReport, ItemCategory } from '../types';
import { ITEM_CATEGORIES, UCC_LOCATIONS } from '../data/seedData';
import { ItemCard } from './ItemCard';
import { Search, Filter, LayoutGrid, Table as TableIcon, X, Calendar, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

interface ItemListProps {
  items: ItemReport[];
  onSelectItem: (item: ItemReport) => void;
  onClaimItem: (item: ItemReport) => void;
  onOpenReportModal: () => void;
}

export const ItemList: React.FC<ItemListProps> = ({
  items,
  onSelectItem,
  onClaimItem,
  onOpenReportModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'lost' | 'found' | 'recovered'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Type filter
      if (typeFilter === 'lost' && (item.type !== 'lost' || item.status === 'recovered')) return false;
      if (typeFilter === 'found' && (item.type !== 'found' || item.status === 'recovered')) return false;
      if (typeFilter === 'recovered' && item.status !== 'recovered') return false;

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

      // Location filter
      if (selectedLocation !== 'all' && !item.campusLocation.includes(selectedLocation)) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesLoc = item.campusLocation.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        const matchesColor = item.color.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesLoc && !matchesCategory && !matchesColor) {
          return false;
        }
      }

      return true;
    });
  }, [items, typeFilter, selectedCategory, selectedLocation, searchTerm]);

  const hasActiveFilters = searchTerm !== '' || typeFilter !== 'all' || selectedCategory !== 'all' || selectedLocation !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setSelectedCategory('all');
    setSelectedLocation('all');
  };

  return (
    <section className="space-y-6">
      {/* Search and Filter Controls Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Live Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by keyword, item name, color, or location (e.g., 'Casio', 'Sam Jonah', 'Wallet')..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all text-slate-800 placeholder-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Segmented Type Controls (Allowed functional button elements) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0 overflow-x-auto">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                typeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Items ({items.length})
            </button>
            <button
              onClick={() => setTypeFilter('lost')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                typeFilter === 'lost'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              Lost Items ({items.filter((i) => i.type === 'lost' && i.status !== 'recovered').length})
            </button>
            <button
              onClick={() => setTypeFilter('found')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                typeFilter === 'found'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Found Items ({items.filter((i) => i.type === 'found' && i.status !== 'recovered').length})
            </button>
            <button
              onClick={() => setTypeFilter('recovered')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                typeFilter === 'recovered'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-blue-900'
              }`}
            >
              Recovered ({items.filter((i) => i.status === 'recovered').length})
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-lg shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium whitespace-nowrap">Category:</span>
            <select
              aria-label="Filter by category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              <option value="all">All Categories</option>
              {ITEM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium whitespace-nowrap">UCC Campus Zone:</span>
            <select
              aria-label="Filter by UCC Campus Zone"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-900 max-w-xs"
            >
              <option value="all">All Campus Locations</option>
              {UCC_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="ml-auto text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium underline transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Showing <span className="font-semibold text-slate-800 font-mono tabular-nums">{filteredItems.length}</span>{' '}
          {filteredItems.length === 1 ? 'item' : 'items'}
          {searchTerm && <span> matching "{searchTerm}"</span>}
        </div>
        <div className="text-slate-400">
          Click any report to inspect full specifications or submit claim
        </div>
      </div>

      {/* Display Content: Grid vs Table */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">No matching items found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            We couldn't find any items matching your active search or filters. Try adjusting keywords or report the item yourself.
          </p>
          <div className="flex items-center justify-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Reset Filters
              </button>
            )}
            <button
              onClick={onOpenReportModal}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs transition-colors"
            >
              Submit New Report
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onSelect={onSelectItem}
              onClaim={onClaimItem}
            />
          ))}
        </div>
      ) : (
        /* High-Density Tabular View with Tabular Figures */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">UCC Location</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.type === 'lost' ? (
                        <span className="font-semibold text-rose-700">Lost</span>
                      ) : (
                        <span className="font-semibold text-emerald-700">Found</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">
                      {item.title}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {item.category}
                    </td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-xs">
                      {item.campusLocation}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                      {item.dateEvent}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="capitalize text-slate-700 font-medium">
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectItem(item);
                        }}
                        className="text-blue-900 font-semibold hover:underline mr-3"
                      >
                        Inspect
                      </button>
                      {item.type === 'found' && item.status !== 'recovered' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onClaimItem(item);
                          }}
                          className="text-emerald-700 font-semibold hover:underline"
                        >
                          Claim
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
