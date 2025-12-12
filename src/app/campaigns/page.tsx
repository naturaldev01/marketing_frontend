'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Header from '@/components/layout/Header';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { campaignsApi } from '@/lib/api';
import type { Campaign } from '@/types';
import {
  Plus,
  Search,
  Send,
  Trash2,
  Copy,
  Play,
  Pause,
  XCircle,
  Calendar,
  Users,
  FileText,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  draft: { label: 'Taslak', variant: 'default' },
  scheduled: { label: 'Zamanlandı', variant: 'info' },
  sending: { label: 'Gönderiliyor', variant: 'warning' },
  sent: { label: 'Gönderildi', variant: 'success' },
  paused: { label: 'Duraklatıldı', variant: 'warning' },
  cancelled: { label: 'İptal Edildi', variant: 'danger' },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadCampaigns();
  }, [statusFilter]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await campaignsApi.getAll({
        status: statusFilter || undefined,
      });
      console.log('Loaded campaigns:', data);
      setCampaigns(data || []);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      toast.error('Kampanyalar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      await campaignsApi.delete(id);
      toast.success('Campaign deleted');
      loadCampaigns();
    } catch (error) {
      toast.error('Failed to delete campaign');
    }
  };

  const handleStart = async (id: string) => {
    try {
      await campaignsApi.start(id);
      toast.success('Campaign started');
      loadCampaigns();
    } catch (error) {
      toast.error((error as Error).message || 'Failed to start campaign');
    }
  };

  const handlePause = async (id: string) => {
    try {
      await campaignsApi.pause(id);
      toast.success('Campaign paused');
      loadCampaigns();
    } catch (error) {
      toast.error('Failed to pause campaign');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this campaign?')) return;

    try {
      await campaignsApi.cancel(id);
      toast.success('Campaign cancelled');
      loadCampaigns();
    } catch (error) {
      toast.error('Failed to cancel campaign');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await campaignsApi.duplicate(id);
      toast.success('Campaign duplicated');
      loadCampaigns();
    } catch (error) {
      toast.error('Failed to duplicate campaign');
    }
  };

  const filteredCampaigns = campaigns.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <Header
        title="Kampanyalar"
        subtitle="E-posta kampanyalarınızı oluşturun ve yönetin"
        action={
          <Link href="/campaigns/new">
            <Button icon={<Plus className="w-4 h-4" />}>
              Yeni Kampanya
            </Button>
          </Link>
        }
      />

      <div className="p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Input
            placeholder="Kampanya ara..."
            icon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'Tüm Durumlar' },
              { value: 'draft', label: 'Taslak' },
              { value: 'scheduled', label: 'Zamanlandı' },
              { value: 'sending', label: 'Gönderiliyor' },
              { value: 'sent', label: 'Gönderildi' },
              { value: 'paused', label: 'Duraklatıldı' },
              { value: 'cancelled', label: 'İptal Edildi' },
            ]}
            className="w-48"
          />
        </div>

        {/* Campaigns List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-32" />
              </Card>
            ))}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Send className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Kampanya bulunamadı</h3>
              <p className="text-slate-400 mb-4">
                {searchQuery || statusFilter
                  ? 'Filtreleri değiştirmeyi deneyin'
                  : 'İlk kampanyanızı oluşturun'}
              </p>
              {!searchQuery && !statusFilter && (
                <Link href="/campaigns/new">
                  <Button icon={<Plus className="w-4 h-4" />}>
                    Kampanya Oluştur
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => (
              <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                <Card hover className="cursor-pointer transition-all hover:border-[#5B8C51]/30">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5B8C51]/20 to-[#47703f]/20 flex items-center justify-center">
                          <Send className="w-6 h-6 text-[#7ba373]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-white">{campaign.name}</h3>
                            <Badge variant={statusConfig[campaign.status]?.variant || 'default'}>
                              {statusConfig[campaign.status]?.label || campaign.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400 line-clamp-1">
                            {campaign.description || 'Açıklama yok'}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            {campaign.template && (
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {campaign.template.name}
                              </span>
                            )}
                            {campaign.csv_file && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {campaign.csv_file.row_count.toLocaleString()} kişi
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(campaign.created_at), 'dd MMM yyyy')}
                            </span>
                            {campaign.scheduled_at && (
                              <span className="flex items-center gap-1 text-sky-400">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(campaign.scheduled_at), 'dd MMM yyyy HH:mm')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="hidden md:flex items-center gap-8 mr-4">
                        <div className="text-center">
                          <p className="text-lg font-semibold text-white">{campaign.stats?.total || 0}</p>
                          <p className="text-xs text-slate-500">Toplam</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-[#7ba373]">{campaign.stats?.sent || 0}</p>
                          <p className="text-xs text-slate-500">Gönderilen</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-sky-400">{campaign.stats?.opened || 0}</p>
                          <p className="text-xs text-slate-500">Açılan</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-violet-400">{campaign.stats?.clicked || 0}</p>
                          <p className="text-xs text-slate-500">Tıklanan</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                        {campaign.status === 'draft' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => { e.preventDefault(); handleStart(campaign.id); }}
                            icon={<Play className="w-4 h-4" />}
                          >
                            Başlat
                          </Button>
                        )}
                        {campaign.status === 'scheduled' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => { e.preventDefault(); handleStart(campaign.id); }}
                            icon={<Play className="w-4 h-4" />}
                          >
                            Şimdi Başlat
                          </Button>
                        )}
                        {campaign.status === 'sending' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => { e.preventDefault(); handlePause(campaign.id); }}
                            icon={<Pause className="w-4 h-4" />}
                          >
                            Duraklat
                          </Button>
                        )}
                        {campaign.status === 'paused' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => { e.preventDefault(); handleStart(campaign.id); }}
                            icon={<Play className="w-4 h-4" />}
                          >
                            Devam Et
                          </Button>
                        )}
                        {['draft', 'scheduled', 'sending', 'paused'].includes(campaign.status) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.preventDefault(); handleCancel(campaign.id); }}
                            className="text-rose-400"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.preventDefault(); handleDuplicate(campaign.id); }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.preventDefault(); handleDelete(campaign.id); }}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

    </DashboardLayout>
  );
}

