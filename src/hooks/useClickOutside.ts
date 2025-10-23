import { useEffect } from 'react';

export const useClickOutside = (
    ref: React.RefObject<HTMLElement | null>,
    onClickOutside: () => void,
    isActive: boolean = true
) => {
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClickOutside();
            }
        };

        if (isActive) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [ref, onClickOutside, isActive]);
};