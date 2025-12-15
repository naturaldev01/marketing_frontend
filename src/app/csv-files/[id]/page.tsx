'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Header from '@/components/layout/Header';
import Card, { CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { csvFilesApi } from '@/lib/api';
import type { CsvFile, CsvContact, Pagination } from '@/types';
import {
  ArrowLeft,
  FileSpreadsheet,
  Users,
  Mail,
  User,
  Globe,
  Clock,
  Building,
  Phone,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function CsvDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [file, setFile] = useState<CsvFile | null>(null);
  const [contacts, setContacts] = useState<CsvContact[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValid, setFilterValid] = useState<'all' | 'valid' | 'invalid'>('all');

  useEffect(() => {
    loadFile();
  }, [id]);

  useEffect(() => {
    loadContacts();
  }, [id, currentPage, filterValid]);

  const loadFile = async () => {
    try {
      const data = await csvFilesApi.getOne(id);
      setFile(data);
    } catch {
      toast.error('CSV dosyası yüklenemedi');
      router.push('/csv-files');
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    setContactsLoading(true);
    try {
      const params: { page?: string; limit?: string; isValid?: string } = {
        page: currentPage.toString(),
        limit: '50',
      };
      
      if (filterValid === 'valid') {
        params.isValid = 'true';
      } else if (filterValid === 'invalid') {
        params.isValid = 'false';
      }

      const data = await csvFilesApi.getContacts(id, params);
      setContacts(data.data || []);
      setPagination(data.pagination);
    } catch {
      toast.error('Kişiler yüklenemedi');
    } finally {
      setContactsLoading(false);
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.email.toLowerCase().includes(query) ||
      (contact.first_name?.toLowerCase() || '').includes(query) ||
      (contact.last_name?.toLowerCase() || '').includes(query) ||
      (contact.company?.toLowerCase() || '').includes(query)
    );
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-800 rounded w-1/3" />
            <div className="h-40 bg-slate-800 rounded" />
            <div className="h-96 bg-slate-800 rounded" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!file) {
    return null;
  }

  return (
    <DashboardLayout>
      <Header
        title={file.name}
        subtitle={`${file.row_count.toLocaleString()} kişi • ${file.original_filename}`}
        action={
          <Button variant="ghost" onClick={() => router.push('/csv-files')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* File Info Card */}
        <Card>
          <CardContent className="py-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Dosya</p>
                  <p className="text-white font-medium truncate max-w-[150px]" title={file.original_filename}>
                    {file.original_filename}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#5B8C51]/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#7ba373]" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Toplam Kişi</p>
                  <p className="text-white font-medium">{file.row_count.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Yükleme Tarihi</p>
                  <p className="text-white font-medium">
                    {format(new Date(file.created_at), 'dd MMM yyyy')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  file.status === 'ready' ? 'bg-green-500/10' : 
                  file.status === 'error' ? 'bg-rose-500/10' : 'bg-amber-500/10'
                }`}>
                  {file.status === 'ready' ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : file.status === 'error' ? (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-400">Durum</p>
                  <Badge
                    variant={file.status === 'ready' ? 'success' : file.status === 'error' ? 'danger' : 'warning'}
                    size="sm"
                  >
                    {file.status === 'ready' ? 'Hazır' : file.status === 'error' ? 'Hata' : 'İşleniyor'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Filter criteria if filtered */}
            {file.is_filtered && file.filter_criteria && (
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="w-4 h-4 text-sky-400" />
                  <span className="text-sm font-medium text-white">Filtre Kriterleri</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {file.filter_criteria.countries?.map((country) => (
                    <Badge key={country} variant="info" size="sm">
                      <Globe className="w-3 h-3 mr-1" />
                      {country}
                    </Badge>
                  ))}
                  {file.filter_criteria.timezones?.map((tz) => (
                    <Badge key={tz} variant="info" size="sm">
                      <Clock className="w-3 h-3 mr-1" />
                      {tz}
                    </Badge>
                  ))}
                  {file.filter_criteria.emailDomains?.map((domain) => (
                    <Badge key={domain} variant="info" size="sm">
                      @{domain}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contacts Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Kişi Listesi</h3>
                <p className="text-sm text-slate-400">
                  {pagination ? `${pagination.total.toLocaleString()} kişiden ${filteredContacts.length} gösteriliyor` : 'Yükleniyor...'}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B8C51]/50 w-48"
                  />
                </div>

                {/* Filter */}
                <select
                  value={filterValid}
                  onChange={(e) => {
                    setFilterValid(e.target.value as 'all' | 'valid' | 'invalid');
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#5B8C51]/50"
                >
                  <option value="all">Tümü</option>
                  <option value="valid">Geçerli</option>
                  <option value="invalid">Geçersiz</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">E-posta</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Ad Soyad</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Şirket</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Ülke</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Telefon</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {contactsLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <div className="flex items-center justify-center gap-2 text-slate-400">
                          <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                          Yükleniyor...
                        </div>
                      </td>
                    </tr>
                  ) : filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        {searchQuery ? 'Aramanızla eşleşen kişi bulunamadı' : 'Kişi bulunamadı'}
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((contact) => (
                      <tr
                        key={contact.id}
                        className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-slate-500" />
                            <span className="text-white">{contact.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-500" />
                            <span className="text-slate-300">
                              {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-slate-500" />
                            <span className="text-slate-300">{contact.company || '-'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-slate-500" />
                            <span className="text-slate-300">{contact.country || '-'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-500" />
                            <span className="text-slate-300">{contact.phone || '-'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {contact.is_valid ? (
                            <Badge variant="success" size="sm">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Geçerli
                            </Badge>
                          ) : (
                            <Badge variant="danger" size="sm" title={contact.validation_error || ''}>
                              <XCircle className="w-3 h-3 mr-1" />
                              Geçersiz
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/50">
                <p className="text-sm text-slate-400">
                  Sayfa {pagination.page} / {pagination.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Önceki
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={currentPage === pagination.totalPages}
                  >
                    Sonraki
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

