// Copyright (C) 2024 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { useState } from 'react';
import Layout from 'antd/lib/layout';

import ControlsSideBarContainer from 'containers/annotation-page/standard-workspace/controls-side-bar/controls-side-bar';
import ObjectSideBarComponent from 'components/annotation-page/standard-workspace/objects-side-bar/objects-side-bar';
import CanvasContextMenuContainer from 'containers/annotation-page/canvas/canvas-context-menu';
import CanvasPointContextMenuComponent from 'components/annotation-page/canvas/views/canvas2d/canvas-point-context-menu';
import RemoveConfirmComponent from 'components/annotation-page/standard-workspace/remove-confirm';
import PropagateConfirmComponent from 'components/annotation-page/standard-workspace/propagate-confirm';

import MultiviewVideoGrid from './multiview-video-grid';
import SpectrogramPanel from './spectrogram-panel';
import MultiviewObjectsList from './multiview-objects-list';
import './styles.scss';

export default function MultiviewWorkspace(): JSX.Element {
    const [activeView, setActiveView] = useState<number>(1);
    const [audioEngine, setAudioEngine] = useState<any>(null);

    // Handle audio engine initialization
    const handleEngineReady = async (engine: any): Promise<void> => {
        setAudioEngine(engine);

        // Wait for video elements to be available and loaded
        const initAudioEngine = async (): Promise<void> => {
            const videoElements = document.querySelectorAll('.multiview-video');
            if (videoElements.length === 5) {
                const videos = Array.from(videoElements) as HTMLVideoElement[];

                // Wait for all videos to have metadata loaded
                await Promise.all(
                    videos.map((video) => new Promise<void>((resolve) => {
                        if (video.readyState >= 1) {
                            resolve();
                        } else {
                            video.addEventListener('loadedmetadata', () => resolve(), { once: true });
                        }
                    })),
                );

                try {
                    await engine.initialize(videos);
                } catch (error) {
                    console.error('Failed to initialize audio engine:', error);
                }
            }
        };

        // Start initialization after a short delay to ensure DOM is ready
        setTimeout(() => {
            initAudioEngine().catch((error: Error) => {
                console.error('Audio engine initialization error:', error);
            });
        }, 100);
    };

    return (
        <Layout hasSider className='cvat-multiview-workspace'>
            <ControlsSideBarContainer />
            <Layout.Content className='cvat-multiview-workspace-content'>
                <MultiviewVideoGrid
                    activeView={activeView}
                    onViewSelect={setActiveView}
                />
                <SpectrogramPanel
                    audioEngine={audioEngine}
                    onEngineReady={handleEngineReady}
                />
            </Layout.Content>
            <ObjectSideBarComponent objectsList={<MultiviewObjectsList />} />
            <CanvasContextMenuContainer />
            <CanvasPointContextMenuComponent />
            <RemoveConfirmComponent />
            <PropagateConfirmComponent />
        </Layout>
    );
}
