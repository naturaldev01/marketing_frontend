'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Header from '@/components/layout/Header';
import Card, { CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import { campaignsApi, templatesApi, csvFilesApi } from '@/lib/api';
import type { Template, CsvFile } from '@/types';
import {
  ArrowLeft,
  Save,
  Send,
  FileText,
  Users,
  Mail,
  Calendar,
  Globe,
  Clock,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Timezone groups
const timezoneGroups = {
  'Avrupa': [
    { value: 'Europe/Istanbul', label: 'İstanbul (GMT+3)' },
    { value: 'Europe/London', label: 'Londra (GMT+0/+1)' },
    { value: 'Europe/Paris', label: 'Paris (GMT+1/+2)' },
    { value: 'Europe/Berlin', label: 'Berlin (GMT+1/+2)' },
    { value: 'Europe/Moscow', label: 'Moskova (GMT+3)' },
    { value: 'Europe/Rome', label: 'Roma (GMT+1/+2)' },
    { value: 'Europe/Madrid', label: 'Madrid (GMT+1/+2)' },
    { value: 'Europe/Amsterdam', label: 'Amsterdam (GMT+1/+2)' },
    { value: 'Europe/Athens', label: 'Atina (GMT+2/+3)' },
    { value: 'Europe/Warsaw', label: 'Varşova (GMT+1/+2)' },
  ],
  'Amerika': [
    { value: 'America/New_York', label: 'New York (GMT-5/-4)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8/-7)' },
    { value: 'America/Chicago', label: 'Chicago (GMT-6/-5)' },
    { value: 'America/Toronto', label: 'Toronto (GMT-5/-4)' },
    { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
    { value: 'America/Mexico_City', label: 'Mexico City (GMT-6/-5)' },
    { value: 'America/Denver', label: 'Denver (GMT-7/-6)' },
    { value: 'America/Phoenix', label: 'Phoenix (GMT-7)' },
    { value: 'America/Vancouver', label: 'Vancouver (GMT-8/-7)' },
    { value: 'America/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
  ],
  'Asya & Pasifik': [
    { value: 'Asia/Dubai', label: 'Dubai (GMT+4)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' },
    { value: 'Asia/Shanghai', label: 'Şanghay (GMT+8)' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong (GMT+8)' },
    { value: 'Asia/Singapore', label: 'Singapur (GMT+8)' },
    { value: 'Asia/Seoul', label: 'Seul (GMT+9)' },
    { value: 'Asia/Kolkata', label: 'Mumbai (GMT+5:30)' },
    { value: 'Asia/Bangkok', label: 'Bangkok (GMT+7)' },
    { value: 'Australia/Sydney', label: 'Sydney (GMT+10/+11)' },
    { value: 'Pacific/Auckland', label: 'Auckland (GMT+12/+13)' },
  ],
  'Orta Doğu & Afrika': [
    { value: 'Asia/Jerusalem', label: 'Kudüs (GMT+2/+3)' },
    { value: 'Asia/Riyadh', label: 'Riyad (GMT+3)' },
    { value: 'Africa/Cairo', label: 'Kahire (GMT+2)' },
    { value: 'Africa/Johannesburg', label: 'Johannesburg (GMT+2)' },
    { value: 'Africa/Lagos', label: 'Lagos (GMT+1)' },
    { value: 'Africa/Nairobi', label: 'Nairobi (GMT+3)' },
  ],
};

// Flatten timezones for select options
const allTimezones = Object.entries(timezoneGroups).flatMap(([group, zones]) =>
  zones.map(z => ({ ...z, group }))
);

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [csvFiles, setCsvFiles] = useState<CsvFile[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedCsvFile, setSelectedCsvFile] = useState<CsvFile | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    templateId: '',
    csvFileId: '',
    fromName: 'Natural Clinic',
    fromEmail: '',
    replyTo: '',
    scheduledDate: '',
    scheduledTime: '',
    timezone: 'Europe/Istanbul',
    sendImmediately: true,
  });

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const [templatesData, csvFilesData] = await Promise.all([
        templatesApi.getAll({ isActive: 'true' }),
        csvFilesApi.getAll({ status: 'ready' }),
      ]);
      setTemplates(templatesData);
      setCsvFiles(csvFilesData);
    } catch (error) {
      console.error('Failed to load options:', error);
      toast.error('Veriler yüklenemedi');
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setFormData({ ...formData, templateId });
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
  };

  const handleCsvFileChange = (csvFileId: string) => {
    setFormData({ ...formData, csvFileId });
    const csvFile = csvFiles.find(f => f.id === csvFileId);
    setSelectedCsvFile(csvFile || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Kampanya adı gerekli');
      return;
    }
    if (!formData.fromName.trim()) {
      toast.error('Gönderen adı gerekli');
      return;
    }
    if (!formData.fromEmail.trim()) {
      toast.error('Gönderen e-posta adresi gerekli');
      return;
    }

    // Validate scheduled date if not sending immediately
    if (!formData.sendImmediately) {
      if (!formData.scheduledDate || !formData.scheduledTime) {
        toast.error('Planlanan gönderim tarihi ve saati gerekli');
        return;
      }
    }

    setLoading(true);

    try {
      // Create campaign
      const campaign = await campaignsApi.create({
        name: formData.name,
        description: formData.description || undefined,
        templateId: formData.templateId || undefined,
        csvFileId: formData.csvFileId || undefined,
        fromName: formData.fromName,
        fromEmail: formData.fromEmail,
        replyTo: formData.replyTo || undefined,
        sendOptions: {
          timezone: formData.timezone,
          sendImmediately: formData.sendImmediately,
        },
      });

      // If scheduled, set the schedule with timezone
      if (!formData.sendImmediately && formData.scheduledDate && formData.scheduledTime) {
        const scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
        await campaignsApi.schedule(campaign.id, scheduledAt.toISOString(), formData.timezone);
      }

      toast.success('Kampanya başarıyla oluşturuldu');
      router.push('/campaigns');
    } catch (error) {
      toast.error('Kampanya oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  // Get min date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <DashboardLayout>
      <Header
        title="Yeni Kampanya Oluştur"
        subtitle="E-posta kampanyanızı yapılandırın"
        action={
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              <Save className="w-4 h-4 mr-2" />
              Kampanya Oluştur
            </Button>
          </div>
        }
      />

      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Temel Bilgiler */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-[#7ba373]" />
                <h3 className="text-lg font-semibold text-white">Kampanya Bilgileri</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Kampanya Adı"
                placeholder="ör: Yaz Kampanyası 2024"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                icon={<Send className="w-4 h-4" />}
              />
              <Textarea
                label="Açıklama (opsiyonel)"
                placeholder="Bu kampanya hakkında kısa bir açıklama..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </CardContent>
          </Card>

          {/* Template ve Kişi Listesi */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                <h3 className="text-lg font-semibold text-white">İçerik & Alıcılar</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Select
                    label="E-posta Şablonu"
                    value={formData.templateId}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    options={[
                      { value: '', label: 'Şablon seçin...' },
                      ...templates.map((t) => ({ value: t.id, label: t.name })),
                    ]}
                  />
                  {selectedTemplate && (
                    <div className="mt-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                      <p className="text-sm text-slate-300">
                        <span className="text-slate-500">Konu:</span> {selectedTemplate.subject}
                      </p>
                      {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {selectedTemplate.variables.map(v => (
                            <span key={v} className="px-2 py-0.5 text-xs rounded bg-slate-700 text-slate-300">
                              {`{{${v}}}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Select
                    label="Kişi Listesi (CSV)"
                    value={formData.csvFileId}
                    onChange={(e) => handleCsvFileChange(e.target.value)}
                    options={[
                      { value: '', label: 'CSV dosyası seçin...' },
                      ...csvFiles.map((f) => ({
                        value: f.id,
                        label: `${f.name} (${f.row_count.toLocaleString()} kişi)`,
                      })),
                    ]}
                  />
                  {selectedCsvFile && (
                    <div className="mt-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Users className="w-4 h-4 text-[#7ba373]" />
                        <span>{selectedCsvFile.row_count.toLocaleString()} kişi</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gönderen Bilgileri */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-violet-400" />
                <h3 className="text-lg font-semibold text-white">Gönderen Bilgileri</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Gönderen Adı"
                  placeholder="ör: Natural Clinic"
                  value={formData.fromName}
                  onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                />
                <Input
                  label="Gönderen E-posta"
                  type="email"
                  placeholder="ör: info@natural.clinic"
                  value={formData.fromEmail}
                  onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                  icon={<Mail className="w-4 h-4" />}
                />
              </div>
              <Input
                label="Yanıt E-posta Adresi (opsiyonel)"
                type="email"
                placeholder="ör: destek@natural.clinic"
                value={formData.replyTo}
                onChange={(e) => setFormData({ ...formData, replyTo: e.target.value })}
              />
            </CardContent>
          </Card>

          {/* Zamanlama */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-semibold text-white">Gönderim Zamanlaması</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Gönderim Tipi Seçimi */}
              <div className="flex gap-4">
                <label className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:border-[#5B8C51]/50 transition-colors flex-1">
                  <input
                    type="radio"
                    name="sendType"
                    checked={formData.sendImmediately}
                    onChange={() => setFormData({ ...formData, sendImmediately: true })}
                    className="w-4 h-4 text-[#5B8C51] focus:ring-[#5B8C51]"
                  />
                  <div>
                    <p className="font-medium text-white">Taslak Olarak Kaydet</p>
                    <p className="text-sm text-slate-400">Daha sonra manuel olarak başlatın</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:border-[#5B8C51]/50 transition-colors flex-1">
                  <input
                    type="radio"
                    name="sendType"
                    checked={!formData.sendImmediately}
                    onChange={() => setFormData({ ...formData, sendImmediately: false })}
                    className="w-4 h-4 text-[#5B8C51] focus:ring-[#5B8C51]"
                  />
                  <div>
                    <p className="font-medium text-white">Zamanla</p>
                    <p className="text-sm text-slate-400">Belirli bir tarih ve saatte gönder</p>
                  </div>
                </label>
              </div>

              {/* Zamanlama Alanları */}
              {!formData.sendImmediately && (
                <div className="space-y-4 pt-4 border-t border-slate-700/50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Gönderim Tarihi
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="date"
                          min={today}
                          value={formData.scheduledDate}
                          onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-600/50 text-white focus:outline-none focus:ring-2 focus:ring-[#5B8C51]/50 focus:border-[#5B8C51]/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Gönderim Saati
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="time"
                          value={formData.scheduledTime}
                          onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-600/50 text-white focus:outline-none focus:ring-2 focus:ring-[#5B8C51]/50 focus:border-[#5B8C51]/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Zaman Dilimi
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                        <select
                          value={formData.timezone}
                          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-600/50 text-white focus:outline-none focus:ring-2 focus:ring-[#5B8C51]/50 focus:border-[#5B8C51]/50 appearance-none cursor-pointer"
                        >
                          {Object.entries(timezoneGroups).map(([group, zones]) => (
                            <optgroup key={group} label={group}>
                              {zones.map(zone => (
                                <option key={zone.value} value={zone.value}>
                                  {zone.label}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Bilgi Notu */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-200">
                        E-postalar seçilen zaman diliminde belirttiğiniz tarih ve saatte gönderilecektir.
                      </p>
                      {formData.scheduledDate && formData.scheduledTime && (
                        <p className="text-sm text-amber-300 mt-1">
                          Planlanan: {new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toLocaleDateString('tr-TR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })} ({allTimezones.find(t => t.value === formData.timezone)?.label})
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alt Butonlar */}
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => router.back()}>
              İptal
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              <Save className="w-4 h-4 mr-2" />
              Kampanya Oluştur
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
