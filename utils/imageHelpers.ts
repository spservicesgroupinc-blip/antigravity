
/**
 * Resize and compress an image file before uploading to Google Apps Script.
 * This is crucial because GAS has payload limits and raw 12MP photos are too large.
 */
export const compressImage = (file: File, maxWidth = 1600, quality = 0.6): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const elem = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                elem.width = width;
                elem.height = height;
                const ctx = elem.getContext('2d');
                if (!ctx) {
                    reject("Canvas context not available");
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                // Convert to Base64 string (JPEG)
                const dataUrl = elem.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};
