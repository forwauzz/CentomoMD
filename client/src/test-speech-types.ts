// Test file to validate Web Speech API TypeScript declarations
// This file should compile without errors if the types are working correctly

export function testSpeechRecognitionTypes() {
  if (typeof window !== 'undefined') {
    // Test that the types are available
    const recognition: SpeechRecognition = new window.webkitSpeechRecognition();
    
    // Test properties
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    // Test event handlers with proper types
    recognition.onstart = (event: Event) => {
      console.log('Speech recognition started');
    };
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = 0; i < event.results.length; i++) {
        const result: SpeechRecognitionResult = event.results[i];
        if (result.isFinal) {
          const alternative: SpeechRecognitionAlternative = result[0];
          console.log('Transcript:', alternative.transcript);
          console.log('Confidence:', alternative.confidence);
        }
      }
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      console.error('Error message:', event.message);
    };
    
    recognition.onend = (event: Event) => {
      console.log('Speech recognition ended');
    };
    
    // Test methods
    recognition.start();
    recognition.stop();
    recognition.abort();
    
    return true;
  }
  
  return false;
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