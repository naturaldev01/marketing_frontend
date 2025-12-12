'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Header from '@/components/layout/Header';
import Card, { CardContent, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { reportsApi } from '@/lib/api';
import type { DashboardStats } from '@/types';
import {
  Send,
  FileText,
  Upload,
  Users,
  Mail,
  CheckCircle,
  Eye,
  MousePointer,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ChartDataPoint {
  name: string;
  date: string;
  sent: number;
  opened: number;
  clicked: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadChartData();
  }, []);

  const loadStats = async () => {
    try {
      const data = await reportsApi.getDashboard();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      const data = await reportsApi.getEmailPerformance(7);
      setChartData(data);
    } catch (error) {
      console.error('Failed to load chart data:', error);
    } finally {
      setChartLoading(false);
    }
  };

  // Helper function to format change percentage
  const formatChange = (change: number | undefined) => {
    if (change === undefined || change === 0) return { text: '0%', isPositive: null };
    const isPositive = change > 0;
    return {
      text: `${isPositive ? '+' : ''}${change}%`,
      isPositive,
    };
  };

  const statCards = [
    {
      title: 'Total Campaigns',
      value: stats?.campaigns.total || 0,
      icon: Send,
      bgColor: 'bg-[#5B8C51]/10',
      iconColor: 'text-[#7ba373]',
      change: stats?.weeklyChanges?.campaigns,
    },
    {
      title: 'Email Templates',
      value: stats?.templates || 0,
      icon: FileText,
      bgColor: 'bg-sky-500/10',
      iconColor: 'text-sky-400',
      change: stats?.weeklyChanges?.templates,
    },
    {
      title: 'CSV Files',
      value: stats?.csvFiles || 0,
      icon: Upload,
      bgColor: 'bg-violet-500/10',
      iconColor: 'text-violet-400',
      change: stats?.weeklyChanges?.csvFiles,
    },
    {
      title: 'Total Contacts',
      value: stats?.contacts || 0,
      icon: Users,
      bgColor: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
      change: stats?.weeklyChanges?.contacts,
    },
  ];

  const emailStats = [
    { label: 'Total Sent', value: stats?.emails.sent || 0, icon: Mail, bgColor: 'bg-slate-500/10', iconColor: 'text-slate-400' },
    { label: 'Delivered', value: stats?.emails.delivered || 0, icon: CheckCircle, bgColor: 'bg-[#5B8C51]/10', iconColor: 'text-[#7ba373]' },
    { label: 'Opened', value: stats?.emails.opened || 0, icon: Eye, bgColor: 'bg-sky-500/10', iconColor: 'text-sky-400' },
    { label: 'Clicked', value: stats?.emails.clicked || 0, icon: MousePointer, bgColor: 'bg-violet-500/10', iconColor: 'text-violet-400' },
    { label: 'Bounced', value: stats?.emails.bounced || 0, icon: AlertTriangle, bgColor: 'bg-rose-500/10', iconColor: 'text-rose-400' },
  ];

  return (
    <DashboardLayout>
      <Header
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening with your campaigns."
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <Card key={stat.title} hover className={`animate-slide-up stagger-${index + 1}`}>
              <CardContent className="py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-white">
                      {loading ? '-' : stat.value.toLocaleString()}
                    </p>
                    {!loading && (
                      <div className="flex items-center gap-1 mt-2">
                        {(() => {
                          const { text, isPositive } = formatChange(stat.change);
                          if (isPositive === null) {
                            return (
                              <>
                                <Minus className="w-3 h-3 text-slate-400" />
                                <span className="text-xs text-slate-400">{text}</span>
                              </>
                            );
                          }
                          return isPositive ? (
                            <>
                              <TrendingUp className="w-3 h-3 text-[#7ba373]" />
                              <span className="text-xs text-[#7ba373]">{text}</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="w-3 h-3 text-rose-400" />
                              <span className="text-xs text-rose-400">{text}</span>
                            </>
                          );
                        })()}
                        <span className="text-xs text-slate-500">vs last week</span>
                      </div>
                    )}
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Email Performance</h3>
                  <p className="text-sm text-slate-400">Last 7 days overview</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#5B8C51]" />
                    <span className="text-xs text-slate-400">Sent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-sky-500" />
                    <span className="text-xs text-slate-400">Opened</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-violet-500" />
                    <span className="text-xs text-slate-400">Clicked</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                {chartLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-slate-400">Loading chart...</div>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-slate-500">No email data available</div>
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5B8C51" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#5B8C51" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorClicked" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sent"
                      stroke="#5B8C51"
                      fillOpacity={1}
                      fill="url(#colorSent)"
                    />
                    <Area
                      type="monotone"
                      dataKey="opened"
                      stroke="#0ea5e9"
                      fillOpacity={1}
                      fill="url(#colorOpened)"
                    />
                    <Area
                      type="monotone"
                      dataKey="clicked"
                      stroke="#8b5cf6"
                      fillOpacity={1}
                      fill="url(#colorClicked)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Email Stats */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-white">Email Statistics</h3>
              <p className="text-sm text-slate-400">All time metrics</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {emailStats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                      <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                    </div>
                    <span className="text-sm text-slate-300">{stat.label}</span>
                  </div>
                  <span className="font-semibold text-white">
                    {loading ? '-' : stat.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Campaign Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-white">Campaign Status</h3>
              <p className="text-sm text-slate-400">Overview of all campaigns</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default">Draft</Badge>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats?.campaigns.draft || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="info">Scheduled</Badge>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats?.campaigns.scheduled || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="warning">Sending</Badge>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats?.campaigns.sending || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="success">Sent</Badge>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats?.campaigns.sent || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
              <p className="text-sm text-slate-400">Get started quickly</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href="/campaigns/new"
                className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-[#5B8C51]/10 to-[#47703f]/10 border border-[#5B8C51]/20 hover:border-[#5B8C51]/40 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#5B8C51]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Send className="w-5 h-5 text-[#7ba373]" />
                </div>
                <div>
                  <p className="font-medium text-white">Create Campaign</p>
                  <p className="text-sm text-slate-400">Start a new email campaign</p>
                </div>
              </Link>
              <Link
                href="/templates/new"
                className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:border-slate-600/50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <p className="font-medium text-white">New Template</p>
                  <p className="text-sm text-slate-400">Design an email template</p>
                </div>
              </Link>
              <Link
                href="/csv-files"
                className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:border-slate-600/50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Upload Contacts</p>
                  <p className="text-sm text-slate-400">Import a CSV file</p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

