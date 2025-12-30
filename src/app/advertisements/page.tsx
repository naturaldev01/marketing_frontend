'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  ExternalLink,
  Copy,
  BarChart2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  MousePointerClick,
  Users,
  Megaphone,
} from 'lucide-react';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { advertisementsApi } from '@/lib/api';
import type { Advertisement } from '@/types';

export default function AdvertisementsPage() {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    loadAdvertisements();
  }, []);

  const loadAdvertisements = async () => {
    try {
      setLoading(true);
      const data = await advertisementsApi.getAll();
      setAdvertisements(data);
    } catch (error) {
      console.error('Failed to load advertisements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (ad: Advertisement) => {
    try {
      await advertisementsApi.update(ad.id, { is_active: !ad.is_active });
      setAdvertisements(prev =>
        prev.map(a => (a.id === ad.id ? { ...a, is_active: !a.is_active } : a))
      );
    } catch (error) {
      console.error('Failed to toggle advertisement:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu reklamı silmek istediğinizden emin misiniz?')) return;
    
    try {
      await advertisementsApi.delete(id);
      setAdvertisements(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Failed to delete advertisement:', error);
    }
  };

  const copyTrackingLink = (trackingCode: string, adId: string) => {
    const link = `${API_URL}/api/g/${trackingCode}`;
    navigator.clipboard.writeText(link);
    setCopiedId(adId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAds = advertisements.filter(
    ad =>
      ad.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.platform?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalClicks = advertisements.reduce((sum, ad) => sum + (ad.stats?.clicks || 0), 0);
  const totalUniqueClicks = advertisements.reduce((sum, ad) => sum + (ad.stats?.unique_clicks || 0), 0);
  const activeAds = advertisements.filter(ad => ad.is_active).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Advertisements</h1>
          <p className="text-slate-400 mt-1">Track your advertisement link clicks</p>
        </div>
        <Link href="/advertisements/new">
          <Button className="bg-gradient-to-r from-[#5B8C51] to-[#47703f] hover:from-[#4a7a42] hover:to-[#3d6035]">
            <Plus className="w-4 h-4 mr-2" />
            New Advertisement
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Megaphone className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Ads</p>
                <p className="text-2xl font-bold text-white">{advertisements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <ToggleRight className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Active Ads</p>
                <p className="text-2xl font-bold text-white">{activeAds}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <MousePointerClick className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Clicks</p>
                <p className="text-2xl font-bold text-white">{totalClicks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Users className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Unique Clicks</p>
                <p className="text-2xl font-bold text-white">{totalUniqueClicks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search advertisements..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-800/50 border-slate-700/50"
        />
      </div>

      {/* Advertisements List */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-slate-800/50 border-slate-700/50 animate-pulse">
              <CardContent className="p-6 h-32" />
            </Card>
          ))}
        </div>
      ) : filteredAds.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-12 text-center">
            <Megaphone className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No advertisements yet</h3>
            <p className="text-slate-400 mb-6">Create your first advertisement to start tracking clicks</p>
            <Link href="/advertisements/new">
              <Button className="bg-gradient-to-r from-[#5B8C51] to-[#47703f]">
                <Plus className="w-4 h-4 mr-2" />
                Create Advertisement
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAds.map(ad => (
            <Card key={ad.id} className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Link href={`/advertisements/${ad.id}`} className="hover:underline">
                        <h3 className="text-lg font-semibold text-white truncate">{ad.name}</h3>
                      </Link>
                      <Badge variant={ad.is_active ? 'success' : 'default'}>
                        {ad.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {ad.platform && (
                        <Badge variant="default" className="text-slate-400 border-slate-600">
                          {ad.platform}
                        </Badge>
                      )}
                    </div>
                    
                    {ad.description && (
                      <p className="text-slate-400 text-sm mb-3 line-clamp-1">{ad.description}</p>
                    )}

                    {/* Tracking Link */}
                    <div className="flex items-center gap-2 mb-3">
                      <code className="text-xs bg-slate-900/50 px-3 py-1.5 rounded-lg text-[#7ba373] font-mono truncate max-w-md">
                        {API_URL}/api/g/{ad.tracking_code}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyTrackingLink(ad.tracking_code, ad.id)}
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedId === ad.id ? (
                          <span className="text-green-400 text-xs">Copied!</span>
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <MousePointerClick className="w-4 h-4" />
                        <span><strong className="text-white">{ad.stats?.clicks || 0}</strong> clicks</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Users className="w-4 h-4" />
                        <span><strong className="text-white">{ad.stats?.unique_clicks || 0}</strong> unique</span>
                      </div>
                      <a
                        href={ad.destination_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-slate-400 hover:text-[#7ba373] transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="truncate max-w-[200px]">{new URL(ad.destination_url).hostname}</span>
                      </a>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link href={`/advertisements/${ad.id}`}>
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                        <BarChart2 className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleActive(ad)}
                      className="text-slate-400 hover:text-white"
                    >
                      {ad.is_active ? (
                        <ToggleRight className="w-5 h-5 text-green-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(ad.id)}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

