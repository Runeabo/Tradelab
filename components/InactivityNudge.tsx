import React, { useState, useEffect } from 'react';
import { useLocalization } from '../LocalizationContext';

interface InactivityNudgeProps {
    isVisible: boolean;
    onClose: () => void;
}

const InactivityNudge: React.FC<InactivityNudgeProps> = ({ isVisible, onClose }) => {
    const { t } = useLocalization();
    const [show, setShow] = useState(false);

    useEffect(() => {
        if(isVisible) {
            setShow(true);
        }
    }, [isVisible]);

    const handleClose = () => {
        setShow(false);
        // Let animation finish before calling parent onClose
        setTimeout(onClose, 300);
    }

    if (!isVisible) return null;

    return (
        <div className={`fixed bottom-32 right-4 md:right-8 w-64 p-3 bg-blue-900/80 backdrop-blur-md text-white rounded-lg shadow-2xl z-20 transition-all duration-300 ease-in-out ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <button onClick={handleClose} className="absolute -top-2 -right-2 h-6 w-6 bg-gray-700 rounded-full text-gray-300 hover:bg-gray-600 hover:text-white text-xs">&times;</button>
            <div className="relative">
                <p className="text-sm">{t('nudge.tryStarterTrade')}</p>
                 <div className="absolute -bottom-5 right-4 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-blue-900/80 border-r-[10px] border-r-transparent"></div>
            </div>
        </div>
    );
};

export default InactivityNudge;