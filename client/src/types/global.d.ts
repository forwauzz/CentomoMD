// TypeScript declarations for Web Speech API
// Extends existing DOM types to include webkit prefix support

declare global {
  interface Window {
    webkitSpeechRecognition: new() => SpeechRecognition;
    webkitSpeechGrammarList: new() => SpeechGrammarList;
  }

  // Additional error event interface for better error handling
  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: 'no-speech' | 'aborted' | 'audio-capture' | 'network' | 'not-allowed' | 'service-not-allowed' | 'bad-grammar' | 'language-not-supported';
    readonly message?: string;
  }
}

export {};