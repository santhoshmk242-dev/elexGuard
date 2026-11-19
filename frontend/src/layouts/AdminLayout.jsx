import { LayoutDashboard, CalendarDays, Users, UserCheck, MapPin, BarChart3, FileText, ScrollText, ShieldAlert, UserCog, Megaphone } from 'lucide-react';
import DashboardLayout from './DashboardLayout';

const nav = [
  { items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  { group: 'Elections', items: [
    { to: '/admin/elections', label: 'Election management', icon: CalendarDays },
    { to: '/admin/candidates', label: 'Candidates', icon: Users },
    { to: '/admin/constituencies', label: 'Constituencies', icon: MapPin },
    { to: '/admin/results', label: 'Results', icon: BarChart3 },
    { to: '/admin/reports', label: 'Reports', icon: FileText },
  ] },
  { group: 'People', items: [{ to: '/admin/voters', label: 'Voter management', icon: UserCheck }, { to: '/admin/notices', label: 'Notices & messages', icon: Megaphone }] },
  { group: 'Security', items: [{ to: '/admin/audit-logs', label: 'Audit logs', icon: ScrollText }, { to: '/admin/security', label: 'Security monitoring', icon: ShieldAlert }] },
  { group: 'Account', items: [{ to: '/admin/profile', label: 'Admin profile', icon: UserCog }] },
];
export default function AdminLayout() { return <DashboardLayout nav={nav} title="Administrator Console" home="/admin" />; }
