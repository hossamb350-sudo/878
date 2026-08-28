import { registerPlugin } from '@capacitor/core';

export interface Media3Plugin {
  play(options: { url: string; title: string; artist: string; artwork: string }): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  addListener(
    eventName: 'onPlaybackStateChanged',
    listenerFunc: (state: { isPlaying: boolean; ended?: boolean }) => void,
  ): Promise<any>;
}

export const Media3 = registerPlugin<Media3Plugin>('Media3');
