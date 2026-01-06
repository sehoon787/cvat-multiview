// Copyright (C) 2024 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { Canvas } from 'cvat-canvas-wrapper';
import { CombinedState, ActiveControl, Workspace } from 'reducers';
import { getCore, ObjectState, ObjectType, ShapeType } from 'cvat-core-wrapper';
import {
    createAnnotationsAsync,
    updateActiveControl as updateActiveControlAction,
    confirmCanvasReadyAsync,
    resetCanvas,
} from 'actions/annotation-actions';
import { filterAnnotations } from 'utils/filter-annotations';

const cvat = getCore();

interface Props {
    canvasContainer: HTMLDivElement | null;
    videoElement: HTMLVideoElement | null;
    activeViewId: number;
}

export default function MultiviewCanvasWrapper(props: Props): JSX.Element | null {
    const { canvasContainer, videoElement, activeViewId } = props;
    const dispatch = useDispatch();
    const mountedRef = useRef(false);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    // Redux state selectors
    const canvasInstance = useSelector((state: CombinedState) => state.annotation.canvas.instance) as Canvas | null;
    const jobInstance = useSelector((state: CombinedState) => state.annotation.job.instance);
    const frameNumber = useSelector((state: CombinedState) => state.annotation.player.frame.number);
    const frameData = useSelector((state: CombinedState) => state.annotation.player.frame.data);
    const annotations = useSelector((state: CombinedState) => state.annotation.annotations.states);
    const activeLabelID = useSelector((state: CombinedState) => state.annotation.drawing.activeLabelID);
    const activeObjectType = useSelector((state: CombinedState) => state.annotation.drawing.activeObjectType);
    const curZLayer = useSelector((state: CombinedState) => state.annotation.annotations.zLayer.cur);
    const workspace = useSelector((state: CombinedState) => state.annotation.workspace);
    const activeControl = useSelector((state: CombinedState) => state.annotation.activeControl);

    // Use refs for values that change frequently but shouldn't cause remount
    const stateRefs = useRef({
        activeLabelID,
        activeObjectType,
        frameNumber,
        activeViewId,
        jobInstance,
        annotations,
        curZLayer,
        frameData,
        workspace,
    });

    // Update refs when values change
    useEffect(() => {
        stateRefs.current = {
            activeLabelID,
            activeObjectType,
            frameNumber,
            activeViewId,
            jobInstance,
            annotations,
            curZLayer,
            frameData,
            workspace,
        };
    }, [activeLabelID, activeObjectType, frameNumber, activeViewId, jobInstance, annotations, curZLayer, frameData, workspace]);

    /**
     * Handle shape drawn event - create annotation with viewId
     */
    const onCanvasShapeDrawn = useCallback((event: any): void => {
        const refs = stateRefs.current;
        if (!refs.jobInstance || !canvasInstance) return;

        const { state } = event.detail;

        if (!event.detail.continue) {
            dispatch(updateActiveControlAction(ActiveControl.CURSOR));
        }

        // Set annotation properties
        state.objectType = state.shapeType === ShapeType.MASK
            ? ObjectType.SHAPE : state.objectType ?? refs.activeObjectType;
        state.label = state.label || refs.jobInstance.labels.find((label: any) => label.id === refs.activeLabelID);
        state.frame = refs.frameNumber;
        state.rotation = state.rotation || 0;
        state.occluded = state.occluded || false;
        state.outside = state.outside || false;
        state.hidden = state.hidden || false;

        // Add viewId attribute to track which view this annotation belongs to
        state.attributes = state.attributes || {};
        state.description = `viewId:${refs.activeViewId}`;

        const objectState = new cvat.classes.ObjectState(state);
        dispatch(createAnnotationsAsync([objectState]));
    }, [canvasInstance, dispatch]);

    /**
     * Handle canvas setup complete
     */
    const onCanvasSetup = useCallback((): void => {
        dispatch(confirmCanvasReadyAsync());
    }, [dispatch]);

    /**
     * Handle canvas cancel
     */
    const onCanvasCancel = useCallback((): void => {
        dispatch(resetCanvas());
    }, [dispatch]);

    /**
     * Handle canvas zoom start - sync with Redux activeControl
     */
    const onCanvasZoomStart = useCallback((): void => {
        dispatch(updateActiveControlAction(ActiveControl.ZOOM_CANVAS));
    }, [dispatch]);

    /**
     * Handle canvas zoom done - reset to cursor mode
     */
    const onCanvasZoomDone = useCallback((): void => {
        dispatch(updateActiveControlAction(ActiveControl.CURSOR));
    }, [dispatch]);

    /**
     * Handle canvas drag start - sync with Redux activeControl
     */
    const onCanvasDragStart = useCallback((): void => {
        dispatch(updateActiveControlAction(ActiveControl.DRAG_CANVAS));
    }, [dispatch]);

    /**
     * Handle canvas drag done - reset to cursor mode
     */
    const onCanvasDragDone = useCallback((): void => {
        dispatch(updateActiveControlAction(ActiveControl.CURSOR));
    }, [dispatch]);

    /**
     * Mount canvas to container - only depends on container and canvas instance
     */
    useEffect(() => {
        if (!canvasContainer || !canvasInstance) return;

        // Clear container first
        while (canvasContainer.firstChild) {
            canvasContainer.removeChild(canvasContainer.firstChild);
        }

        // Mount canvas HTML to container
        const canvasHTML = canvasInstance.html();
        canvasContainer.appendChild(canvasHTML);
        mountedRef.current = true;

        // Reset all canvas modes to IDLE - aggressively handle any stuck mode
        const currentMode = canvasInstance.mode();
        if (currentMode === 'zoom_canvas') {
            try {
                canvasInstance.zoomCanvas(false);
            } catch (e) {
                // Fallback: just cancel
            }
        } else if (currentMode === 'drag_canvas') {
            try {
                canvasInstance.dragCanvas(false);
            } catch (e) {
                // Fallback: just cancel
            }
        }
        canvasInstance.cancel();

        // Configure canvas for multiview mode
        canvasInstance.configure({
            forceDisableEditing: stateRefs.current.workspace === Workspace.REVIEW,
        });

        // Fit canvas to container size
        canvasInstance.fitCanvas();

        // Add event listeners
        canvasHTML.addEventListener('canvas.drawn', onCanvasShapeDrawn);
        canvasHTML.addEventListener('canvas.setup', onCanvasSetup);
        canvasHTML.addEventListener('canvas.canceled', onCanvasCancel);
        canvasHTML.addEventListener('canvas.zoomstart', onCanvasZoomStart);
        canvasHTML.addEventListener('canvas.zoomstop', onCanvasZoomDone);
        canvasHTML.addEventListener('canvas.dragstart', onCanvasDragStart);
        canvasHTML.addEventListener('canvas.dragstop', onCanvasDragDone);

        // Setup ResizeObserver to handle container resize
        if (resizeObserverRef.current) {
            resizeObserverRef.current.disconnect();
        }
        resizeObserverRef.current = new ResizeObserver(() => {
            if (mountedRef.current && canvasInstance) {
                canvasInstance.fitCanvas();
            }
        });
        resizeObserverRef.current.observe(canvasContainer);

        // Initial setup with current frame data
        if (stateRefs.current.frameData) {
            const filteredAnnotations = filterAnnotations(stateRefs.current.annotations, {
                frame: stateRefs.current.frameNumber,
                workspace: stateRefs.current.workspace,
                exclude: [ObjectType.TAG],
            }).filter((state: ObjectState) => {
                const desc = state.description || '';
                return desc.includes(`viewId:${stateRefs.current.activeViewId}`) || !desc.includes('viewId:');
            });

            canvasInstance.setup(stateRefs.current.frameData, filteredAnnotations, stateRefs.current.curZLayer);
        }

        return () => {
            // Cancel any active drawing when unmounting
            canvasInstance.cancel();

            // Remove event listeners on cleanup
            canvasHTML.removeEventListener('canvas.drawn', onCanvasShapeDrawn);
            canvasHTML.removeEventListener('canvas.setup', onCanvasSetup);
            canvasHTML.removeEventListener('canvas.canceled', onCanvasCancel);
            canvasHTML.removeEventListener('canvas.zoomstart', onCanvasZoomStart);
            canvasHTML.removeEventListener('canvas.zoomstop', onCanvasZoomDone);
            canvasHTML.removeEventListener('canvas.dragstart', onCanvasDragStart);
            canvasHTML.removeEventListener('canvas.dragstop', onCanvasDragDone);

            // Disconnect resize observer
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
                resizeObserverRef.current = null;
            }

            mountedRef.current = false;
        };
    }, [canvasContainer, canvasInstance, activeViewId, onCanvasShapeDrawn, onCanvasSetup, onCanvasCancel, onCanvasZoomStart, onCanvasZoomDone, onCanvasDragStart, onCanvasDragDone]);

    /**
     * Setup canvas with frame data when frame or annotations change
     */
    useEffect(() => {
        if (!canvasInstance || !frameData || !mountedRef.current) {
            return;
        }

        // Filter annotations for current view and exclude tags
        const filteredAnnotations = filterAnnotations(annotations, {
            frame: frameNumber,
            workspace,
            exclude: [ObjectType.TAG],
        }).filter((state: ObjectState) => {
            const desc = state.description || '';
            return desc.includes(`viewId:${activeViewId}`) || !desc.includes('viewId:');
        });

        canvasInstance.setup(frameData, filteredAnnotations, curZLayer);
    }, [canvasInstance, frameData, annotations, curZLayer, activeViewId, frameNumber, workspace]);

    /**
     * Reset canvas mode when activeControl changes to a draw mode
     * This fixes "Canvas is busy" error by forcing canvas to IDLE before draw
     */
    useEffect(() => {
        if (!canvasInstance || !mountedRef.current) return;

        // Check if activeControl is a draw mode
        const isDrawMode = typeof activeControl === 'string' && activeControl.startsWith('draw_');

        if (isDrawMode) {
            // Force canvas to IDLE mode before drawing
            // Call cancel multiple times to ensure mode is reset
            canvasInstance.cancel();

            // If still not in idle mode, try direct mode reset approaches
            const mode = canvasInstance.mode();
            if (mode !== 'idle') {
                // Try canceling specific modes
                if (mode === 'zoom_canvas') {
                    try {
                        canvasInstance.zoomCanvas(false);
                    } catch (e) {
                        // Mode might have already changed, ignore
                    }
                } else if (mode === 'drag_canvas') {
                    try {
                        canvasInstance.dragCanvas(false);
                    } catch (e) {
                        // Mode might have already changed, ignore
                    }
                }
                // Final cancel to ensure IDLE
                canvasInstance.cancel();
            }
        }
    }, [activeControl, canvasInstance]);

    // This component doesn't render anything - it just manages the canvas
    return null;
}
