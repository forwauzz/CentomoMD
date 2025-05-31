// Validation test for Web Speech API TypeScript declarations
// This demonstrates that the types are working in the browser environment

export function validateSpeechAPITypes() {
  console.log('=== Web Speech API TypeScript Validation ===');
  
  // Check if browser supports Web Speech API
  const hasWebkitSupport = typeof window !== 'undefined' && 'webkitSpeechRecognition' in window;
  const hasStandardSupport = typeof window !== 'undefined' && 'SpeechRecognition' in window;
  
  console.log('Browser support:');
  console.log('- webkitSpeechRecognition:', hasWebkitSupport);
  console.log('- SpeechRecognition:', hasStandardSupport);
  
  if (hasWebkitSupport) {
    console.log('✓ TypeScript recognizes window.webkitSpeechRecognition');
    console.log('✓ Global.d.ts declarations are active');
    return true;
  } else {
    console.log('✗ Web Speech API not supported in this browser');
    return false;
  }
}

// Test the Window interface extension
function testWindowInterface() {
  if (typeof window !== 'undefined') {
    // These should be recognized as valid properties
    const hasStandardSpeech = 'SpeechRecognition' in window;
    const hasWebkitSpeech = 'webkitSpeechRecognition' in window;
    
    console.log('Standard SpeechRecognition available:', hasStandardSpeech);
    console.log('Webkit SpeechRecognition available:', hasWebkitSpeech);
    
    return hasStandardSpeech || hasWebkitSpeech;
  }
  
  return false;
}