'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Header from '@/components/layout/Header';
import Card, { CardContent, CardHeader } from '@/components/ui/Card';
import { reportsApi, campaignsApi } from '@/lib/api';
import type { Campaign, DashboardStats } from '@/types';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Mail,
  Eye,
  MousePointer,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#5B8C51', '#0ea5e9', '#8b5cf6', '#f59e0b', '#f43f5e'];

export default function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, campaignsData] = await Promise.all([
        reportsApi.getDashboard(),
        campaignsApi.getAll({ status: 'sent' }),
      ]);
      setStats(statsData);
      setCampaigns(campaignsData.slice(0, 10));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const emailPieData = stats
    ? [
        { name: 'Delivered', value: stats.emails.delivered },
        { name: 'Opened', value: stats.emails.opened },
        { name: 'Clicked', value: stats.emails.clicked },
        { name: 'Bounced', value: stats.emails.bounced },
        { name: 'Failed', value: stats.emails.failed },
      ].filter((d) => d.value > 0)
    : [];

  const campaignBarData = campaigns.map((c) => ({
    name: c.name.substring(0, 15) + (c.name.length > 15 ? '...' : ''),
    sent: c.stats.sent,
    opened: c.stats.opened,
    clicked: c.stats.clicked,
  }));

  const calculateRate = (numerator: number, denominator: number) => {
    if (denominator === 0) return '0.0';
    return ((numerator / denominator) * 100).toFixed(1);
  };

  return (
    <DashboardLayout>
      <Header
        title="Reports"
        subtitle="Analytics and performance metrics for your campaigns"
      />

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Delivery Rate</p>
                  <p className="text-3xl font-bold text-white">
                    {stats ? calculateRate(stats.emails.delivered, stats.emails.sent) : '-'}%
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-[#7ba373]" />
                    <span className="text-xs text-[#7ba373]">+2.5%</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#5B8C51]/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-[#7ba373]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Open Rate</p>
                  <p className="text-3xl font-bold text-white">
                    {stats ? calculateRate(stats.emails.opened, stats.emails.delivered) : '-'}%
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-[#7ba373]" />
                    <span className="text-xs text-[#7ba373]">+5.2%</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-sky-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Click Rate</p>
                  <p className="text-3xl font-bold text-white">
                    {stats ? calculateRate(stats.emails.clicked, stats.emails.opened) : '-'}%
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingDown className="w-3 h-3 text-rose-400" />
                    <span className="text-xs text-rose-400">-1.2%</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <MousePointer className="w-6 h-6 text-violet-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Bounce Rate</p>
                  <p className="text-3xl font-bold text-white">
                    {stats ? calculateRate(stats.emails.bounced, stats.emails.sent) : '-'}%
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingDown className="w-3 h-3 text-[#7ba373]" />
                    <span className="text-xs text-[#7ba373]">-0.8%</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-rose-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign Performance Bar Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <h3 className="text-lg font-semibold text-white">Campaign Performance</h3>
              <p className="text-sm text-slate-400">Recent sent campaigns</p>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                {campaignBarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={campaignBarData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-45} textAnchor="end" height={60} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="sent" fill="#5B8C51" name="Sent" />
                      <Bar dataKey="opened" fill="#0ea5e9" name="Opened" />
                      <Bar dataKey="clicked" fill="#8b5cf6" name="Clicked" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    No campaign data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Email Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-white">Email Distribution</h3>
              <p className="text-sm text-slate-400">All time breakdown</p>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                {emailPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={emailPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {emailPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    No email data available
                  </div>
                )}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {emailPieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-xs text-slate-400">{entry.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Campaigns Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Sent Campaigns</h3>
                <p className="text-sm text-slate-400">Click on a campaign to view detailed report</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-3 px-6 text-sm font-medium text-slate-400">Campaign</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Sent</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Delivered</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Opened</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Clicked</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Bounced</th>
                    <th className="text-right py-3 px-6 text-sm font-medium text-slate-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No sent campaigns yet
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((campaign) => (
                      <tr
                        key={campaign.id}
                        className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <Link
                            href={`/reports/campaigns/${campaign.id}`}
                            className="flex items-center gap-3 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#5B8C51]/10 flex items-center justify-center">
                              <BarChart3 className="w-4 h-4 text-[#7ba373]" />
                            </div>
                            <div>
                              <p className="font-medium text-white group-hover:text-[#7ba373] transition-colors">
                                {campaign.name}
                              </p>
                              <p className="text-xs text-slate-500">{campaign.from_email}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-[#7ba373] ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                          </Link>
                        </td>
                        <td className="py-4 px-4 text-center text-slate-300">
                          {campaign.stats.sent.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-center text-[#7ba373]">
                          {campaign.stats.delivered.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-center text-sky-400">
                          {campaign.stats.opened.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-center text-violet-400">
                          {campaign.stats.clicked.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-center text-rose-400">
                          {campaign.stats.bounced.toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-right text-slate-500 text-sm">
                          {campaign.completed_at
                            ? format(new Date(campaign.completed_at), 'MMM d, yyyy')
                            : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

