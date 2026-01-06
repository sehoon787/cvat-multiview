// Copyright (C) 2024 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Button from 'antd/lib/button';
import Slider from 'antd/lib/slider';
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';

import { CombinedState } from 'reducers';
import { changeFrameAsync } from 'actions/annotation-actions';
import { MultiviewAudioEngine } from './audio-engine';

interface Props {
    audioEngine: MultiviewAudioEngine | null;
    onEngineReady?: (engine: MultiviewAudioEngine) => void;
}

export default function SpectrogramPanel(props: Props): JSX.Element {
    const { audioEngine: externalEngine, onEngineReady } = props;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const spectrogramDataRef = useRef<number[][]>([]);

    const [audioEngine, setAudioEngine] = useState<MultiviewAudioEngine | null>(externalEngine);
    const [isInitialized, setIsInitialized] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(false);

    const dispatch = useDispatch();
    const frameNumber = useSelector((state: CombinedState) => state.annotation.player.frame.number);
    const playing = useSelector((state: CombinedState) => state.annotation.player.playing);
    const job = useSelector((state: CombinedState) => state.annotation.job.instance);

    const fps = 30; // TODO: Get actual FPS from job metadata
    const currentTime = frameNumber / fps;
    const duration = job ? (job.stopFrame - job.startFrame) / fps : 100;

    // Initialize audio engine when component mounts
    useEffect(() => {
        if (!audioEngine && !isInitialized) {
            const engine = new MultiviewAudioEngine();
            setAudioEngine(engine);

            if (onEngineReady) {
                onEngineReady(engine);
            }
        }
    }, [audioEngine, isInitialized, onEngineReady]);

    // Start/stop spectrogram rendering based on playing state
    useEffect(() => {
        if (playing && audioEngine?.isInitialized()) {
            startRendering();
        } else {
            stopRendering();
        }

        return () => {
            stopRendering();
        };
    }, [playing, audioEngine]);

    /**
     * Start real-time spectrogram rendering
     */
    const startRendering = (): void => {
        if (animationFrameRef.current !== null) {
            return;
        }

        const render = (): void => {
            if (!canvasRef.current || !audioEngine) {
                return;
            }

            const freqData = audioEngine.getFrequencyData();
            if (freqData) {
                // Add new frequency data column
                spectrogramDataRef.current.push(Array.from(freqData));

                // Limit history to canvas width (scrolling spectrogram)
                const maxColumns = canvasRef.current.width;
                if (spectrogramDataRef.current.length > maxColumns) {
                    spectrogramDataRef.current.shift();
                }

                // Draw spectrogram
                drawSpectrogram();
            }

            animationFrameRef.current = requestAnimationFrame(render);
        };

        animationFrameRef.current = requestAnimationFrame(render);
    };

    /**
     * Stop spectrogram rendering
     */
    const stopRendering = (): void => {
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
    };

    /**
     * Draw spectrogram on canvas
     */
    const drawSpectrogram = (): void => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = canvas;
        const data = spectrogramDataRef.current;

        // Clear canvas
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);

        if (data.length === 0) {
            return;
        }

        // Draw spectrogram columns
        const columnWidth = Math.max(1, width / data.length);
        const frequencyBinCount = data[0].length;
        const barHeight = height / frequencyBinCount;

        data.forEach((column, columnIndex) => {
            const x = columnIndex * columnWidth;

            column.forEach((value, frequencyIndex) => {
                // Invert Y axis (low frequencies at bottom)
                const y = height - (frequencyIndex + 1) * barHeight;

                // Color mapping: blue (low) -> green -> yellow -> red (high)
                const intensity = value / 255;
                let hue: number;
                let saturation: number;
                let lightness: number;

                if (intensity < 0.1) {
                    // Very low: dark blue/black
                    hue = 240;
                    saturation = 100;
                    lightness = intensity * 200; // 0-20%
                } else if (intensity < 0.4) {
                    // Low: blue to cyan
                    hue = 240 - (intensity - 0.1) * 200; // 240 -> 180
                    saturation = 100;
                    lightness = 30 + intensity * 50;
                } else if (intensity < 0.7) {
                    // Medium: cyan to yellow
                    hue = 180 - (intensity - 0.4) * 300; // 180 -> 60
                    saturation = 100;
                    lightness = 50;
                } else {
                    // High: yellow to red
                    hue = 60 - (intensity - 0.7) * 200; // 60 -> 0
                    saturation = 100;
                    lightness = 50 + (intensity - 0.7) * 50;
                }

                ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                ctx.fillRect(x, y, columnWidth + 1, barHeight + 1);
            });
        });

        // Draw playback position marker (vertical red line)
        if (duration > 0) {
            const markerX = (currentTime / duration) * width;
            ctx.strokeStyle = '#ff4d4d';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(markerX, 0);
            ctx.lineTo(markerX, height);
            ctx.stroke();

            // Draw time label
            ctx.fillStyle = 'rgba(255, 77, 77, 0.9)';
            ctx.font = '12px monospace';
            const timeLabel = `${currentTime.toFixed(2)}s`;
            const labelWidth = ctx.measureText(timeLabel).width;
            const labelX = Math.min(markerX + 5, width - labelWidth - 5);
            ctx.fillText(timeLabel, labelX, 15);
        }

        // Draw frequency labels
        ctx.fillStyle = '#999';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        const sampleRate = audioEngine?.getAnalyser()?.context.sampleRate || 44100;
        const maxFreq = sampleRate / 2;

        // Draw 5 frequency markers
        for (let i = 0; i <= 4; i += 1) {
            const freq = (maxFreq * i) / 4;
            const y = height - (i * height) / 4;
            ctx.fillText(`${(freq / 1000).toFixed(1)}kHz`, width - 5, y - 2);
        }
    };

    /**
     * Handle canvas click for seeking
     */
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>): void => {
        const canvas = canvasRef.current;
        if (!canvas || !job) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const seekTime = (x / canvas.width) * duration;
        const targetFrame = Math.floor(seekTime * fps) + job.startFrame;

        dispatch(changeFrameAsync(targetFrame));
    };

    /**
     * Enable audio and initialize engine with video elements
     */
    const handleEnableAudio = async (): Promise<void> => {
        if (!audioEngine || isInitialized) return;

        try {
            // Get all video elements from the page
            const videoElements = Array.from(
                document.querySelectorAll('.multiview-video'),
            ) as HTMLVideoElement[];

            if (videoElements.length !== 5) {
                console.warn(`Expected 5 videos, found ${videoElements.length}`);
                return;
            }

            await audioEngine.initialize(videoElements);
            await audioEngine.resume();
            setIsInitialized(true);
            setAudioEnabled(true);
        } catch (error) {
            console.error('Failed to enable audio:', error);
        }
    };

    /**
     * Toggle audio on/off
     */
    const handleToggleAudio = async (): Promise<void> => {
        if (!audioEngine) return;

        if (audioEnabled) {
            await audioEngine.suspend();
            setAudioEnabled(false);
        } else {
            await audioEngine.resume();
            setAudioEnabled(true);
        }
    };

    return (
        <div className='spectrogram-panel'>
            <div className='spectrogram-header'>
                <div className='spectrogram-title'>
                    <h3>Audio Spectrogram</h3>
                    {isInitialized && (
                        <span className='spectrogram-status'>
                            {audioEnabled ? 'Audio Enabled' : 'Audio Muted'}
                        </span>
                    )}
                </div>
                <div className='spectrogram-controls'>
                    {!isInitialized ? (
                        <Button
                            type='primary'
                            icon={<PlayCircleOutlined />}
                            onClick={handleEnableAudio}
                            size='small'
                        >
                            Enable Audio
                        </Button>
                    ) : (
                        <Button
                            type='default'
                            icon={audioEnabled ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                            onClick={handleToggleAudio}
                            size='small'
                        >
                            {audioEnabled ? 'Mute' : 'Unmute'}
                        </Button>
                    )}
                </div>
            </div>
            <canvas
                ref={canvasRef}
                className='spectrogram-canvas'
                width={1920}
                height={180}
                onClick={handleCanvasClick}
                title='Click to seek'
            />
            {!isInitialized && (
                <div className='spectrogram-placeholder'>
                    <p>Click &quot;Enable Audio&quot; to start audio mixing and visualization</p>
                    <p>Audio from all 5 video streams will be merged in real-time</p>
                </div>
            )}
        </div>
    );
}
