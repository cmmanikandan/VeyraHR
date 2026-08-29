import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Trash2,
  Pin,
  Bell,
  CalendarDays,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Info,
  PartyPopper,
  Search,
  X,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useData } from '../../context/DataContext';
import { Announcement } from '../../types/database';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  General: <Info className="w-4 h-4 text-blue-500" />,
  Holiday: <PartyPopper className="w-4 h-4 text-emerald-500" />,
  Policy: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  Event: <CalendarDays className="w-4 h-4 text-purple-500" />,
};

const PRIORITY_BADGE: Record<string, 'blue' | 'amber' | 'red'> = {
  Normal: 'blue',
  Important: 'amber',
  Urgent: 'red',
};

const CATEGORY_BADGE: Record<string, 'blue' | 'green' | 'amber' | 'purple'> = {
  General: 'blue',
  Holiday: 'green',
  Policy: 'amber',
  Event: 'purple',
};

export const HRAnnouncementsPage: React.FC = () => {
  const { announcements, addAnnouncement } = useData();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('All');
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Announcement['category']>('General');
  const [priority, setPriority] = useState<Announcement['priority']>('Normal');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    await addAnnouncement({
      company_id: 'comp_veyra_tn',
      title: title.trim(),
      content: content.trim(),
      category,
      priority,
    });
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setIsOpen(false);
      setTitle('');
      setContent('');
      setCategory('General');
      setPriority('Normal');
    }, 1200);
  };

  const visible = announcements.filter((a) => {
    if (deletedIds.has(a.id)) return false;
    if (filterCat !== 'All' && a.category !== filterCat) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pinned = visible.filter((a) => pinnedIds.has(a.id));
  const rest = visible.filter((a) => !pinnedIds.has(a.id));

  const togglePin = (id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const deleteLocal = (id: string) => {
    setDeletedIds((prev) => new Set([...prev, id]));
  };

  const AnnouncementCard: React.FC<{ ann: Announcement }> = ({ ann }) => (
    <Card
      padded={false}
      className={`p-5 bg-white border-veyra-border space-y-3 shadow-xs hover:shadow-sm transition-shadow ${pinnedIds.has(ann.id) ? 'border-l-4 border-l-veyra-blue' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <span className="mt-0.5 shrink-0">{CATEGORY_ICONS[ann.category]}</span>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-veyra-text leading-tight line-clamp-1">{ann.title}</h4>
            <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
              <Badge variant={CATEGORY_BADGE[ann.category]} size="sm">{ann.category}</Badge>
              {ann.priority !== 'Normal' && (
                <Badge variant={PRIORITY_BADGE[ann.priority]} size="sm">{ann.priority}</Badge>
              )}
              {pinnedIds.has(ann.id) && (
                <Badge variant="blue" size="sm" icon={<Pin className="w-3 h-3" />}>Pinned</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => togglePin(ann.id)}
            className={`p-1.5 rounded-lg border transition-colors ${pinnedIds.has(ann.id) ? 'bg-veyra-blue text-white border-veyra-blue' : 'border-veyra-border text-veyra-text-sub hover:bg-veyra-bg-secondary'}`}
            title={pinnedIds.has(ann.id) ? 'Unpin' : 'Pin to top'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => deleteLocal(ann.id)}
            className="p-1.5 rounded-lg border border-veyra-border text-red-400 hover:bg-red-50 transition-colors"
            title="Remove"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-xs text-veyra-text-sub leading-relaxed line-clamp-3">{ann.content}</p>

      <div className="flex items-center justify-between pt-1 border-t border-veyra-border/50">
        <span className="text-[11px] text-veyra-text-muted font-medium">
          {new Date(ann.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <span className="text-[11px] text-veyra-text-muted">
          {new Date(ann.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-veyra-text tracking-tight">Company Announcements</h2>
          <p className="text-xs text-veyra-text-sub">Broadcast policies, events, and important updates to the entire team</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          New Announcement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['All', 'General', 'Holiday', 'Policy', 'Event'] as const).slice(0,4).map((cat) => {
          const count = cat === 'All'
            ? announcements.filter(a => !deletedIds.has(a.id)).length
            : announcements.filter(a => a.category === cat && !deletedIds.has(a.id)).length;
          const colors: Record<string, string> = {
            All: 'bg-veyra-blue-soft border-veyra-blue-border/40 text-veyra-blue',
            General: 'bg-blue-50 border-blue-200 text-blue-700',
            Holiday: 'bg-emerald-50 border-emerald-200 text-emerald-700',
            Policy: 'bg-amber-50 border-amber-200 text-amber-700',
            Event: 'bg-purple-50 border-purple-200 text-purple-700',
          };
          return (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`p-3 rounded-2xl border text-left transition-all ${filterCat === cat ? colors[cat] + ' ring-2 ring-offset-1 ring-veyra-blue/30' : 'bg-white border-veyra-border text-veyra-text-sub hover:bg-veyra-bg-secondary'}`}
            >
              <span className="text-xs font-bold uppercase tracking-wide block">{cat}</span>
              <span className="text-2xl font-extrabold block mt-1">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-veyra-blue" />
        <input
          type="text"
          placeholder="Search by title or content…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-veyra-border text-xs font-medium text-veyra-text placeholder:text-veyra-text-muted focus:outline-none focus:ring-2 focus:ring-veyra-blue/20"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-3.5">
            <X className="w-4 h-4 text-veyra-text-sub" />
          </button>
        )}
      </div>

      {/* Pinned */}
      {pinned.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-veyra-text uppercase tracking-wider flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5 text-veyra-blue" /> Pinned
          </h3>
          {pinned.map((a) => <AnnouncementCard key={a.id} ann={a} />)}
        </div>
      )}

      {/* All / Filtered */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-veyra-text uppercase tracking-wider flex items-center gap-1.5">
          <Megaphone className="w-3.5 h-3.5 text-veyra-blue" />
          {filterCat === 'All' ? 'All Announcements' : filterCat} ({rest.length})
        </h3>

        {rest.length === 0 && pinned.length === 0 ? (
          <Card className="text-center py-12 space-y-2">
            <Megaphone className="w-10 h-10 text-veyra-border mx-auto" />
            <p className="text-sm font-bold text-veyra-text">No announcements yet</p>
            <p className="text-xs text-veyra-text-sub">Click "New Announcement" to publish your first broadcast.</p>
          </Card>
        ) : (
          rest.map((a) => <AnnouncementCard key={a.id} ann={a} />)
        )}
      </div>

      {/* CREATE MODAL */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="New Company Announcement">
        <form onSubmit={handleCreate} className="space-y-4 text-left">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-veyra-text mb-1">Announcement Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Office Closed on Republic Day"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-veyra-text mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Announcement['category'])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
              >
                <option value="General">🔵 General</option>
                <option value="Holiday">🟢 Holiday</option>
                <option value="Policy">🟡 Policy</option>
                <option value="Event">🟣 Event</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-veyra-text mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Announcement['priority'])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-veyra-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-veyra-blue"
              >
                <option value="Normal">Normal</option>
                <option value="Important">⚠️ Important</option>
                <option value="Urgent">🔴 Urgent</option>
              </select>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-bold text-veyra-text mb-1">Message Content *</label>
            <textarea
              required
              rows={5}
              placeholder="Write the full announcement content here…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-veyra-border bg-white text-xs font-semibold resize-none focus:outline-none focus:ring-2 focus:ring-veyra-blue"
            />
            <p className="text-[11px] text-veyra-text-muted mt-1">{content.length} characters</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting || submitted}>
              {submitted ? (
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Published!</span>
              ) : submitting ? 'Publishing…' : (
                <span className="flex items-center gap-1.5"><Bell className="w-4 h-4" /> Publish & Broadcast</span>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
