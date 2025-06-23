import { useState } from 'react';

const useImageProcessor = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [processedImage, setProcessedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    // Simple image processing - just resize, keep aspect ratio
    const processImage = (file, options = {}) => {
        const { maxSize = 400, quality = 0.95 } = options;

        setIsProcessing(true);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Calculate aspect ratio to maintain image proportions
            let { width, height } = img;

            if (width > height) {
                if (width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
            }

            // Set canvas size to actual image size (maintains aspect ratio)
            canvas.width = width;
            canvas.height = height;

            // Draw image maintaining aspect ratio
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to blob with high quality to preserve image
            canvas.toBlob((blob) => {
                const processedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                });

                setProcessedImage(processedFile);
                setImagePreview(URL.createObjectURL(blob));
                setIsProcessing(false);
            }, 'image/jpeg', quality);
        };

        img.src = URL.createObjectURL(file);
    };


    //Makes sure user selected an image, creates a temporary URL to show the image, Compresses and resizes image,  Shows the selected image in the form
    const handleImageChange = (e, options = {}) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Show original image immediately
            setImagePreview(URL.createObjectURL(file));

            // Process image in background
            processImage(file, options);
        }
    };

    // return to default settings
    const resetImage = () => {
        setProcessedImage(null);
        setImagePreview("");
        setIsProcessing(false);
    };

    return {
        isProcessing,
        processedImage,
        imagePreview,
        handleImageChange,
        processImage,
        resetImage
    };
};

export default useImageProcessor;