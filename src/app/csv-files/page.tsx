'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Header from '@/components/layout/Header';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { csvFilesApi } from '@/lib/api';
import type { CsvFile, FilterOptions } from '@/types';
import {
  Search,
  Upload,
  FileSpreadsheet,
  Trash2,
  Filter,
  Users,
  Globe,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info'; icon: typeof Loader2 }> = {
  processing: { label: 'İşleniyor', variant: 'warning', icon: Loader2 },
  ready: { label: 'Hazır', variant: 'success', icon: CheckCircle },
  error: { label: 'Hata', variant: 'danger', icon: AlertCircle },
};

export default function CsvFilesPage() {
  const router = useRouter();
  const [files, setFiles] = useState<CsvFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<CsvFile | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const data = await csvFilesApi.getAll();
      setFiles(data);
    } catch {
      toast.error('CSV dosyaları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return;

    try {
      await csvFilesApi.delete(id);
      toast.success('Dosya silindi');
      loadFiles();
    } catch {
      toast.error('Dosya silinemedi');
    }
  };

  const filteredFiles = files.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.original_filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <Header
        title="CSV Dosyaları"
        subtitle="Kişi listelerinizi yükleyin ve yönetin"
        action={
          <Button onClick={() => setShowUploadModal(true)} icon={<Upload className="w-4 h-4" />}>
            CSV Yükle
          </Button>
        }
      />

      <div className="p-6">
        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Dosya ara..."
            icon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Files Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-48" />
              </Card>
            ))}
          </div>
        ) : filteredFiles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">CSV dosyası bulunamadı</h3>
              <p className="text-slate-400 mb-4">
                {searchQuery
                  ? 'Aramanızı değiştirmeyi deneyin'
                  : 'İlk CSV dosyanızı yükleyerek başlayın'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowUploadModal(true)} icon={<Upload className="w-4 h-4" />}>
                  CSV Yükle
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((file) => {
              const StatusIcon = statusConfig[file.status].icon;
              return (
                <Card key={file.id} hover>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                          <FileSpreadsheet className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{file.name}</h3>
                          <p className="text-xs text-slate-500">{file.original_filename}</p>
                        </div>
                      </div>
                      <Badge variant={statusConfig[file.status].variant} size="sm">
                        <StatusIcon className={`w-3 h-3 mr-1 ${file.status === 'processing' ? 'animate-spin' : ''}`} />
                        {statusConfig[file.status].label}
                      </Badge>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-300">{file.row_count.toLocaleString()} kişi</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-300">
                          {format(new Date(file.created_at), 'dd MMM')}
                        </span>
                      </div>
                    </div>

                    {/* Filtered badge */}
                    {file.is_filtered && (
                      <div className="mb-4">
                        <Badge variant="info" size="sm">
                          <Filter className="w-3 h-3 mr-1" />
                          Filtrelenmiş
                        </Badge>
                        {file.filter_criteria && (
                          <div className="mt-2 text-xs text-slate-500 space-y-1">
                            {(file.filter_criteria.countries?.length ?? 0) > 0 && (
                              <div className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                <span>Ülkeler: {file.filter_criteria.countries?.join(', ')}</span>
                              </div>
                            )}
                            {(file.filter_criteria.timezones?.length ?? 0) > 0 && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Zaman Dilimleri: {file.filter_criteria.timezones?.length} seçili</span>
                              </div>
                            )}
                            {(file.filter_criteria.emailDomains?.length ?? 0) > 0 && (
                              <div className="flex items-center gap-1">
                                <span>E-posta: @{file.filter_criteria.emailDomains?.slice(0, 2).join(', @')}{(file.filter_criteria.emailDomains?.length ?? 0) > 2 ? '...' : ''}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Error message */}
                    {file.status === 'error' && file.error_message && (
                      <p className="text-xs text-rose-400 mb-4">{file.error_message}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {file.status === 'ready' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/csv-files/${file.id}`)}
                          icon={<Eye className="w-4 h-4" />}
                        >
                          Görüntüle
                        </Button>
                      )}
                      {file.status === 'ready' && !file.is_filtered && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(file);
                            setShowFilterModal(true);
                          }}
                          icon={<Filter className="w-4 h-4" />}
                        >
                          Filtrele
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(file.id)}
                        className="text-rose-400 hover:text-rose-300 ml-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          setShowUploadModal(false);
          loadFiles();
        }}
      />

      {/* Filter Modal */}
      {selectedFile && (
        <FilterModal
          isOpen={showFilterModal}
          onClose={() => {
            setShowFilterModal(false);
            setSelectedFile(null);
          }}
          file={selectedFile}
          onSuccess={() => {
            setShowFilterModal(false);
            setSelectedFile(null);
            loadFiles();
          }}
        />
      )}
    </DashboardLayout>
  );
}

function UploadModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        if (!name) setName(droppedFile.name.replace('.csv', ''));
      } else {
        toast.error('Lütfen bir CSV dosyası yükleyin');
      }
    }
  }, [name]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!name) setName(selectedFile.name.replace('.csv', ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    try {
      await csvFilesApi.upload(file, name || file.name);
      toast.success('Dosya yüklendi! İşleniyor...');
      onSuccess();
      setFile(null);
      setName('');
    } catch {
      toast.error('Dosya yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="CSV Dosyası Yükle" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Drop zone */}
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center transition-colors
            ${dragActive ? 'border-[#5B8C51] bg-[#5B8C51]/10' : 'border-slate-600 hover:border-slate-500'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-[#7ba373]" />
              <div className="text-left">
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-sm text-slate-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-700/50"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-300 mb-1">
                CSV dosyanızı buraya sürükleyin veya tıklayarak seçin
              </p>
              <p className="text-sm text-slate-500">Maksimum dosya boyutu: 50MB</p>
            </>
          )}
        </div>

        <Input
          label="Liste Adı"
          placeholder="ör: Bülten Aboneleri"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" loading={loading} disabled={!file}>
            Yükle
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function FilterModal({
  isOpen,
  onClose,
  file,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  file: CsvFile;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedTimezones, setSelectedTimezones] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [filterName, setFilterName] = useState('');

  const loadFilterOptions = useCallback(async () => {
    try {
      const options = await csvFilesApi.getFilterOptions(file.id);
      setFilterOptions(options);
    } catch {
      toast.error('Filtre seçenekleri yüklenemedi');
    }
  }, [file.id]);

  useEffect(() => {
    if (isOpen) {
      loadFilterOptions();
    }
  }, [isOpen, loadFilterOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await csvFilesApi.filter(file.id, {
        name: filterName || `${file.name} (Filtrelenmiş)`,
        countries: selectedCountries.length > 0 ? selectedCountries : undefined,
        timezones: selectedTimezones.length > 0 ? selectedTimezones : undefined,
        emailDomains: selectedDomains.length > 0 ? selectedDomains : undefined,
      });
      toast.success('Filtrelenmiş liste oluşturuldu!');
      onSuccess();
    } catch (error) {
      toast.error((error as Error).message || 'Kişiler filtrelenemedi');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (item: string, list: string[], setList: (items: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Filtrele: ${file.name}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <p className="text-sm text-slate-300">
            <strong className="text-white">Filtreleme Sistemi:</strong> Seçtiğiniz kriterlere göre mevcut CSV dosyası kopyalanacak ve 
            filtrelenmiş yeni bir liste oluşturulacaktır. Orijinal dosyanız değişmeyecektir.
          </p>
        </div>

        <Input
          label="Yeni Liste Adı"
          placeholder="ör: Türkiye Müşterileri"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
        />

        {filterOptions ? (
          <>
            {/* Countries */}
            {filterOptions.countries.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Ülkeler ({selectedCountries.length} seçili)
                </label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                  {filterOptions.countries.map((country) => (
                    <button
                      key={country}
                      type="button"
                      onClick={() => toggleItem(country, selectedCountries, setSelectedCountries)}
                      className={`
                        px-3 py-1.5 rounded-full text-sm transition-colors
                        ${selectedCountries.includes(country)
                          ? 'bg-[#5B8C51]/20 text-[#7ba373] border border-[#5B8C51]/30'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                        }
                      `}
                    >
                      {country}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Timezones */}
            {filterOptions.timezones.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Zaman Dilimleri ({selectedTimezones.length} seçili)
                </label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                  {filterOptions.timezones.map((tz) => (
                    <button
                      key={tz}
                      type="button"
                      onClick={() => toggleItem(tz, selectedTimezones, setSelectedTimezones)}
                      className={`
                        px-3 py-1.5 rounded-full text-sm transition-colors
                        ${selectedTimezones.includes(tz)
                          ? 'bg-[#5B8C51]/20 text-[#7ba373] border border-[#5B8C51]/30'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                        }
                      `}
                    >
                      {tz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Email Domains */}
            {filterOptions.emailDomains.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  E-posta Domain&apos;leri ({selectedDomains.length} seçili)
                </label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                  {filterOptions.emailDomains.slice(0, 50).map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => toggleItem(domain, selectedDomains, setSelectedDomains)}
                      className={`
                        px-3 py-1.5 rounded-full text-sm transition-colors
                        ${selectedDomains.includes(domain)
                          ? 'bg-[#5B8C51]/20 text-[#7ba373] border border-[#5B8C51]/30'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                        }
                      `}
                    >
                      @{domain}
                    </button>
                  ))}
                  {filterOptions.emailDomains.length > 50 && (
                    <span className="text-xs text-slate-500 self-center">
                      +{filterOptions.emailDomains.length - 50} daha fazla
                    </span>
                  )}
                </div>
              </div>
            )}

            {filterOptions.countries.length === 0 && 
             filterOptions.timezones.length === 0 && 
             filterOptions.emailDomains.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Filter className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p>Bu dosyada filtrelenebilir veri bulunamadı.</p>
                <p className="text-sm mt-2">CSV dosyanızda country, timezone veya email sütunları olmalı.</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-[#5B8C51] animate-spin mb-2" />
            <span className="text-sm text-slate-400">Filtre seçenekleri yükleniyor...</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={
              selectedCountries.length === 0 &&
              selectedTimezones.length === 0 &&
              selectedDomains.length === 0
            }
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtrelenmiş Liste Oluştur
          </Button>
        </div>
      </form>
    </Modal>
  );
}

