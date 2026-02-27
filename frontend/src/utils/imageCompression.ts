/**
 * Compress an image file to be under the specified size limit
 * @param file - The image file to compress
 * @param maxSizeBytes - Maximum size in bytes (default 400KB)
 * @returns Compressed image file
 */
export async function compressImage(file: File, maxSizeBytes: number = 400 * 1024): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Start with original dimensions
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Try different quality levels
        let quality = 0.9;
        let attempts = 0;
        const maxAttempts = 10;
        
        const tryCompress = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'));
                return;
              }
              
              attempts++;
              
              if (blob.size <= maxSizeBytes) {
                // Success! Create file from blob
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else if (attempts >= maxAttempts) {
                // Failed to compress enough
                reject(new Error(`Unable to compress image below ${maxSizeBytes / 1024}KB after ${maxAttempts} attempts`));
              } else {
                // Try again with lower quality or smaller dimensions
                if (quality > 0.5) {
                  quality -= 0.1;
                } else {
                  // Reduce dimensions by 10%
                  width = Math.floor(width * 0.9);
                  height = Math.floor(height * 0.9);
                  canvas.width = width;
                  canvas.height = height;
                  quality = 0.9; // Reset quality
                }
                tryCompress();
              }
            },
            'image/jpeg',
            quality
          );
        };
        
        tryCompress();
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}
