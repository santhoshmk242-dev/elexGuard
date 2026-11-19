import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import VoterLayout from './layouts/VoterLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { FullPageSpinner } from './components/ui';

// Explicit lazy imports (Vite needs static paths):
const Home = lazy(() => import('./pages/public/Home'));
const About = lazy(() => import('./pages/public/About'));
const HowItWorks = lazy(() => import('./pages/public/HowItWorks'));
const Elections = lazy(() => import('./pages/public/Elections'));
const ElectionDetails = lazy(() => import('./pages/public/ElectionDetails'));
const Candidates = lazy(() => import('./pages/public/Candidates'));
const CandidateDetails = lazy(() => import('./pages/public/CandidateDetails'));
const Results = lazy(() => import('./pages/public/Results'));
const Faq = lazy(() => import('./pages/public/Faq'));
const Contact = lazy(() => import('./pages/public/Contact'));
const NotFound = lazy(() => import('./pages/public/NotFound'));
const Unauthorized = lazy(() => import('./pages/public/Unauthorized'));

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const VerifyOtp = lazy(() => import('./pages/auth/VerifyOtp'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminElections = lazy(() => import('./pages/admin/Elections'));
const AdminElectionForm = lazy(() => import('./pages/admin/ElectionForm'));
const AdminElectionDetail = lazy(() => import('./pages/admin/ElectionDetail'));
const AdminCandidates = lazy(() => import('./pages/admin/Candidates'));
const AdminCandidateForm = lazy(() => import('./pages/admin/CandidateForm'));
const AdminVoters = lazy(() => import('./pages/admin/Voters'));
const AdminVoterDetails = lazy(() => import('./pages/admin/VoterDetails'));
const AdminConstituencies = lazy(() => import('./pages/admin/Constituencies'));
const AdminResults = lazy(() => import('./pages/admin/ElectionResults'));
const AdminReports = lazy(() => import('./pages/admin/Reports'));
const AdminAudit = lazy(() => import('./pages/admin/AuditLogs'));
const AdminSecurity = lazy(() => import('./pages/admin/SecurityMonitoring'));
const AdminNotices = lazy(() => import('./pages/admin/Notices'));
const Profile = lazy(() => import('./pages/shared/Profile'));

const VoterDashboard = lazy(() => import('./pages/voter/Dashboard'));
const VoterElections = lazy(() => import('./pages/voter/Elections'));
const VoterElectionDetails = lazy(() => import('./pages/voter/ElectionDetails'));
const VoterCandidateDetails = lazy(() => import('./pages/voter/CandidateDetails'));
const Ballot = lazy(() => import('./pages/voter/Ballot'));
const VoteReview = lazy(() => import('./pages/voter/VoteReview'));
const VoteConfirmation = lazy(() => import('./pages/voter/VoteConfirmation'));
const VotingHistory = lazy(() => import('./pages/voter/VotingHistory'));

export default function App() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="how-it-works" element={<HowItWorks />} />
          <Route path="elections" element={<Elections />} />
          <Route path="elections/:id" element={<ElectionDetails />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="candidates/:id" element={<CandidateDetails />} />
          <Route path="results" element={<Results />} />
          <Route path="results/:id" element={<Results />} />
          <Route path="faq" element={<Faq />} />
          <Route path="contact" element={<Contact />} />
          <Route path="login" element={<Login />} />
          <Route path="admin/login" element={<Login admin />} />
          <Route path="register" element={<Register />} />
          <Route path="verify-otp" element={<VerifyOtp />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="elections" element={<AdminElections />} />
            <Route path="elections/new" element={<AdminElectionForm />} />
            <Route path="elections/:id" element={<AdminElectionDetail />} />
            <Route path="elections/:id/edit" element={<AdminElectionForm />} />
            <Route path="candidates" element={<AdminCandidates />} />
            <Route path="candidates/new" element={<AdminCandidateForm />} />
            <Route path="candidates/:id/edit" element={<AdminCandidateForm />} />
            <Route path="voters" element={<AdminVoters />} />
            <Route path="voters/:id" element={<AdminVoterDetails />} />
            <Route path="constituencies" element={<AdminConstituencies />} />
            <Route path="results" element={<AdminResults />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="audit-logs" element={<AdminAudit />} />
            <Route path="security" element={<AdminSecurity />} />
            <Route path="notices" element={<AdminNotices />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute role="voter" />}>
          <Route path="voter" element={<VoterLayout />}>
            <Route index element={<VoterDashboard />} />
            <Route path="elections" element={<VoterElections />} />
            <Route path="elections/:id" element={<VoterElectionDetails />} />
            <Route path="elections/:id/ballot" element={<Ballot />} />
            <Route path="elections/:id/review" element={<VoteReview />} />
            <Route path="elections/:id/confirmation" element={<VoteConfirmation />} />
            <Route path="candidates/:id" element={<VoterCandidateDetails />} />
            <Route path="history" element={<VotingHistory />} />
            <Route path="results" element={<Results embedded base="/voter/results" />} />
            <Route path="results/:id" element={<Results embedded base="/voter/results" />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
