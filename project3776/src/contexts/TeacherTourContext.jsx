import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { TEACHER_TOUR_STEPS } from '../data/teacherTourSteps';

const STORAGE_KEY = 'project3776_teacher_tour_completed';

const TeacherTourContext = createContext(null);

export const TeacherTourProvider = ({ children, onTabChange }) => {
    const [isTourActive, setIsTourActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [requestedTab, setRequestedTab] = useState(null);

    const totalSteps = TEACHER_TOUR_STEPS.length;

    // 初回ログイン検出: ツアー完了フラグがなければ自動スタート
    useEffect(() => {
        const completed = localStorage.getItem(STORAGE_KEY);
        if (!completed) {
            const timer = setTimeout(() => {
                startTour();
            }, 1500);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // requestedTab が変わったら親の onTabChange を呼ぶ
    useEffect(() => {
        if (requestedTab && onTabChange) {
            onTabChange(requestedTab);
            setRequestedTab(null);
        }
    }, [requestedTab, onTabChange]);

    const startTour = useCallback(() => {
        setCurrentStep(0);
        setIsTourActive(true);
        const firstStep = TEACHER_TOUR_STEPS[0];
        if (firstStep?.tab) {
            setRequestedTab(firstStep.tab);
        }
    }, []);

    const nextStep = useCallback(() => {
        const next = currentStep + 1;
        if (next >= totalSteps) {
            setIsTourActive(false);
            localStorage.setItem(STORAGE_KEY, 'true');
        } else {
            setCurrentStep(next);
            const nextStepData = TEACHER_TOUR_STEPS[next];
            if (nextStepData?.tab) {
                setRequestedTab(nextStepData.tab);
            }
        }
    }, [currentStep, totalSteps]);

    const prevStep = useCallback(() => {
        const prev = currentStep - 1;
        if (prev < 0) return;
        setCurrentStep(prev);
        const prevStepData = TEACHER_TOUR_STEPS[prev];
        if (prevStepData?.tab) {
            setRequestedTab(prevStepData.tab);
        }
    }, [currentStep]);

    const skipTour = useCallback(() => {
        setIsTourActive(false);
        localStorage.setItem(STORAGE_KEY, 'true');
    }, []);

    return (
        <TeacherTourContext.Provider value={{
            isTourActive,
            currentStep,
            totalSteps,
            startTour,
            nextStep,
            prevStep,
            skipTour,
        }}>
            {children}
        </TeacherTourContext.Provider>
    );
};

export const useTeacherTour = () => {
    const ctx = useContext(TeacherTourContext);
    if (!ctx) throw new Error('useTeacherTour must be used within TeacherTourProvider');
    return ctx;
};
