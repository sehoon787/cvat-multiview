// Copyright (C) 2024 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { useSelector } from 'react-redux';

import { CombinedState } from 'reducers';
import ObjectsListContainer from 'containers/annotation-page/standard-workspace/objects-side-bar/objects-list';

interface Props {
    activeView: number;
}

/**
 * MultiviewObjectsList Component
 *
 * Wraps the standard ObjectsListContainer for multiview workspace.
 * Filters annotations by viewId to show only annotations belonging to the active view.
 */
export default function MultiviewObjectsList(props: Props): JSX.Element {
    const { activeView } = props;
    // Subscribe to frame changes to force ObjectsListContainer to re-filter
    // This is needed because the connected component doesn't properly re-render on frame change
    const frameNumber = useSelector((state: CombinedState) => state.annotation.player.frame.number);

    return (
        <div className='cvat-multiview-objects-list'>
            {/* Standard objects list - key prop forces re-render on frame/view change */}
            <ObjectsListContainer
                key={`objects-list-frame-${frameNumber}-view-${activeView}`}
                viewId={activeView}
            />

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
