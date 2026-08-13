import { registerPlugin } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';

export interface RadioPlayerPlugin {
  play(options: { url: string; stationName?: string; artwork?: string }): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  addListener(eventName: 'playing', listenerFunc: () => void): any;
  addListener(eventName: 'paused', listenerFunc: () => void): any;
  addListener(eventName: 'buffering', listenerFunc: () => void): any;
  addListener(eventName: 'stopped', listenerFunc: () => void): any;
  addListener(eventName: 'error', listenerFunc: (info: { error: string }) => void): any;
}

const RadioPlayerNative = registerPlugin<RadioPlayerPlugin>('RadioPlayer');

class RadioPlayerService {
  private isNative = Capacitor.isNativePlatform();
  private listeners: { [key: string]: Function[] } = {
    playing: [],
    paused: [],
    buffering: [],
    stopped: [],
    error: []
  };

  constructor() {
    if (this.isNative) {
      this.setupNativeListeners();
    }
  }

  private setupNativeListeners() {
    RadioPlayerNative.addListener('playing', () => this.emit('playing'));
    RadioPlayerNative.addListener('paused', () => this.emit('paused'));
    RadioPlayerNative.addListener('buffering', () => this.emit('buffering'));
    RadioPlayerNative.addListener('stopped', () => this.emit('stopped'));
    RadioPlayerNative.addListener('error', (info) => this.emit('error', info.error));
  }

  private emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(fn => fn(data));
    }
  }

  on(event: 'playing' | 'paused' | 'buffering' | 'stopped' | 'error', callback: Function) {
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(fn => fn !== callback);
    };
  }

  async play(url: string, stationName?: string, artwork?: string) {
    if (this.isNative) {
      console.log("[RadioPlayer] play native:", url);
      await RadioPlayerNative.play({ url, stationName, artwork });
    }
    // Web player is handled by HTML5 audio directly in LiveStreamContext
  }

  async pause() {
    if (this.isNative) {
      console.log("[RadioPlayer] pause native");
      await RadioPlayerNative.pause();
    }
  }

  async stop() {
    if (this.isNative) {
      console.log("[RadioPlayer] stop native");
      await RadioPlayerNative.stop();
    }
  }

  get isNativeMode() {
    return this.isNative;
  }
}

export const radioPlayer = new RadioPlayerService();
