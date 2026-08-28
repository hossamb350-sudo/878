import { registerPlugin } from '@capacitor/core';

export interface Media3PlaybackState {
  isPlaying: boolean;
  ended?: boolean;
  mediaType?: 'radio' | 'quran' | string;
  url?: string;
}

export interface Media3Plugin {
  play(options: { 
    url: string; 
    title: string; 
    artist: string; 
    artwork?: string;
    mediaType?: 'radio' | 'quran' | string;
  }): Promise<void>;
  pause(options?: { mediaType?: 'radio' | 'quran' | string }): Promise<void>;
  resume(options?: { mediaType?: 'radio' | 'quran' | string }): Promise<void>;
  stop(options?: { mediaType?: 'radio' | 'quran' | string }): Promise<void>;
  getPlaybackState(): Promise<Media3PlaybackState>;
  addListener(
    eventName: 'onPlaybackStateChanged',
    listenerFunc: (state: Media3PlaybackState) => void,
  ): Promise<any>;
}

export const Media3 = registerPlugin<Media3Plugin>('Media3');

