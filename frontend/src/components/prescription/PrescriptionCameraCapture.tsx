import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, X } from 'lucide-react';
import { useCamera } from '../../camera/useCamera';
import { compressImage } from '../../utils/imageCompression';
import { ExternalBlob } from '../../backend';
import { toast } from 'sonner';

interface PrescriptionCameraCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (blob: ExternalBlob) => void;
}

export default function PrescriptionCameraCapture({
  open,
  onOpenChange,
  onCapture,
}: PrescriptionCameraCaptureProps) {
  const {
    isActive,
    isSupported,
    error,
    isLoading,
    startCamera,
    stopCamera,
    capturePhoto,
    videoRef,
    canvasRef,
  } = useCamera({ facingMode: 'environment' });

  const [capturedImage, setCapturedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleStartCamera = async () => {
    const success = await startCamera();
    if (!success && error) {
      toast.error(`Camera error: ${error.message}`);
    }
  };

  const handleCapture = async () => {
    const photo = await capturePhoto();
    if (!photo) {
      toast.error('Failed to capture photo');
      return;
    }

    setCapturedImage(photo);
    setPreviewUrl(URL.createObjectURL(photo));
  };

  const handleConfirm = async () => {
    if (!capturedImage) return;

    try {
      // Compress image to < 400KB
      const compressed = await compressImage(capturedImage, 400 * 1024);
      
      // Convert to ExternalBlob
      const arrayBuffer = await compressed.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const externalBlob = ExternalBlob.fromBytes(uint8Array);

      onCapture(externalBlob);
      handleClose();
    } catch (error: any) {
      toast.error('Failed to process image', {
        description: error.message || 'Please try again',
      });
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleClose = () => {
    stopCamera();
    handleRetake();
    onOpenChange(false);
  };

  if (isSupported === false) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Camera Not Supported</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Your browser does not support camera access. Please use a different browser or device.
          </p>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Capture Prescription</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!capturedImage ? (
            <>
              {/* Camera Preview */}
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3', minHeight: '300px' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-4 text-center">
                    <div>
                      <p className="font-semibold mb-2">Camera Error</p>
                      <p className="text-sm">{error.message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex gap-2">
                {!isActive ? (
                  <Button
                    onClick={handleStartCamera}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? 'Starting...' : 'Start Camera'}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleCapture}
                      disabled={!isActive}
                      className="flex-1"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Capture
                    </Button>
                    <Button
                      onClick={handleClose}
                      variant="outline"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Image Preview */}
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3', minHeight: '300px' }}>
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Captured prescription"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Preview Controls */}
              <div className="flex gap-2">
                <Button
                  onClick={handleRetake}
                  variant="outline"
                  className="flex-1"
                >
                  Retake
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1"
                >
                  Use This Photo
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
