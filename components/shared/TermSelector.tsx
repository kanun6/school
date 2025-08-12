'use client';

import { useState, useEffect } from 'react';
import { AcademicTerm } from '@/lib/types';

interface TermSelectorProps {
    onTermChange: (termId: string) => void;
}

export default function TermSelector({ onTermChange }: TermSelectorProps) {
    const [terms, setTerms] = useState<AcademicTerm[]>([]);
    const [selectedTerm, setSelectedTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTerms = async () => {
            try {
                const res = await fetch('/api/academic-terms');
                if (!res.ok) throw new Error('Failed to fetch terms');
                const data: AcademicTerm[] = await res.json();
                setTerms(data);
                if (data.length > 0) {
                    // Set default to the latest term
                    const latestTerm = data[0];
                    setSelectedTerm(latestTerm.id);
                    onTermChange(latestTerm.id);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchTerms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const termId = e.target.value;
        setSelectedTerm(termId);
        onTermChange(termId);
    };

    if (loading) {
        return <div className="h-10 bg-gray-200 rounded-md dark:bg-gray-700 w-48 animate-pulse"></div>;
    }

    return (
        <div>
            <label htmlFor="term-select" className="block text-sm font-medium mb-1">
                เลือกภาคเรียน:
            </label>
            <select
                id="term-select"
                value={selectedTerm}
                onChange={handleSelectionChange}
                className="select-field max-w-xs bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            >
                {terms.map(term => (
                    <option key={term.id} value={term.id}>{term.name}</option>
                ))}
            </select>
        </div>
    );
}
