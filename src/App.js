import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, doc, setDoc, getDoc, addDoc, updateDoc, arrayUnion, increment, Timestamp } from 'firebase/firestore';
import { auth, db, appId } from './firebase';

import KaTeXLoader from './components/KaTeXLoader';
import LoginScreen from './features/Authentication/LoginScreen';
import AccessDenied from './components/AccessDenied';
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

export default function App() {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [view, setView] = useState('dashboard'); 
    const [questions, setQuestions] = useState([]);
    const [passages, setPassages] = useState([]);
    const [msrSets, setMsrSets] = useState([]);
    const [graphicStimuli, setGraphicStimuli] = useState([]);
    const [tableStimuli, setTableStimuli] = useState([]);
    const [testResults, setTestResults] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTestType, setCurrentTestType] = useState(null);
    const [editingQuestionId, setEditingQuestionId] = useState(null);
    const [appSettings, setAppSettings] = useState({
        isPracticeHubActive: true,
        isMockTestActive: true,
        isSectionalTestActive: true,
    });

   const setupUser = async (authUser) => {
        if (!authUser) {
            setUser(null);
            setUserProfile(null);
            setIsLoading(false);
            return;
        }
        const userRef = doc(db, `artifacts/${appId}/users`, authUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            const newUserProfile = {
                uid: authUser.uid,
                email: authUser.email,
                role: 'Student',
                createdAt: new Date(),
                displayName: authUser.email,
                seenQuestionIds: [],
                testAttempts: {
                  Quant: 0,
                  Verbal: 0,
                  'Data Insights': 0,
                  'Full Mock Exam': 0
                }
            };
            await setDoc(userRef, newUserProfile);
            setUserProfile(newUserProfile);
        } else {
            setUserProfile(userDoc.data());
        }
        setUser(authUser);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            setupUser(authUser).finally(() => setIsAuthReady(true));
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) return;
        const settingsRef = doc(db, `artifacts/${appId}/public/data/appSettings/config`);
        const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                setAppSettings(docSnap.data());
            } else if (userProfile?.role === 'Admin') {
                setDoc(settingsRef, appSettings);
            }
        });
        return () => unsubscribe();
    }, [user, userProfile, appSettings]);

    useEffect(() => {
        if (!isAuthReady || !user) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const collections = {
            questions: setQuestions,
            passages: setPassages,
            msrSets: setMsrSets,
            graphicStimuli: setGraphicStimuli,
            tableStimuli: setTableStimuli,
        };

        const unsubscribes = Object.entries(collections).map(([collectionName, setState]) => {
            const q = query(collection(db, `artifacts/${appId}/public/data/${collectionName}`));
            return onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setState(data);
            }, (error) => {
                console.error(`Error fetching ${collectionName}:`, error);
            });
        });

        setIsLoading(false);

        return () => unsubscribes.forEach(unsub => unsub());

    }, [isAuthReady, user]);

    const handleTestStart = (testType) => {
        setCurrentTestType(testType);
        setView('take');
    };

    const handleEditQuestion = (questionId) => {
        setEditingQuestionId(questionId);
        setView('createForm');
    };
    
    const handleMockStart = () => {
        setView('takeMock');
    };

    const handleTestComplete = async (results) => {
        setTestResults(results);
        const userRef = doc(db, `artifacts/${appId}/users`, user.uid);

        try {
            const historyRef = collection(userRef, "testHistory");
            await addDoc(historyRef, {
                ...results,
                completedAt: Timestamp.now()
            });

            await updateDoc(userRef, {
                seenQuestionIds: arrayUnion(...results.seenQuestionIds),
                [`testAttempts.${results.testType}`]: increment(1)
            });

        } catch (error) {
            console.error("Error saving test results and updating user profile:", error);
        }
        setView('results');
    };

    const viewPastResult = (result) => {
        setTestResults(result);
        setView('results');
    }

    const handleLogout = async () => {
        await signOut(auth);
        setView('home');
    };
    
    if (!isAuthReady) {
        return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl font-semibold text-gray-700">Loading App...</div></div>;
    }

    if (!user) {
        return <LoginScreen />;
    }
    
    const renderView = () => {
        if (isLoading || !userProfile) {
            return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl font-semibold text-gray-700">Loading User Profile...</div></div>;
        }

        switch (view) {
            case 'create':
                if (userProfile.role === 'Admin' || userProfile.role === 'Educator') return <CreatorDashboard questions={questions} setView={setView} />;
                else return <AccessDenied/>;
            case 'createForm':
                if (userProfile.role === 'Admin' || userProfile.role === 'Educator') return <TestCreator user={user} editingQuestionId={editingQuestionId} setEditingQuestionId={setEditingQuestionId} setView={setView} questions={questions} passages={passages} msrSets={msrSets} graphicStimuli={graphicStimuli} tableStimuli={tableStimuli} />;else return <AccessDenied/>;
            case 'admin':
                if (userProfile.role === 'Admin') return <AdminDashboard appSettings={appSettings} />;
                else return <AccessDenied/>;
            case 'questionBank':
    if (userProfile.role === 'Admin' || userProfile.role === 'Educator') return <QuestionBankManager questions={questions} handleEditQuestion={handleEditQuestion} />;
    else return <AccessDenied/>;
            case 'dashboard':
                return <StudentDashboard user={user} userProfile={userProfile} setView={setView} onViewResult={viewPastResult} />;
            case 'practice':
                return <PracticeHub allQuestions={questions} />;
            case 'take':
                return <TestTaker user={user} questions={questions} passages={passages} msrSets={msrSets} graphicStimuli={graphicStimuli} tableStimuli={tableStimuli} onTestComplete={handleTestComplete} testType={currentTestType} userProfile={userProfile} />;
            case 'takeMock':
                 return <MockGmatFlow user={user} questions={questions} passages={passages} msrSets={msrSets} graphicStimuli={graphicStimuli} tableStimuli={tableStimuli} onMockComplete={handleTestComplete} userProfile={userProfile} />;case 'results':
                return <ResultsScreen results={testResults} onRestart={() => setView('home')} />;
            case 'pastResults':
                return <PastResults user={user} onViewResult={viewPastResult} />;
            case 'home':
            default:
                return <HomeScreen userRole={userProfile.role} onStartTest={handleTestStart} onStartPractice={() => setView('practice')} onStartMock={handleMockStart} appSettings={appSettings} questions={questions} userProfile={userProfile} />;}
    };

    return (
        <div className="min-h-screen bg-gray-50 font-serif">
            <KaTeXLoader />
            <header className="bg-white shadow-md">
                <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="text-2xl font-bold text-indigo-600 cursor-pointer" onClick={() => setView('home')}>GMAT Focus Prep</div>
                    <div>
                        {userProfile && <span className="text-sm text-gray-600 mr-4">{userProfile.displayName || user.email} ({userProfile.role})</span>}
                        <button className="text-indigo-600 hover:text-indigo-800 mr-4" onClick={() => setView('home')}>Home</button>
                        <button className="text-indigo-600 hover:text-indigo-800 mr-4" onClick={() => setView('dashboard')}>Dashboard</button>
                        {appSettings.isPracticeHubActive && <button className="text-indigo-600 hover:text-indigo-800 mr-4" onClick={() => setView('practice')}>Practice Hub</button>}
                        <button className="text-indigo-600 hover:text-indigo-800 mr-4" onClick={() => setView('pastResults')}>Past Results</button>
                        {(userProfile?.role === 'Admin' || userProfile?.role === 'Educator') && (<button className="text-indigo-600 hover:text-indigo-800 mr-4" onClick={() => setView('create')}>Create Content</button>)}
                        {userProfile?.role === 'Admin' && (<button className="text-indigo-600 hover:text-indigo-800 mr-4" onClick={() => setView('admin')}>Admin Panel</button>)}
                        <button onClick={handleLogout} className="text-red-600 hover:text-red-800">Logout</button>
                    </div>
                </nav>
            </header>
            <main className="container mx-auto px-6 py-8">{renderView()}</main>
        </div>
    );
}