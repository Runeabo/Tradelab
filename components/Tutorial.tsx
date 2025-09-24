import React, { useState, useEffect } from 'react';
import { useLocalization } from '../LocalizationContext';

interface TutorialProps {
  onDone: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ onDone }) => {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const { t } = useLocalization();

  const TOUR_STEPS = [
    {
      targetId: 'tutorial-step-1',
      title: t('tour.step1Title'),
      content: t('tour.step1Body'),
      position: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-2',
    },
    {
      targetId: 'tutorial-step-2',
      title: t('tour.step2Title'),
      content: t('tour.step2Body'),
      position: 'bottom-full left-1/2 -translate-x-1/2 -translate-y-2',
    },
    {
      targetId: 'tutorial-step-3',
      title: t('tour.step3Title'),
      content: t('tour.step3Body'),
      position: 'bottom-full left-1/2 -translate-x-1/2 -translate-y-2',
    },
  ];

  const currentStep = TOUR_STEPS[step];

  useEffect(() => {
    const allElements: { [key: string]: HTMLElement | null } = {};
    TOUR_STEPS.forEach(s => {
      allElements[s.targetId] = document.getElementById(s.targetId);
    });

    const activeElement = allElements[currentStep.targetId];
    
    // Reset z-index for all tour elements
    Object.values(allElements).forEach(el => {
      if (el) el.style.zIndex = '';
    });

    if (activeElement) {
        // A small delay to allow UI to settle
        const timer = setTimeout(() => {
            setTargetRect(activeElement.getBoundingClientRect());
            activeElement.style.zIndex = '1001';
            activeElement.style.position = 'relative';
        }, 100);

        return () => {
            if (activeElement) {
                activeElement.style.zIndex = '';
                activeElement.style.position = '';
            }
            clearTimeout(timer);
        }
    }
  }, [step, currentStep.targetId]);

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      handleDone();
    }
  };

  const handleDone = () => {
    localStorage.setItem('tourDone', 'true');
    onDone();
  };
  
  if (!targetRect) return null;

  const tooltipStyle: React.CSSProperties = {
      position: 'fixed',
      top: `${targetRect.top}px`,
      left: `${targetRect.left}px`,
      width: `${targetRect.width}px`,
      height: `${targetRect.height}px`,
      pointerEvents: 'none',
      border: '3px dashed #3b82f6',
      borderRadius: '8px',
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
      zIndex: 1000,
      transition: 'all 0.3s ease-in-out',
  };

  return (
    <>
      <div style={tooltipStyle}>
        <div className={`absolute w-72 p-4 bg-gray-800 text-white rounded-lg shadow-2xl z-[1002] pointer-events-auto ${currentStep.position}`}>
            <h3 className="font-bold text-lg mb-2">{currentStep.title}</h3>
            <p className="text-sm text-gray-300 mb-4">{currentStep.content}</p>
            <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">{step + 1} / {TOUR_STEPS.length}</span>
                <div>
                    <button onClick={handleDone} className="text-xs text-gray-400 hover:text-white mr-4">{t('buttons.skip')}</button>
                    <button onClick={handleNext} className="px-4 py-1 text-sm font-semibold bg-blue-600 rounded hover:bg-blue-700">
                        {step === TOUR_STEPS.length - 1 ? t('buttons.done') : 'Next'}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default Tutorial;