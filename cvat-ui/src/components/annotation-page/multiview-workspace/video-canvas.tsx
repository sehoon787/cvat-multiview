// Copyright (C) 2024 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { useRef, useEffect, useCallback } from 'react';

interface Props {
    viewId: number;
    frameNumber: number;
    videoUrl: string;
    fps: number;
    isActive: boolean;
    playing: boolean;
    onCanvasContainerReady?: (container: HTMLDivElement | null, videoElement: HTMLVideoElement | null) => void;
}

export default function VideoCanvas(props: Props): JSX.Element {
    const {
        viewId, frameNumber, videoUrl, fps, isActive, playing, onCanvasContainerReady,
    } = props;

    const videoRef = useRef<HTMLVideoElement>(null);

    // Use callback ref to notify parent immediately when DOM element is ready
    const canvasContainerCallbackRef = useCallback((node: HTMLDivElement | null) => {
        if (onCanvasContainerReady) {
            onCanvasContainerReady(node, videoRef.current);
        }
    }, [onCanvasContainerReady, isActive, viewId]);

    // Cleanup when becoming inactive
    useEffect(() => {
        if (!isActive && onCanvasContainerReady) {
            onCanvasContainerReady(null, null);
        }
    }, [isActive, onCanvasContainerReady]);

    // Sync video to frame number when not playing
    useEffect(() => {
        if (videoRef.current && fps > 0 && !playing) {
            const video = videoRef.current;
            const targetTime = frameNumber / fps;

            // Only seek if difference is significant (> 100ms)
            if (Math.abs(video.currentTime - targetTime) > 0.1) {
                video.currentTime = targetTime;
            }
        }
    }, [frameNumber, fps, playing]);

    // Handle play/pause based on playing state
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (playing) {
            video.play().catch((error) => {
                console.warn('Video play failed:', error);
            });
        } else {
            video.pause();
        }
    }, [playing]);

    return (
        <div className='video-canvas-container'>
            <video
                ref={videoRef}
                src={videoUrl}
                className='multiview-video'
                playsInline
                crossOrigin="anonymous"
                muted
            />
            {isActive && (
                <div
                    ref={canvasContainerCallbackRef}
                    className='annotation-canvas-overlay active-canvas'
                />
            )}
            <div className='view-label'>
                View {viewId}
                {isActive && <span className='active-indicator'> (Active)</span>}
            </div>
        </div>
    );
}
