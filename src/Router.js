import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useUser } from './contexts/UserContext';
import withAuthorization from './components/withAuthorization';
import Layout from './components/Layout';
import useData from './hooks/useData';
import { doc, getDoc } from 'firebase/firestore';
import { db, appId } from './firebase';

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
import StudentPerformance from './features/Analytics/StudentPerformance';
import StudentDetail from './features/Analytics/StudentDetail';
import PracticeQuiz from './features/Practice/PracticeQuiz';
import QuantMCQCreator from './features/Creator/QuantMCQCreator';

const AdminDashboardWithAuth = withAuthorization(['Admin'])(AdminDashboard);
const CreatorDashboardWithAuth = withAuthorization(['Admin', 'Creator', 'Educator'])(CreatorDashboard);
const TestCreatorWithAuth = withAuthorization(['Admin', 'Creator', 'Educator'])(TestCreator);
const QuestionBankManagerWithAuth = withAuthorization(['Admin', 'Creator', 'Educator'])(QuestionBankManager);
const StudentPerformanceWithAuth = withAuthorization(['Admin', 'Educator'])(StudentPerformance);
const StudentDetailWithAuth = withAuthorization(['Admin', 'Educator'])(StudentDetail);

const AppRouter = () => {
  const { user, userProfile, isAuthReady } = useUser();
  const { isLoading } = useData();
  
  const renderDashboard = () => {
    if (!userProfile) return null;
    switch (userProfile.role) {
      case 'Student':
        return <StudentDashboard userProfile={userProfile} />;
      case 'Admin':
        return <Navigate to="/admin" replace />;
      case 'Educator':
        return <Navigate to="/student-performance" replace />;
      default:
        return <LoginScreen />;
    }
  };

  if (!isAuthReady || isLoading) {
    return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl font-semibold text-gray-700">Loading App...</div></div>;
  }

  return (
      user ? (
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={renderDashboard()} />
            <Route path="/admin" element={<AdminDashboardWithAuth />} />
            <Route path="/create" element={<CreatorDashboardWithAuth />} />
            <Route path="/create-form" element={<TestCreatorWithAuth user={user} setView={() => {}} />} />
            <Route path="/question-bank" element={<QuestionBankManagerWithAuth />} />
            <Route path="/practice" element={<PracticeHub />} />
            <Route path="/practice-quiz" element={<PracticeQuiz />} />
            <Route path="/take-test" element={<Navigate to="/take-mock" replace />} />
            <Route path="/take-mock" element={<MockGmatFlow />} />
            <Route path="/results" element={<ResultsScreen />} />
            <Route path="/past-results" element={<PastResults />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/student-performance" element={<StudentPerformanceWithAuth />} />
            <Route path="/student-performance/:studentId" element={<StudentDetailWithAuth />} />
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