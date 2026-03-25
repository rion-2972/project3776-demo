import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { TOUR_STEPS } from '../data/tourSteps';

const STORAGE_KEY = 'project3776_tour_completed';

const TourContext = createContext(null);

export const TourProvider = ({ children, onTabChange }) => {
    const [isTourActive, setIsTourActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    // ツアーが要求するタブ切り替えを外部コンポーネントに伝えるための状態
    const [requestedTab, setRequestedTab] = useState(null);

    const totalSteps = TOUR_STEPS.length;

    // 初回ログイン検出: ツアー完了フラグがなければ自動スタート
    useEffect(() => {
        const completed = localStorage.getItem(STORAGE_KEY);
        if (!completed) {
            // 少し遅延してからスタート（画面の初期レンダリングを待つ）
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
        // 最初のステップのタブを要求
        const firstStep = TOUR_STEPS[0];
        if (firstStep?.tab) {
            setRequestedTab(firstStep.tab);
        }
    }, []);

    const nextStep = useCallback(() => {
        const next = currentStep + 1;
        if (next >= totalSteps) {
            // ツアー完了
            setIsTourActive(false);
            localStorage.setItem(STORAGE_KEY, 'true');
        } else {
            setCurrentStep(next);
            // 次のステップのタブに切り替え
            const nextStepData = TOUR_STEPS[next];
            if (nextStepData?.tab) {
                setRequestedTab(nextStepData.tab);
            }
        }
    }, [currentStep, totalSteps]);

    const prevStep = useCallback(() => {
        const prev = currentStep - 1;
        if (prev < 0) return;
        setCurrentStep(prev);
        const prevStepData = TOUR_STEPS[prev];
        if (prevStepData?.tab) {
            setRequestedTab(prevStepData.tab);
        }
    }, [currentStep]);

    const skipTour = useCallback(() => {
        setIsTourActive(false);
        localStorage.setItem(STORAGE_KEY, 'true');
    }, []);

    return (
        <TourContext.Provider value={{
            isTourActive,
            currentStep,
            totalSteps,
            startTour,
            nextStep,
            prevStep,
            skipTour,
        }}>
            {children}
        </TourContext.Provider>
    );
};

export const useTour = () => {
    const ctx = useContext(TourContext);
    if (!ctx) throw new Error('useTour must be used within TourProvider');
    return ctx;
};
