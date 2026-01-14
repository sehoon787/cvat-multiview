// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import { getCVATStore } from 'cvat-store';
import { CombinedState, Workspace } from 'reducers';
import { ObjectState, ObjectType } from 'cvat-core-wrapper';

export interface FilterAnnotationsParams {
    workspace: Workspace;
    exclude?: ObjectType[];
    include?: ObjectType[];
    frame?: number;
    viewId?: number | null;
}

export function filterAnnotations(annotations: ObjectState[], params: FilterAnnotationsParams): ObjectState[] {
    const {
        workspace, exclude, include, frame, viewId,
    } = params;

    if (Array.isArray(exclude) && Array.isArray(include)) {
        throw Error('Can not filter annotations with exclude and include filters simultaneously');
    }

    const store = getCVATStore();
    const state: CombinedState = store.getState();
    const {
        meta,
        instance: job,
        groundTruthInfo: { groundTruthJobFramesMeta },
    } = state.annotation.job;

    const filteredAnnotations = annotations.filter((objectState) => {
        if (Array.isArray(exclude) && exclude.includes(objectState.objectType)) {
            return false;
        }

        if (Array.isArray(include) && !include.includes(objectState.objectType)) {
            return false;
        }

        // SHAPE annotations only exist on a single frame
        // Filter out SHAPEs that don't belong to the current frame
        if (objectState.objectType === ObjectType.SHAPE && frame !== undefined) {
            if (objectState.frame !== frame) {
                return false;
            }
        }

        // Filter by viewId for Multiview workspace
        // Annotations without viewId are shown only in View 1 (for backward compatibility)
        if (viewId !== undefined && viewId !== null && workspace === Workspace.MULTIVIEW) {
            const stateViewId = (objectState as any).viewId;
            if (stateViewId === null || stateViewId === undefined) {
                // Annotations without viewId are shown only in View 1
                if (viewId !== 1) {
                    return false;
                }
            } else if (stateViewId !== viewId) {
                return false;
            }
        }

        // GT tracks are shown only on GT frames in annotation jobs
        if (meta && job && workspace === Workspace.REVIEW && groundTruthJobFramesMeta?.includedFrames && frame) {
            if (objectState.objectType === ObjectType.TRACK && objectState.isGroundTruth) {
                // includedFrames has absolute numeration of frames, current frame is in job coordinates
                const dataFrameNumber = meta.getDataFrameNumber(frame - job.startFrame);
                return groundTruthJobFramesMeta.includedFrames.includes(dataFrameNumber);
            }
        }

        return true;
    });
    return filteredAnnotations;
}
