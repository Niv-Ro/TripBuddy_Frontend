import { useState, useCallback } from 'react';
import { compressImage } from '@/services/imageCompressor';

export function useFileProcessor() {
    const [processedFiles, setProcessedFiles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const processFiles = useCallback(async (files, options = {}) => {
        setIsProcessing(true); //flag to acknowledge start working
        setProgress(0);
        setProcessedFiles([]);

        const filesToProcess = Array.from(files); // convert to array if more than one file
        const allProcessed = [];
        let completedCount = 0;

        for (const file of filesToProcess) {
            try {
                const processed = await compressImage(file, options);
                allProcessed.push(processed);
            } catch (error) {
                console.error("Failed to process file:", file.name, error);
                allProcessed.push(file); // In case of error, add the original file
            }
            completedCount++;
            setProgress((completedCount / filesToProcess.length) * 100);
        }

        setProcessedFiles(allProcessed); //set final array og files
        setIsProcessing(false); //notify process is done
        return allProcessed; // return the files for immediate use if needed
    }, []);

    const reset = useCallback(() => {
        setProcessedFiles([]);
        setIsProcessing(false);
        setProgress(0);
    }, []);

    return { processFiles, processedFiles, isProcessing, progress, reset };
}