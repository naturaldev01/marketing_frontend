'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Megaphone, Link2, Tag, Globe } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { advertisementsApi } from '@/lib/api';

const PLATFORMS = [
  'Google Ads',
  'Facebook',
  'Instagram',
  'LinkedIn',
  'Twitter/X',
  'TikTok',
  'YouTube',
  'Email',
  'SMS',
  'QR Code',
  'Print',
  'Other',
];

export default function NewAdvertisementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    destination_url: '',
    platform: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.name.trim()) {
      setError('Advertisement name is required');
      return;
    }
    
    if (!formData.destination_url.trim()) {
      setError('Destination URL is required');
      return;
    }

    // Validate URL
    try {
      new URL(formData.destination_url);
    } catch {
      setError('Please enter a valid URL (including https://)');
      return;
    }

    setLoading(true);
    try {
      const data = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        destination_url: formData.destination_url.trim(),
        platform: formData.platform || undefined,
        utm_source: formData.utm_source.trim() || undefined,
        utm_medium: formData.utm_medium.trim() || undefined,
        utm_campaign: formData.utm_campaign.trim() || undefined,
      };

      await advertisementsApi.create(data);
      router.push('/advertisements');
    } catch (err) {
      console.error('Failed to create advertisement:', err);
      setError('Failed to create advertisement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill UTM fields from name
  const autoFillUtm = () => {
    const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData(prev => ({
      ...prev,
      utm_source: prev.platform?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'direct',
      utm_medium: prev.platform?.toLowerCase().includes('email') ? 'email' : 'cpc',
      utm_campaign: slug,
    }));
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/advertisements">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Create New Advertisement</h1>
              <p className="text-slate-400">Create a trackable link for your advertisement</p>
            </div>
          </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[#7ba373]" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-300">Advertisement Name *</label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Summer Sale 2024 - Facebook"
                className="bg-slate-900/50 border-slate-700"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-slate-300">Description</label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Optional description for internal reference"
                className="bg-slate-900/50 border-slate-700 resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="platform" className="text-sm font-medium text-slate-300">Platform</label>
              <select
                id="platform"
                name="platform"
                value={formData.platform}
                onChange={handleChange}
                className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-[#5B8C51]"
              >
                <option value="">Select platform...</option>
                {PLATFORMS.map(platform => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Destination URL */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Link2 className="w-5 h-5 text-[#7ba373]" />
              Destination URL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="destination_url" className="text-sm font-medium text-slate-300">Where should users be redirected? *</label>
              <Input
                id="destination_url"
                name="destination_url"
                type="url"
                value={formData.destination_url}
                onChange={handleChange}
                placeholder="https://example.com/landing-page"
                className="bg-slate-900/50 border-slate-700"
                required
              />
              <p className="text-xs text-slate-500">
                Include the full URL with https://
              </p>
            </div>
          </CardContent>
        </Card>

        {/* UTM Parameters */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#7ba373]" />
                UTM Parameters
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={autoFillUtm}
                className="text-xs border-slate-600 hover:bg-slate-700"
                disabled={!formData.name}
              >
                Auto-fill from name
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-400">
              UTM parameters will be automatically appended to the destination URL when users click the tracking link.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="utm_source" className="text-sm font-medium text-slate-300">UTM Source</label>
                <Input
                  id="utm_source"
                  name="utm_source"
                  value={formData.utm_source}
                  onChange={handleChange}
                  placeholder="e.g., facebook"
                  className="bg-slate-900/50 border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="utm_medium" className="text-sm font-medium text-slate-300">UTM Medium</label>
                <Input
                  id="utm_medium"
                  name="utm_medium"
                  value={formData.utm_medium}
                  onChange={handleChange}
                  placeholder="e.g., cpc, email, social"
                  className="bg-slate-900/50 border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="utm_campaign" className="text-sm font-medium text-slate-300">UTM Campaign</label>
                <Input
                  id="utm_campaign"
                  name="utm_campaign"
                  value={formData.utm_campaign}
                  onChange={handleChange}
                  placeholder="e.g., summer-sale-2024"
                  className="bg-slate-900/50 border-slate-700"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {formData.destination_url && (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#7ba373]" />
                Final URL Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <code className="text-sm text-[#7ba373] bg-slate-900/50 p-3 rounded-lg block break-all">
                {(() => {
                  try {
                    const url = new URL(formData.destination_url);
                    if (formData.utm_source) url.searchParams.set('utm_source', formData.utm_source);
                    if (formData.utm_medium) url.searchParams.set('utm_medium', formData.utm_medium);
                    if (formData.utm_campaign) url.searchParams.set('utm_campaign', formData.utm_campaign);
                    return url.toString();
                  } catch {
                    return formData.destination_url;
                  }
                })()}
              </code>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/advertisements">
            <Button type="button" variant="outline" className="border-slate-600">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-[#5B8C51] to-[#47703f] hover:from-[#4a7a42] hover:to-[#3d6035]"
          >
            {loading ? (
              <>Creating...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Advertisement
              </>
            )}
          </Button>
        </div>
      </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

