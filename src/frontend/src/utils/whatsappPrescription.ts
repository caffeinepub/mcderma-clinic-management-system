import { normalizePhone } from './phone';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

/**
 * Send prescription via WhatsApp
 * For typed prescriptions: opens WhatsApp with prefilled message
 * For image prescriptions: attempts Web Share API, falls back to manual flow
 */
export async function sendPrescriptionViaWhatsApp(
  mobile: string,
  patientName: string,
  content: string | ExternalBlob,
  clinicName: string
): Promise<void> {
  const normalizedPhone = normalizePhone(mobile);
  
  if (typeof content === 'string') {
    // Typed prescription - send as text message
    const message = encodeURIComponent(
      `Hello ${patientName},\n\nHere is your prescription from ${clinicName}:\n\n${content}\n\nPlease follow the instructions carefully. Contact us if you have any questions.`
    );
    
    const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    toast.success('Opening WhatsApp...');
  } else {
    // Image prescription - try Web Share API with files
    const imageUrl = content.getDirectURL();
    
    try {
      // Try to fetch the image as a blob for sharing
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'prescription.jpg', { type: 'image/jpeg' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        // Web Share API with files is supported
        await navigator.share({
          title: 'Prescription',
          text: `Prescription for ${patientName} from ${clinicName}`,
          files: [file],
        });
        toast.success('Prescription shared successfully');
      } else {
        // Fallback: open WhatsApp with text and provide download link
        const message = encodeURIComponent(
          `Hello ${patientName},\n\nYour prescription from ${clinicName} is ready.\n\nPlease download the prescription image and share it with us if needed.`
        );
        
        const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${message}`;
        window.open(whatsappUrl, '_blank');
        
        // Also open the image in a new tab for easy download
        window.open(imageUrl, '_blank');
        
        toast.info('Opening WhatsApp and prescription image. Please download and share the image manually.');
      }
    } catch (error) {
      console.error('Failed to share prescription:', error);
      
      // Final fallback: just open WhatsApp with text
      const message = encodeURIComponent(
        `Hello ${patientName},\n\nYour prescription from ${clinicName} is ready. Please contact us to receive it.`
      );
      
      const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${message}`;
      window.open(whatsappUrl, '_blank');
      
      toast.error('Could not share image automatically. Opening WhatsApp with message.');
    }
  }
}
