'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Header from '@/components/layout/Header';
import Card, { CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { campaignsApi } from '@/lib/api';
import type { Campaign } from '@/types';
import {
  ArrowLeft,
  Play,
  Pause,
  XCircle,
  Send,
  Users,
  FileText,
  Mail,
  Clock,
  Calendar,
  Globe,
  CheckCircle,
  AlertCircle,
  Eye,
  MousePointer,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info'; icon: React.ReactNode }> = {
  draft: { label: 'Taslak', variant: 'default', icon: <FileText className="w-4 h-4" /> },
  scheduled: { label: 'Zamanlandı', variant: 'info', icon: <Clock className="w-4 h-4" /> },
  sending: { label: 'Gönderiliyor', variant: 'warning', icon: <Loader2 className="w-4 h-4 animate-spin" /> },
  sent: { label: 'Gönderildi', variant: 'success', icon: <CheckCircle className="w-4 h-4" /> },
  paused: { label: 'Duraklatıldı', variant: 'warning', icon: <Pause className="w-4 h-4" /> },
  cancelled: { label: 'İptal Edildi', variant: 'danger', icon: <XCircle className="w-4 h-4" /> },
};

interface CampaignEmail {
  id: string;
  email_address: string;
  recipient_name: string | null;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [emails, setEmails] = useState<CampaignEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadCampaign = useCallback(async () => {
    try {
      const data = await campaignsApi.getOne(campaignId);
      setCampaign(data);
    } catch {
      toast.error('Kampanya yüklenemedi');
      router.push('/campaigns');
    } finally {
      setLoading(false);
    }
  }, [campaignId, router]);

  const loadEmails = useCallback(async () => {
    setEmailsLoading(true);
    try {
      const data = await campaignsApi.getEmails(campaignId, { limit: '50' });
      setEmails(data.data || []);
    } catch (error) {
      console.error('Failed to load emails:', error);
    } finally {
      setEmailsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    loadCampaign();
    loadEmails();
  }, [loadCampaign, loadEmails]);

  // Auto-refresh when campaign is sending
  useEffect(() => {
    if (campaign?.status === 'sending') {
      const interval = setInterval(() => {
        loadCampaign();
        loadEmails();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [campaign?.status, loadCampaign, loadEmails]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadCampaign(), loadEmails()]);
    setRefreshing(false);
  };

  const handleStart = async () => {
    if (!campaign) return;
    
    // Validation
    if (!campaign.template_id) {
      toast.error('Kampanya başlatmak için bir şablon seçmelisiniz');
      return;
    }
    if (!campaign.csv_file_id) {
      toast.error('Kampanya başlatmak için bir kişi listesi seçmelisiniz');
      return;
    }

    setActionLoading(true);
    try {
      await campaignsApi.start(campaignId);
      toast.success('Kampanya başlatıldı! E-postalar gönderilmeye başlandı.');
      await loadCampaign();
      await loadEmails();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Kampanya başlatılamadı');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async () => {
    setActionLoading(true);
    try {
      await campaignsApi.pause(campaignId);
      toast.success('Kampanya duraklatıldı');
      await loadCampaign();
    } catch {
      toast.error('Kampanya duraklatılamadı');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Kampanyayı iptal etmek istediğinize emin misiniz?')) return;
    
    setActionLoading(true);
    try {
      await campaignsApi.cancel(campaignId);
      toast.success('Kampanya iptal edildi');
      await loadCampaign();
    } catch {
      toast.error('Kampanya iptal edilemedi');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-4 border-[#5B8C51] border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!campaign) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <AlertCircle className="w-16 h-16 text-slate-600 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Kampanya bulunamadı</h2>
          <Link href="/campaigns">
            <Button variant="primary">Kampanyalara Dön</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const status = statusConfig[campaign.status] || statusConfig.draft;
  const stats = campaign.stats || { total: 0, sent: 0, opened: 0, clicked: 0, bounced: 0, failed: 0 };
  const sendOptions = campaign.send_options as { timezone?: string; sendImmediately?: boolean } | undefined;

  return (
    <DashboardLayout>
      <Header
        title={campaign.name}
        subtitle={campaign.description || 'Kampanya detayları'}
        action={
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Yenile
            </Button>
            {campaign.status === 'draft' && (
              <Button onClick={handleStart} loading={actionLoading}>
                <Play className="w-4 h-4 mr-2" />
                Kampanyayı Başlat
              </Button>
            )}
            {campaign.status === 'scheduled' && (
              <Button onClick={handleStart} loading={actionLoading}>
                <Play className="w-4 h-4 mr-2" />
                Şimdi Başlat
              </Button>
            )}
            {campaign.status === 'sending' && (
              <Button variant="secondary" onClick={handlePause} loading={actionLoading}>
                <Pause className="w-4 h-4 mr-2" />
                Duraklat
              </Button>
            )}
            {campaign.status === 'paused' && (
              <Button onClick={handleStart} loading={actionLoading}>
                <Play className="w-4 h-4 mr-2" />
                Devam Et
              </Button>
            )}
            {['draft', 'scheduled', 'sending', 'paused'].includes(campaign.status) && (
              <Button variant="ghost" onClick={handleCancel} className="text-rose-400">
                <XCircle className="w-4 h-4 mr-2" />
                İptal Et
              </Button>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Status Banner */}
        <Card className={`border-l-4 ${
          campaign.status === 'sending' ? 'border-l-amber-500 bg-amber-500/5' :
          campaign.status === 'sent' ? 'border-l-green-500 bg-green-500/5' :
          campaign.status === 'scheduled' ? 'border-l-sky-500 bg-sky-500/5' :
          campaign.status === 'paused' ? 'border-l-orange-500 bg-orange-500/5' :
          campaign.status === 'cancelled' ? 'border-l-rose-500 bg-rose-500/5' :
          'border-l-slate-500'
        }`}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {status.icon}
                <div>
                  <Badge variant={status.variant} className="mb-1">{status.label}</Badge>
                  {campaign.status === 'sending' && (
                    <p className="text-sm text-slate-400">E-postalar gönderilmeye devam ediyor...</p>
                  )}
                  {campaign.status === 'scheduled' && campaign.scheduled_at && (
                    <p className="text-sm text-slate-400">
                      Planlanan: {format(new Date(campaign.scheduled_at), 'dd MMMM yyyy HH:mm', { locale: tr })}
                      {sendOptions?.timezone && ` (${sendOptions.timezone})`}
                    </p>
                  )}
                  {campaign.status === 'sent' && campaign.completed_at && (
                    <p className="text-sm text-slate-400">
                      Tamamlandı: {format(new Date(campaign.completed_at), 'dd MMMM yyyy HH:mm', { locale: tr })}
                    </p>
                  )}
                </div>
              </div>
              {campaign.status === 'sending' && (
                <div className="flex items-center gap-2 text-amber-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">
                    {stats.sent} / {stats.total} gönderildi
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="py-4 text-center">
              <Users className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-slate-500">Toplam Alıcı</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <Send className="w-6 h-6 text-[#7ba373] mx-auto mb-2" />
              <p className="text-2xl font-bold text-[#7ba373]">{stats.sent}</p>
              <p className="text-xs text-slate-500">Gönderilen</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <Eye className="w-6 h-6 text-sky-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-sky-400">{stats.opened}</p>
              <p className="text-xs text-slate-500">Açılan</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <MousePointer className="w-6 h-6 text-violet-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-violet-400">{stats.clicked}</p>
              <p className="text-xs text-slate-500">Tıklanan</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <AlertCircle className="w-6 h-6 text-orange-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-400">{stats.bounced || 0}</p>
              <p className="text-xs text-slate-500">Geri Dönen</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <XCircle className="w-6 h-6 text-rose-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-rose-400">{stats.failed || 0}</p>
              <p className="text-xs text-slate-500">Başarısız</p>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Campaign Info */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-[#7ba373]" />
                Kampanya Bilgileri
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Şablon</p>
                  <p className="text-sm text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    {campaign.template?.name || 'Seçilmedi'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Kişi Listesi</p>
                  <p className="text-sm text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    {campaign.csv_file?.name || 'Seçilmedi'}
                    {campaign.csv_file && (
                      <span className="text-slate-500">({campaign.csv_file.row_count} kişi)</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Gönderen</p>
                  <p className="text-sm text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {campaign.from_name}
                  </p>
                  <p className="text-xs text-slate-400">{campaign.from_email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Yanıt Adresi</p>
                  <p className="text-sm text-white">{campaign.reply_to || campaign.from_email}</p>
                </div>
              </div>
              {campaign.scheduled_at && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Planlanan Tarih</p>
                    <p className="text-sm text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {format(new Date(campaign.scheduled_at), 'dd MMMM yyyy HH:mm', { locale: tr })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Zaman Dilimi</p>
                    <p className="text-sm text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-slate-400" />
                      {sendOptions?.timezone || 'Europe/Istanbul'}
                    </p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500 mb-1">Oluşturulma Tarihi</p>
                <p className="text-sm text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {format(new Date(campaign.created_at), 'dd MMMM yyyy HH:mm', { locale: tr })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Email Preview */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-sky-400" />
                E-posta Önizleme
              </h3>
            </CardHeader>
            <CardContent>
              {campaign.template ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Konu</p>
                    <p className="text-sm text-white font-medium">
                      {campaign.subject_override || campaign.template.subject}
                    </p>
                  </div>
                  {campaign.template.body_html && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">İçerik Önizleme</p>
                      <div className="bg-white rounded-lg p-4 max-h-48 overflow-auto">
                        <iframe
                          srcDoc={campaign.template.body_html}
                          className="w-full h-40 border-0"
                          title="Email Preview"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Şablon seçilmedi</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Email List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-400" />
                Gönderim Listesi
              </h3>
              <span className="text-sm text-slate-400">
                {emails.length} / {stats.total} gösteriliyor
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {emailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">
                  {campaign.status === 'draft' 
                    ? 'Kampanya başlatıldığında alıcı listesi burada görünecek'
                    : 'Henüz gönderim yapılmadı'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Alıcı</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Durum</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Gönderilme</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Açılma</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Tıklama</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emails.map((email) => (
                      <tr key={email.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                        <td className="py-3 px-4">
                          <p className="text-sm text-white">{email.recipient_name || '-'}</p>
                          <p className="text-xs text-slate-400">{email.email_address}</p>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={
                            email.status === 'sent' ? 'success' :
                            email.status === 'pending' ? 'default' :
                            email.status === 'failed' ? 'danger' : 'warning'
                          }>
                            {email.status === 'sent' ? 'Gönderildi' :
                             email.status === 'pending' ? 'Bekliyor' :
                             email.status === 'failed' ? 'Başarısız' : email.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-400">
                          {email.sent_at ? format(new Date(email.sent_at), 'HH:mm:ss') : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {email.opened_at ? (
                            <span className="text-sky-400 flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {format(new Date(email.opened_at), 'HH:mm:ss')}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {email.clicked_at ? (
                            <span className="text-violet-400 flex items-center gap-1">
                              <MousePointer className="w-3 h-3" />
                              {format(new Date(email.clicked_at), 'HH:mm:ss')}
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
