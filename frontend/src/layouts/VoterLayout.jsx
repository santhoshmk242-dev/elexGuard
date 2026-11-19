import { LayoutDashboard, Vote, History, BarChart3, UserCircle } from 'lucide-react';
import DashboardLayout from './DashboardLayout';

const nav = [
  { items: [
    { to: '/voter', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/voter/elections', label: 'Available elections', icon: Vote },
    { to: '/voter/history', label: 'Voting history', icon: History },
    { to: '/voter/results', label: 'Published results', icon: BarChart3 },
    { to: '/voter/profile', label: 'My profile', icon: UserCircle },
  ] },
];
export default function VoterLayout() { return <DashboardLayout nav={nav} title="Voter Portal" home="/voter" />; }
