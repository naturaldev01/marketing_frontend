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

export default function NewTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'html' | 'preview'>('editor');
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    bodyText: '',
    ctaText: '',
    ctaLink: '',
  });
  
  const [generatedHtml, setGeneratedHtml] = useState('');

  // Generate HTML when form data changes
  const updateHtml = useCallback(() => {
    const html = generateEmailHtml({
      subject: formData.subject,
      bodyText: formData.bodyText,
      ctaText: formData.ctaText,
      ctaLink: formData.ctaLink,
    });
    setGeneratedHtml(html);
  }, [formData.subject, formData.bodyText, formData.ctaText, formData.ctaLink]);

  useEffect(() => {
    updateHtml();
  }, [updateHtml]);

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
    
    setLoading(true);

    try {
      // Extract variables from the template
      const variableMatches = generatedHtml.match(/\{\{(\w+)\}\}/g) || [];
      const variables = [...new Set(variableMatches.map(v => v.replace(/\{\{|\}\}/g, '')))];

      await templatesApi.create({
        name: formData.name,
        subject: formData.subject,
        bodyHtml: generatedHtml,
        bodyText: formData.bodyText,
        variables,
        isActive: true,
      });
      
      toast.success('Şablon başarıyla oluşturuldu');
      router.push('/templates');
    } catch (error) {
      toast.error('Şablon oluşturulamadı');
    } finally {
      setLoading(false);
    }
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sol Panel - Form */}
          <div className="space-y-6">
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
                  placeholder="ör: {{firstName}}, Natural Clinic'e Hoş Geldiniz!"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  icon={<Sparkles className="w-4 h-4" />}
                />
              </CardContent>
            </Card>

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
                  placeholder={`Merhaba {{firstName}},

Natural Clinic ailesine hoş geldiniz! Sizinle tanıştığımız için çok mutluyuz.

Sağlıklı ve güzel bir yaşam için buradayız. Sorularınız için bize ulaşabilirsiniz.

Sevgilerle,
Natural Clinic Ekibi`}
                  rows={10}
                  value={formData.bodyText}
                  onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
                />
                <p className="text-xs text-slate-400">
                  💡 Değişkenler için {`{{firstName}}`}, {`{{lastName}}`}, {`{{email}}`} gibi formatları kullanın
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
          </div>

          {/* Sağ Panel - Önizleme */}
          <div className="space-y-4">
            {/* Tab Buttons */}
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'editor' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('editor')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Canlı Önizleme
              </Button>
              <Button
                variant={activeTab === 'html' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('html')}
              >
                <Code className="w-4 h-4 mr-2" />
                HTML Kodu
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={updateHtml}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {/* Preview/Code Panel */}
            <Card className="h-[calc(100vh-280px)] overflow-hidden">
              <CardHeader>
                <h3 className="text-lg font-semibold text-white">
                  {activeTab === 'html' ? 'HTML Çıktısı' : 'E-posta Önizleme'}
                </h3>
              </CardHeader>
              <CardContent className="h-[calc(100%-60px)] overflow-auto p-0">
                {activeTab === 'html' ? (
                  <pre className="p-4 text-xs text-slate-300 font-mono whitespace-pre-wrap break-all">
                    {generatedHtml}
                  </pre>
                ) : (
                  <div className="bg-slate-200 h-full overflow-auto">
                    <iframe
                      srcDoc={generatedHtml}
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
