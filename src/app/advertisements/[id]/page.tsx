'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  MousePointerClick,
  Users,
  Monitor,
  Smartphone,
  Tablet,
  Calendar,
  TrendingUp,
  Clock,
  Globe,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { advertisementsApi } from '@/lib/api';
import type { AdDetailedStats } from '@/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

const COLORS = ['#5B8C51', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const DeviceIcon = ({ device }: { device: string }) => {
  switch (device.toLowerCase()) {
    case 'mobile':
      return <Smartphone className="w-4 h-4" />;
    case 'tablet':
      return <Tablet className="w-4 h-4" />;
    default:
      return <Monitor className="w-4 h-4" />;
  }
};

export default function AdvertisementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [stats, setStats] = useState<AdDetailedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedDays, setSelectedDays] = useState(30);

  const TRACKING_URL = process.env.NEXT_PUBLIC_TRACKING_URL || 'https://go.natural.clinic';

  useEffect(() => {
    loadStats();
  }, [resolvedParams.id, selectedDays]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await advertisementsApi.getStats(resolvedParams.id, selectedDays);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyTrackingLink = () => {
    if (!stats) return;
    const link = `${TRACKING_URL}/${stats.advertisement.tracking_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleActive = async () => {
    if (!stats) return;
    try {
      await advertisementsApi.update(stats.advertisement.id, { 
        is_active: !stats.advertisement.is_active 
      });
      setStats(prev => prev ? {
        ...prev,
        advertisement: { ...prev.advertisement, is_active: !prev.advertisement.is_active }
      } : null);
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-8 w-64 bg-slate-700 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="bg-slate-800/50 border-slate-700/50 animate-pulse">
                <CardContent className="p-6 h-24" />
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!stats) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center py-12">
          <h2 className="text-xl text-white mb-2">Advertisement not found</h2>
          <Link href="/advertisements">
            <Button variant="outline">Back to Advertisements</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const { advertisement, dailyStats, deviceBreakdown, browserBreakdown, osBreakdown, hourlyDistribution, totalClicks } = stats;

  // Calculate peak hour
  const peakHour = hourlyDistribution.reduce((max, curr) => 
    curr.count > max.count ? curr : max, hourlyDistribution[0]);

  // Format daily stats for chart
  const chartData = dailyStats.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    clicks: d.count,
  }));

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/advertisements">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{advertisement.name}</h1>
              <Badge variant={advertisement.is_active ? 'success' : 'default'}>
                {advertisement.is_active ? 'Active' : 'Inactive'}
              </Badge>
              {advertisement.platform && (
                <Badge variant="default" className="text-slate-400 border-slate-600">
                  {advertisement.platform}
                </Badge>
              )}
            </div>
            {advertisement.description && (
              <p className="text-slate-400 mt-1">{advertisement.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleActive}
            className="border-slate-600"
          >
            {advertisement.is_active ? (
              <>
                <ToggleRight className="w-4 h-4 mr-2 text-green-400" />
                Deactivate
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 mr-2" />
                Activate
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tracking Link */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Tracking Link</p>
              <code className="text-[#7ba373] font-mono">
                {TRACKING_URL}/{advertisement.tracking_code}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={copyTrackingLink}
                className="border-slate-600"
              >
                {copied ? 'Copied!' : <><Copy className="w-4 h-4 mr-2" /> Copy</>}
              </Button>
              <a href={advertisement.destination_url} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="border-slate-600">
                  <ExternalLink className="w-4 h-4 mr-2" /> Visit
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Period Selector */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400 text-sm">Period:</span>
        {[7, 14, 30, 90].map(days => (
          <Button
            key={days}
            size="sm"
            variant={selectedDays === days ? 'primary' : 'outline'}
            onClick={() => setSelectedDays(days)}
            className={selectedDays === days 
              ? 'bg-[#5B8C51] hover:bg-[#4a7a42]' 
              : 'border-slate-600 text-slate-400 hover:text-white'}
          >
            {days}d
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-2xl font-bold text-white">{advertisement.stats?.unique_clicks || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Avg/Day</p>
                <p className="text-2xl font-bold text-white">
                  {dailyStats.length > 0 ? (totalClicks / dailyStats.length).toFixed(1) : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Clock className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Peak Hour</p>
                <p className="text-2xl font-bold text-white">
                  {peakHour.count > 0 ? `${peakHour.hour}:00` : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clicks Over Time */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#7ba373]" />
              Clicks Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="clicks"
                      stroke="#5B8C51"
                      strokeWidth={2}
                      dot={{ fill: '#5B8C51', r: 4 }}
                      activeDot={{ r: 6, fill: '#7ba373' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                No click data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Monitor className="w-5 h-5 text-[#7ba373]" />
              Device Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deviceBreakdown.length > 0 ? (
              <div className="h-64 flex items-center">
                <div className="w-1/2">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={deviceBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="name"
                      >
                        {deviceBreakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-2">
                  {deviceBreakdown.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                        />
                        <DeviceIcon device={item.name} />
                        <span className="text-slate-300">{item.name}</span>
                      </div>
                      <span className="text-white font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                No device data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Browser & OS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Browser */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#7ba373]" />
              Browser
            </CardTitle>
          </CardHeader>
          <CardContent>
            {browserBreakdown.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={browserBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={80} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    />
                    <Bar dataKey="count" fill="#5B8C51" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400">
                No browser data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* OS */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Monitor className="w-5 h-5 text-[#7ba373]" />
              Operating System
            </CardTitle>
          </CardHeader>
          <CardContent>
            {osBreakdown.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={osBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={80} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400">
                No OS data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hourly Distribution */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#7ba373]" />
            Hourly Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="hour" 
                  stroke="#94a3b8" 
                  fontSize={12}
                  tickFormatter={(h) => `${h}:00`}
                />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelFormatter={(h) => `${h}:00 - ${h}:59`}
                />
                <Bar dataKey="count" fill="#5B8C51" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* UTM Info */}
      {(advertisement.utm_source || advertisement.utm_medium || advertisement.utm_campaign) && (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">UTM Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {advertisement.utm_source && (
                <div>
                  <p className="text-sm text-slate-400">Source</p>
                  <p className="text-white font-medium">{advertisement.utm_source}</p>
                </div>
              )}
              {advertisement.utm_medium && (
                <div>
                  <p className="text-sm text-slate-400">Medium</p>
                  <p className="text-white font-medium">{advertisement.utm_medium}</p>
                </div>
              )}
              {advertisement.utm_campaign && (
                <div>
                  <p className="text-sm text-slate-400">Campaign</p>
                  <p className="text-white font-medium">{advertisement.utm_campaign}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </DashboardLayout>
  );
}

