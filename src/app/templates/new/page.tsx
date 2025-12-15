'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Header from '@/components/layout/Header';
import Card, { CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { templatesApi } from '@/lib/api';
import {
  ArrowLeft,
  Save,
  Eye,
  Code,
  Sparkles,
  Link as LinkIcon,
  Type,
  FileText,
  RefreshCw,
  PenTool,
  Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Email template generator
const generateEmailHtml = (data: {
  subject: string;
  bodyText: string;
  ctaText: string;
  ctaLink: string;
}) => {
  const { subject, bodyText, ctaText, ctaLink } = data;
  
  // Convert line breaks to paragraphs
  const paragraphs = bodyText
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p style="margin: 0 0 16px 0; line-height: 1.6;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <img src="https://natural.clinic/wp-content/uploads/2023/07/Natural_logo_green-01.png.webp" alt="Natural Clinic" style="max-width: 180px; height: auto;">
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 30px 40px; color: #374151; font-size: 16px;">
              ${paragraphs}
            </td>
          </tr>
          
          <!-- CTA Button -->
          ${ctaText && ctaLink ? `
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <a href="${ctaLink}" style="display: inline-block; padding: 14px 32px; background-color: #5B8C51; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                ${ctaText}
              </a>
            </td>
          </tr>
          ` : ''}
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                Natural Clinic
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Bu e-posta {{email}} adresine gönderilmiştir.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

type EditorMode = 'visual' | 'html';

export default function NewTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('visual');
  const [activePreview, setActivePreview] = useState<'preview' | 'code'>('preview');
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    bodyText: '',
    ctaText: '',
    ctaLink: '',
  });
  
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [customHtml, setCustomHtml] = useState('');

  // Generate HTML when form data changes (only in visual mode)
  const updateHtml = useCallback(() => {
    if (editorMode === 'visual') {
      const html = generateEmailHtml({
        subject: formData.subject,
        bodyText: formData.bodyText,
        ctaText: formData.ctaText,
        ctaLink: formData.ctaLink,
      });
      setGeneratedHtml(html);
    }
  }, [formData.subject, formData.bodyText, formData.ctaText, formData.ctaLink, editorMode]);

  useEffect(() => {
    updateHtml();
  }, [updateHtml]);

  // Switch between visual and HTML mode
  const handleModeSwitch = (mode: EditorMode) => {
    if (mode === 'html' && editorMode === 'visual') {
      // Switching from visual to HTML - copy generated HTML to custom
      setCustomHtml(generatedHtml);
    }
    setEditorMode(mode);
  };

  // Get the HTML to use (either generated or custom)
  const getFinalHtml = () => {
    return editorMode === 'html' ? customHtml : generatedHtml;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Şablon adı gerekli');
      return;
    }
    if (!formData.subject.trim()) {
      toast.error('Konu başlığı gerekli');
      return;
    }
    
    const finalHtml = getFinalHtml();
    if (!finalHtml.trim()) {
      toast.error('E-posta içeriği gerekli');
      return;
    }
    
    setLoading(true);

    try {
      // Extract variables from the template
      const variableMatches = finalHtml.match(/\{\{(\w+)\}\}/g) || [];
      const variables = [...new Set(variableMatches.map(v => v.replace(/\{\{|\}\}/g, '')))];

      await templatesApi.create({
        name: formData.name,
        subject: formData.subject,
        bodyHtml: finalHtml,
        bodyText: editorMode === 'visual' ? formData.bodyText : stripHtml(finalHtml),
        variables,
        isActive: true,
      });
      
      toast.success('Şablon başarıyla oluşturuldu');
      router.push('/templates');
    } catch {
      toast.error('Şablon oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  // Simple HTML to text converter
  const stripHtml = (html: string) => {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '\n')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  };

  return (
    <DashboardLayout>
      <Header
        title="Yeni Şablon Oluştur"
        subtitle="E-posta şablonunuzu tasarlayın"
        action={
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              <Save className="w-4 h-4 mr-2" />
              Kaydet
            </Button>
          </div>
        }
      />

      <div className="p-6">
        {/* Editor Mode Toggle */}
        <div className="mb-6 flex items-center gap-4">
          <span className="text-sm text-slate-400">Editör Modu:</span>
          <div className="flex rounded-lg bg-slate-800/50 p-1">
            <button
              type="button"
              onClick={() => handleModeSwitch('visual')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${editorMode === 'visual' 
                  ? 'bg-[#5B8C51] text-white' 
                  : 'text-slate-400 hover:text-white'
                }
              `}
            >
              <PenTool className="w-4 h-4" />
              Görsel Editör
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('html')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${editorMode === 'html' 
                  ? 'bg-[#5B8C51] text-white' 
                  : 'text-slate-400 hover:text-white'
                }
              `}
            >
              <Code className="w-4 h-4" />
              HTML Editör
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sol Panel - Form */}
          <div className="space-y-6">
            {/* Temel Bilgiler - Her iki modda da göster */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#7ba373]" />
                  <h3 className="text-lg font-semibold text-white">Şablon Bilgileri</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Şablon Adı"
                  placeholder="ör: Hoş Geldiniz E-postası"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  icon={<Type className="w-4 h-4" />}
                />
                <Input
                  label="Konu Başlığı"
                  placeholder="ör: {{first_name}}, Natural Clinic'e Hoş Geldiniz!"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  icon={<Sparkles className="w-4 h-4" />}
                />
              </CardContent>
            </Card>

            {/* Görsel Editör Modu */}
            {editorMode === 'visual' && (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Type className="w-5 h-5 text-sky-400" />
                      <h3 className="text-lg font-semibold text-white">E-posta İçeriği</h3>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      label="Gövde Metni"
                      placeholder={`Merhaba {{first_name}},

Natural Clinic ailesine hoş geldiniz! Sizinle tanıştığımız için çok mutluyuz.

Sağlıklı ve güzel bir yaşam için buradayız. Sorularınız için bize ulaşabilirsiniz.

Sevgilerle,
Natural Clinic Ekibi`}
                      rows={10}
                      value={formData.bodyText}
                      onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
                    />
                    <p className="text-xs text-slate-400">
                      💡 Değişkenler için {`{{first_name}}`}, {`{{last_name}}`}, {`{{email}}`} gibi formatları kullanın
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-5 h-5 text-violet-400" />
                      <h3 className="text-lg font-semibold text-white">CTA (Eylem Çağrısı)</h3>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      label="CTA Metni"
                      placeholder="ör: Randevu Al"
                      value={formData.ctaText}
                      onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                    />
                    <Input
                      label="CTA Linki"
                      placeholder="ör: https://natural.clinic/randevu"
                      value={formData.ctaLink}
                      onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                      icon={<LinkIcon className="w-4 h-4" />}
                    />
                  </CardContent>
                </Card>
              </>
            )}

            {/* HTML Editör Modu */}
            {editorMode === 'html' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code className="w-5 h-5 text-amber-400" />
                      <h3 className="text-lg font-semibold text-white">HTML Kodu</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(customHtml);
                          toast.success('HTML kopyalandı');
                        }}
                        className="text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        Kopyala
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-slate-900/50 rounded-lg border border-slate-700/50 overflow-hidden">
                      <textarea
                        value={customHtml}
                        onChange={(e) => setCustomHtml(e.target.value)}
                        className="w-full h-[500px] p-4 bg-transparent text-slate-300 font-mono text-sm resize-none focus:outline-none"
                        placeholder="HTML kodunuzu buraya yapıştırın veya yazın..."
                        spellCheck={false}
                      />
                    </div>
                    <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                      <p className="text-xs text-slate-400 mb-2">
                        <strong className="text-slate-300">💡 İpuçları:</strong>
                      </p>
                      <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                        <li>Değişkenler için: {`{{first_name}}`}, {`{{last_name}}`}, {`{{email}}`}</li>
                        <li>Unsubscribe linki için: {`{{unsubscribe_link}}`}</li>
                        <li>Görseller için Supabase Storage URL'lerini kullanın</li>
                        <li>Email için inline CSS kullanın (harici CSS desteklenmez)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sağ Panel - Önizleme */}
          <div className="space-y-4">
            {/* Tab Buttons */}
            <div className="flex gap-2">
              <Button
                variant={activePreview === 'preview' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActivePreview('preview')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Canlı Önizleme
              </Button>
              <Button
                variant={activePreview === 'code' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActivePreview('code')}
              >
                <Code className="w-4 h-4 mr-2" />
                HTML Çıktısı
              </Button>
              {editorMode === 'visual' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={updateHtml}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Preview/Code Panel */}
            <Card className="h-[calc(100vh-280px)] overflow-hidden">
              <CardHeader>
                <h3 className="text-lg font-semibold text-white">
                  {activePreview === 'code' ? 'HTML Çıktısı' : 'E-posta Önizleme'}
                </h3>
              </CardHeader>
              <CardContent className="h-[calc(100%-60px)] overflow-auto p-0">
                {activePreview === 'code' ? (
                  <pre className="p-4 text-xs text-slate-300 font-mono whitespace-pre-wrap break-all">
                    {getFinalHtml()}
                  </pre>
                ) : (
                  <div className="bg-slate-200 h-full overflow-auto">
                    <iframe
                      srcDoc={getFinalHtml()}
                      className="w-full h-full border-0"
                      title="Email Preview"
                      sandbox=""
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
