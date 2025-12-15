'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Header from '@/components/layout/Header';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { imagesApi } from '@/lib/api';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Copy,
  Check,
  X,
  Loader2,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface ImageFile {
  id: string;
  name: string;
  path: string;
  url: string;
  size?: number;
  mimeType?: string;
  createdAt: string;
}

export default function ImagesPage() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const data = await imagesApi.getAll();
      setImages(data);
    } catch {
      toast.error('Görseller yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm('Bu görseli silmek istediğinize emin misiniz?')) return;

    try {
      await imagesApi.delete(filename);
      toast.success('Görsel silindi');
      loadImages();
    } catch {
      toast.error('Görsel silinemedi');
    }
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast.success('URL kopyalandı');
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      toast.error('Kopyalanamadı');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredImages = images.filter(
    (img) => img.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <Header
        title="Görseller"
        subtitle="E-posta şablonlarında kullanmak için görseller yükleyin"
        action={
          <Button onClick={() => setShowUploadModal(true)} icon={<Upload className="w-4 h-4" />}>
            Görsel Yükle
          </Button>
        }
      />

      <div className="p-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Görsel ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B8C51]/50"
            />
          </div>
        </div>

        {/* Images Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-48" />
              </Card>
            ))}
          </div>
        ) : filteredImages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Görsel bulunamadı</h3>
              <p className="text-slate-400 mb-4">
                {searchQuery
                  ? 'Aramanızı değiştirmeyi deneyin'
                  : 'İlk görselinizi yükleyerek başlayın'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowUploadModal(true)} icon={<Upload className="w-4 h-4" />}>
                  Görsel Yükle
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredImages.map((image) => (
              <Card key={image.id} hover className="group overflow-hidden">
                <div className="aspect-square relative bg-slate-800/50">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => copyUrl(image.url)}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      title="URL Kopyala"
                    >
                      {copiedUrl === image.url ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5 text-white" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(image.name)}
                      className="p-2 bg-white/20 rounded-lg hover:bg-rose-500/50 transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-sm text-white truncate" title={image.name}>
                    {image.name}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-500">
                      {formatFileSize(image.size)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {image.createdAt ? format(new Date(image.createdAt), 'dd MMM') : '-'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          setShowUploadModal(false);
          loadImages();
        }}
      />
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
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        (file) => file.type.startsWith('image/')
      );
      if (droppedFiles.length > 0) {
        setFiles((prev) => [...prev, ...droppedFiles]);
      } else {
        toast.error('Lütfen görsel dosyaları yükleyin');
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setLoading(true);
    const urls: string[] = [];

    try {
      for (const file of files) {
        const result = await imagesApi.upload(file);
        urls.push(result.url);
      }
      
      setUploadedUrls(urls);
      toast.success(`${files.length} görsel yüklendi!`);
      setFiles([]);
    } catch (error) {
      toast.error((error as Error).message || 'Görsel yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const copyAllUrls = async () => {
    try {
      await navigator.clipboard.writeText(uploadedUrls.join('\n'));
      toast.success('Tüm URL\'ler kopyalandı');
    } catch {
      toast.error('Kopyalanamadı');
    }
  };

  const handleClose = () => {
    setFiles([]);
    setUploadedUrls([]);
    if (uploadedUrls.length > 0) {
      onSuccess();
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Görsel Yükle" size="md">
      {uploadedUrls.length > 0 ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-green-400 font-medium mb-2">
              ✓ {uploadedUrls.length} görsel başarıyla yüklendi!
            </p>
            <p className="text-sm text-slate-400">
              Aşağıdaki URL'leri kopyalayıp e-posta şablonlarınızda kullanabilirsiniz.
            </p>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uploadedUrls.map((url, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg"
              >
                <input
                  type="text"
                  value={url}
                  readOnly
                  className="flex-1 bg-transparent text-sm text-slate-300 focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(url);
                    toast.success('URL kopyalandı');
                  }}
                  className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                >
                  <Copy className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={copyAllUrls}>
              <Copy className="w-4 h-4 mr-2" />
              Tümünü Kopyala
            </Button>
            <Button onClick={handleClose}>
              Tamam
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
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
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <ImageIcon className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-300 mb-1">
              Görselleri buraya sürükleyin veya tıklayarak seçin
            </p>
            <p className="text-sm text-slate-500">
              JPEG, PNG, GIF, WebP, SVG (Maks: 5MB)
            </p>
          </div>

          {/* Selected files */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">
                Seçilen dosyalar ({files.length})
              </p>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-white truncate max-w-[200px]">
                        {file.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-slate-700 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              İptal
            </Button>
            <Button
              onClick={handleUpload}
              loading={loading}
              disabled={files.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Yükleniyor...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Yükle ({files.length})
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

