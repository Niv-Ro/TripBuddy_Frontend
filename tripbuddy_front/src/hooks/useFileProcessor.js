import { useState, useCallback } from 'react';
import { compressImage } from '@/services/imageCompressor';

export function useFileProcessor() {
    const [processedFiles, setProcessedFiles] = useState([]); // Array of processed files
    const [isProcessing, setIsProcessing] = useState(false); // Processing status flag
    const [progress, setProgress] = useState(0); // Progress percentage (0-100)

    const processFiles = useCallback(async (files, options = {}) => {
        setIsProcessing(true);
        setProgress(0);
        setProcessedFiles([]);

        const filesToProcess = Array.from(files);
        const allProcessed = [];
        let completedCount = 0;

        // Process each file
        for (const file of filesToProcess) {
            try {
                const processed = await compressImage(file, options);
                allProcessed.push(processed);
            } catch (error) {
                console.error("Failed to process file:", file.name, error);
                allProcessed.push(file); // Fallback to original file on error
            }
            completedCount++;
            setProgress((completedCount / filesToProcess.length) * 100);
        }

        setProcessedFiles(allProcessed);
        setIsProcessing(false);
        return allProcessed;
    }, []);

    // Reset all state to initial values
    const reset = useCallback(() => {
        setProcessedFiles([]);
        setIsProcessing(false);
        setProgress(0);
    }, []);

    return { processFiles, processedFiles, isProcessing, progress, reset };
}