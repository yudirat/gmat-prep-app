import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useUser } from './contexts/UserContext';
import withAuthorization from './components/withAuthorization';
import Layout from './components/Layout';
import useData from './hooks/useData';

// Import components and features
import LoginScreen from './features/Authentication/LoginScreen';
import SignUpScreen from './features/Authentication/SignUpScreen';
import HomeScreen from './features/Dashboard/HomeScreen';
import StudentDashboard from './features/Dashboard/StudentDashboard';
import AdminDashboard from './features/Admin/AdminDashboard';
import CreatorDashboard from './features/Creator/CreatorDashboard';
import QuestionBankManager from './features/Creator/QuestionBankManager';
import TestCreator from './features/Creator/TestCreator';
import PracticeHub from './features/Practice/PracticeHub';
import TestTaker from './features/Test/TestTaker';
import MockGmatFlow from './features/Test/MockGmatFlow';
import ResultsScreen from './features/Results/ResultsScreen';
import PastResults from './features/Results/PastResults';
import UserProfile from './features/Dashboard/UserProfile';

const AdminDashboardWithAuth = withAuthorization(['Admin'])(AdminDashboard);
const CreatorDashboardWithAuth = withAuthorization(['Admin', 'Educator'])(CreatorDashboard);
const TestCreatorWithAuth = withAuthorization(['Admin', 'Educator'])(TestCreator);
const QuestionBankManagerWithAuth = withAuthorization(['Admin', 'Educator'])(QuestionBankManager);

const AppRouter = () => {
  const { user, userProfile, isAuthReady } = useUser();
  const { questions, isLoading } = useData();
  

  if (!isAuthReady || isLoading) {
    return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl font-semibold text-gray-700">Loading App...</div></div>;
  }

  return (
      user ? (
        <Layout>
          <Routes>
            <Route path="/" element={<HomeScreen onStartTest={() => {}} onStartPractice={() => {}} onStartMock={() => {}} />} />
            <Route path="/dashboard" element={<StudentDashboard userProfile={userProfile} />} />
            <Route path="/admin" element={<AdminDashboardWithAuth />} />
            <Route path="/create" element={<CreatorDashboardWithAuth />} />
            <Route path="/practice" element={<PracticeHub allQuestions={questions} />} />
            <Route path="/take-test" element={<TestTaker onTestComplete={() => {}} testType="" />} />
            <Route path="/take-mock" element={<MockGmatFlow onMockComplete={() => {}} />} />
            <Route path="/results" element={<ResultsScreen />} />
            <Route path="/past-results" element={<PastResults />} />
            <Route path="/profile" element={<UserProfile />} />
          </Routes>
        </Layout>
      ) : (
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<SignUpScreen />} />
          <Route path="*" element={<LoginScreen />} />
        </Routes>
      )
  );
};

export default AppRouter;
