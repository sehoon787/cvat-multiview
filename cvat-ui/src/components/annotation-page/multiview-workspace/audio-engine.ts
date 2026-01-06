// Copyright (C) 2024 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

/**
 * MultiviewAudioEngine
 *
 * Manages audio mixing from multiple video sources and provides
 * real-time frequency analysis for spectrogram visualization.
 *
 * Uses Web Audio API to:
 * - Create MediaElementAudioSourceNode for each video
 * - Mix all sources into stereo output
 * - Provide FFT analysis via AnalyserNode
 */

export class MultiviewAudioEngine {
    private audioContext: AudioContext | null = null;
    private videoSources: MediaElementAudioSourceNode[] = [];
    private merger: ChannelMergerNode | null = null;
    private analyser: AnalyserNode | null = null;
    private gainNodes: GainNode[] = [];
    private initialized = false;

    constructor() {
        // AudioContext will be created on first user interaction
        // to comply with browser autoplay policies
    }

    /**
     * Initialize the audio engine with video elements
     * Must be called after user interaction
     */
    public async initialize(videoElements: HTMLVideoElement[]): Promise<void> {
        if (this.initialized) {
            return;
        }

        if (videoElements.length !== 5) {
            throw new Error('MultiviewAudioEngine requires exactly 5 video elements');
        }

        try {
            // Create AudioContext
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            // Create merger node (stereo output)
            this.merger = this.audioContext.createChannelMerger(2);

            // Create analyser for FFT
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;
            this.analyser.minDecibels = -90;
            this.analyser.maxDecibels = -10;

            // Connect merger to analyser to destination
            this.merger.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            // Attach each video to the audio graph
            videoElements.forEach((video, index) => {
                this.attachVideo(video, index);
            });

            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize audio engine:', error);
            throw error;
        }
    }

    /**
     * Attach a video element to the audio mixing graph
     */
    private attachVideo(video: HTMLVideoElement, index: number): void {
        if (!this.audioContext || !this.merger) {
            throw new Error('Audio engine not initialized');
        }

        try {
            // Create source from video element
            const source = this.audioContext.createMediaElementSource(video);

            // Create gain node for volume control (20% each to prevent clipping)
            const gain = this.audioContext.createGain();
            gain.gain.value = 0.2;

            // Connect: source -> gain -> merger (both left and right channels)
            source.connect(gain);
            gain.connect(this.merger, 0, 0); // to left channel
            gain.connect(this.merger, 0, 1); // to right channel

            this.videoSources.push(source);
            this.gainNodes.push(gain);
        } catch (error) {
            // If video already has a source, this will throw
            // In that case, skip this video
            console.warn(`Could not attach video ${index}:`, error);
        }
    }

    /**
     * Get frequency data for spectrogram visualization
     * Returns Uint8Array with frequency bin values (0-255)
     */
    public getFrequencyData(): Uint8Array | null {
        if (!this.analyser) {
            return null;
        }

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);
        return dataArray;
    }

    /**
     * Get time domain data (waveform)
     */
    public getTimeDomainData(): Uint8Array | null {
        if (!this.analyser) {
            return null;
        }

        const dataArray = new Uint8Array(this.analyser.fftSize);
        this.analyser.getByteTimeDomainData(dataArray);
        return dataArray;
    }

    /**
     * Set volume for a specific view (0-5)
     */
    public setViewVolume(viewIndex: number, volume: number): void {
        if (viewIndex >= 0 && viewIndex < this.gainNodes.length) {
            this.gainNodes[viewIndex].gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    /**
     * Get the analyser node for direct access
     */
    public getAnalyser(): AnalyserNode | null {
        return this.analyser;
    }

    /**
     * Resume audio context (needed after browser suspends it)
     */
    public async resume(): Promise<void> {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    /**
     * Suspend audio context
     */
    public async suspend(): Promise<void> {
        if (this.audioContext && this.audioContext.state === 'running') {
            await this.audioContext.suspend();
        }
    }

    /**
     * Get current audio context state
     */
    public getState(): AudioContextState | null {
        return this.audioContext?.state || null;
    }

    /**
     * Check if engine is initialized
     */
    public isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Get FFT size (number of frequency bins * 2)
     */
    public getFFTSize(): number {
        return this.analyser?.fftSize || 0;
    }

    /**
     * Get frequency bin count (half of FFT size)
     */
    public getFrequencyBinCount(): number {
        return this.analyser?.frequencyBinCount || 0;
    }

    /**
     * Cleanup and disconnect all audio nodes
     */
    public dispose(): void {
        this.videoSources.forEach((source) => {
            source.disconnect();
        });

        this.gainNodes.forEach((gain) => {
            gain.disconnect();
        });

        if (this.merger) {
            this.merger.disconnect();
        }

        if (this.analyser) {
            this.analyser.disconnect();
        }

        if (this.audioContext) {
            this.audioContext.close();
        }

        this.videoSources = [];
        this.gainNodes = [];
        this.merger = null;
        this.analyser = null;
        this.audioContext = null;
        this.initialized = false;
    }
}
