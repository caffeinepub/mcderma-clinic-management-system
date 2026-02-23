import { normalizePhone } from './phone';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

/**
 * Send prescription via WhatsApp
 * For typed prescriptions: opens WhatsApp with prefilled message
 * For image prescriptions: opens patient's WhatsApp chat directly with image pre-attached using Web Share API
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
    // Image prescription - use Web Share API to open WhatsApp with image pre-attached
    const imageUrl = content.getDirectURL();
    
    try {
      // Fetch the image as a blob for sharing
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'prescription.jpg', { type: 'image/jpeg' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        // Web Share API with files is supported - this will open WhatsApp with image pre-attached
        await navigator.share({
          files: [file],
          title: `Prescription for ${patientName}`,
          text: `Prescription from ${clinicName}`,
        });
        toast.success('Opening WhatsApp with prescription');
      } else {
        // Fallback: open WhatsApp chat directly and provide download link
        const whatsappUrl = `https://wa.me/${normalizedPhone}`;
        window.open(whatsappUrl, '_blank');
        
        // Also open the image in a new tab for easy download and manual sharing
        setTimeout(() => {
          window.open(imageUrl, '_blank');
        }, 500);
        
        toast.info('Opening WhatsApp chat. Please download and share the prescription image manually.');
      }
    } catch (error) {
      console.error('Failed to share prescription:', error);
      
      // Final fallback: just open WhatsApp chat
      const whatsappUrl = `https://wa.me/${normalizedPhone}`;
      window.open(whatsappUrl, '_blank');
      
      toast.error('Could not share image automatically. Opening WhatsApp chat.');
    }
  }
}
