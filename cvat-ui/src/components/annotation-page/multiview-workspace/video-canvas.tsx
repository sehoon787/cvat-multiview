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
    playbackRate?: number;
    onCanvasContainerReady?: (container: HTMLDivElement | null, videoElement: HTMLVideoElement | null) => void;
    onVideoRef?: (viewId: number, video: HTMLVideoElement | null) => void;
}

export default function VideoCanvas(props: Props): JSX.Element {
    const {
        viewId, frameNumber, videoUrl, fps, isActive, playing, playbackRate, onCanvasContainerReady, onVideoRef,
    } = props;

    const videoRef = useRef<HTMLVideoElement>(null);

    // Use callback ref to report video element to parent when mounted
    const videoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
        (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = node;
        if (onVideoRef) {
            onVideoRef(viewId, node);
        }
    }, [viewId, onVideoRef]);

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

    // ALL video control (play/pause/seek) is handled by parent component
    // This component only renders the video element

    return (
        <div className='video-canvas-container'>
            <video
                ref={videoCallbackRef}
                src={videoUrl}
                className='multiview-video'
                playsInline
                crossOrigin="anonymous"
                muted={!isActive}
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
