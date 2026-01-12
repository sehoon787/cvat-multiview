// Copyright (C) 2024 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { useSelector } from 'react-redux';

import { CombinedState } from 'reducers';
import ObjectsListContainer from 'containers/annotation-page/standard-workspace/objects-side-bar/objects-list';

/**
 * MultiviewObjectsList Component
 *
 * Wraps the standard ObjectsListContainer for multiview workspace.
 * Re-renders on frame change to ensure proper filtering of annotations.
 */
export default function MultiviewObjectsList(): JSX.Element {
    // Subscribe to frame changes to force ObjectsListContainer to re-filter
    // This is needed because the connected component doesn't properly re-render on frame change
    const frameNumber = useSelector((state: CombinedState) => state.annotation.player.frame.number);

    return (
        <div className='cvat-multiview-objects-list'>
            {/* Standard objects list - key prop forces re-render on frame change */}
            <ObjectsListContainer key={`objects-list-frame-${frameNumber}`} />

            <style>{`
                .cvat-multiview-objects-list {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }
            `}</style>
        </div>
    );
}
