export function compressImage(file, options = {}) {
    return new Promise((resolve, reject) => {
        const { maxWidth = 1200, maxHeight = 1200, quality = 0.8 } = options;

        // Skip compression for non-image files
        if (!file.type.startsWith('image/')) {
            resolve(file);
            return;
        }

        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Calculate new dimensions while maintaining aspect ratio
            let { width, height } = img;
            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }

            // Set canvas size and draw resized image
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Convert canvas to compressed file
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], `compressed_${file.name}`, { type: 'image/jpeg' });
                        resolve(compressedFile);
                    } else {
                        reject(new Error('Canvas toBlob failed'));
                    }
                },
                'image/jpeg',
                quality
            );

            // Clean up object URL
            URL.revokeObjectURL(img.src);
        };

        img.onerror = (error) => {
            URL.revokeObjectURL(img.src); // Clean up on error
            reject(error);
        };
    });
}