'use client';

import { Bell, Search } from 'lucide-react';
import Input from '@/components/ui/Input';

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <header className="h-16 bg-slate-900/50 backdrop-blur-sm border-b border-slate-700/50 flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:block w-64">
          <Input
            placeholder="Search..."
            icon={<Search className="w-4 h-4" />}
            className="py-2 text-sm"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#5B8C51] rounded-full" />
        </button>

        {/* Action button */}
        {action}
      </div>
    </header>
  );
}

