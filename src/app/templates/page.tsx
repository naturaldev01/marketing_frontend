'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Header from '@/components/layout/Header';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { templatesApi } from '@/lib/api';
import type { Template } from '@/types';
import {
  Plus,
  Search,
  FileText,
  Edit,
  Trash2,
  Copy,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await templatesApi.getAll();
      setTemplates(data);
    } catch {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await templatesApi.delete(id);
      toast.success('Template deleted');
      loadTemplates();
    } catch {
      toast.error('Failed to delete template');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await templatesApi.duplicate(id);
      toast.success('Template duplicated');
      loadTemplates();
    } catch {
      toast.error('Failed to duplicate template');
    }
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <Header
        title="Email Templates"
        subtitle="Create and manage your email templates"
        action={
          <Link href="/templates/new">
            <Button icon={<Plus className="w-4 h-4" />}>
              New Template
            </Button>
          </Link>
        }
      />

      <div className="p-6">
        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search templates..."
            icon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-48" />
              </Card>
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No templates found</h3>
              <p className="text-slate-400 mb-4">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Create your first email template to get started'}
              </p>
              {!searchQuery && (
                <Link href="/templates/new">
                  <Button icon={<Plus className="w-4 h-4" />}>
                    Create Template
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} hover>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500/20 to-blue-500/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-sky-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{template.name}</h3>
                        <p className="text-sm text-slate-400 truncate max-w-[180px]">
                          {template.subject}
                        </p>
                      </div>
                    </div>
                    <Badge variant={template.is_active ? 'success' : 'default'} size="sm">
                      {template.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {/* Variables */}
                  {template.variables && template.variables.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-2">Variables</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.slice(0, 3).map((v) => (
                          <span
                            key={v}
                            className="px-2 py-0.5 text-xs rounded bg-slate-700/50 text-slate-300"
                          >
                            {`{{${v}}}`}
                          </span>
                        ))}
                        {template.variables.length > 3 && (
                          <span className="px-2 py-0.5 text-xs rounded bg-slate-700/50 text-slate-400">
                            +{template.variables.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-slate-500 mb-4">
                    Created {format(new Date(template.created_at), 'MMM d, yyyy')}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowPreviewModal(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Link href={`/templates/${template.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(template.id)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      className="text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {selectedTemplate && (
        <Modal
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedTemplate(null);
          }}
          title={`Preview: ${selectedTemplate.name}`}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-1">Subject</p>
              <p className="text-white">{selectedTemplate.subject}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">HTML Content</p>
              <div className="p-4 rounded-lg bg-white text-slate-900 max-h-96 overflow-auto">
                <div
                  dangerouslySetInnerHTML={{ __html: selectedTemplate.body_html || '' }}
                />
              </div>
            </div>
            {selectedTemplate.body_text && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Plain Text</p>
                <pre className="p-4 rounded-lg bg-slate-800/50 text-slate-300 text-sm whitespace-pre-wrap">
                  {selectedTemplate.body_text}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}


