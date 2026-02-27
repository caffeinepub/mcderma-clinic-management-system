/**
 * Plays a simple notification sound using Web Audio API
 */
export function playNotificationSound(): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create oscillator for a pleasant notification tone
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configure sound: two-tone beep (E5 -> C5)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime + 0.15); // C5
    
    // Envelope: fade in and out
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.15);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
    
    // Clean up
    setTimeout(() => {
      oscillator.disconnect();
      gainNode.disconnect();
      audioContext.close();
    }, 500);
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
}
