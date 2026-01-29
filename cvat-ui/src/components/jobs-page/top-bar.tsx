// Copyright (C) 2022 Intel Corporation
// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { Col, Row } from 'antd/lib/grid';
import Input from 'antd/lib/input';
import Button from 'antd/lib/button';
import { ExportOutlined } from '@ant-design/icons';

import { CombinedState, JobsQuery } from 'reducers';
import { exportActions } from 'actions/export-actions';
import { Job } from 'cvat-core-wrapper';
import dimensions from 'utils/dimensions';
import {
    SortingComponent,
    ResourceFilterHOC,
    defaultVisibility,
    ResourceSelectionInfo,
} from 'components/resource-sorting-filtering';
import {
    localStorageRecentKeyword, localStorageRecentCapacity, predefinedFilterValues, config,
} from './jobs-filter-configuration';

const FilteringComponent = ResourceFilterHOC(
    config, localStorageRecentKeyword, localStorageRecentCapacity, predefinedFilterValues,
);

interface Props {
    query: JobsQuery;
    onApplyFilter(filter: string | null): void;
    onApplySorting(sorting: string | null): void;
    onApplySearch(search: string | null): void;
    selectedCount: number;
    onSelectAll: () => void;
    jobs: Job[];
}

function TopBarComponent(props: Readonly<Props>): JSX.Element {
    const dispatch = useDispatch();
    const {
        query, onApplyFilter, onApplySorting, onApplySearch, selectedCount, onSelectAll, jobs,
    } = props;
    const [visibility, setVisibility] = useState(defaultVisibility);

    // Get selected job IDs from Redux
    const selectedIds = useSelector((state: CombinedState) => state.jobs.selected, shallowEqual);

    // Determine if there's a selection
    const hasSelection = selectedIds.length > 0;

    // Get selected jobs
    const selectedJobs = useMemo(() => {
        if (!hasSelection) return [];
        return jobs.filter((job) => selectedIds.includes(job.id));
    }, [jobs, selectedIds, hasSelection]);

    // Only export selected jobs (no "export all" when nothing selected)
    const exportCount = selectedJobs.length;

    // Export handler (selected only)
    const onExport = useCallback(() => {
        if (exportCount === 0) return;
        dispatch(exportActions.openExportDatasetModal(selectedJobs[0]));
    }, [selectedJobs, exportCount, dispatch]);

    // Button label: "Export" when nothing selected, "Export (N)" when selected
    const exportButtonLabel = hasSelection ? `Export (${exportCount})` : 'Export';

    return (
        <Row className='cvat-jobs-page-top-bar' justify='center' align='middle'>
            <Col {...dimensions}>
                <div className='cvat-jobs-page-filters-wrapper'>
                    <div>
                        <Input.Search
                            enterButton
                            onSearch={(phrase: string) => {
                                onApplySearch(phrase);
                            }}
                            defaultValue={query.search ?? ''}
                            className='cvat-jobs-page-search-bar'
                            placeholder='Search ...'
                        />
                        <ResourceSelectionInfo selectedCount={selectedCount} onSelectAll={onSelectAll} />
                    </div>
                    <div>
                        <SortingComponent
                            visible={visibility.sorting}
                            onVisibleChange={(visible: boolean) => (
                                setVisibility({ ...defaultVisibility, sorting: visible })
                            )}
                            defaultFields={query.sort?.split(',') || ['-ID']}
                            sortingFields={['ID', 'Assignee', 'Updated date', 'Stage', 'State', 'Task ID', 'Project ID', 'Task name', 'Project name']}
                            onApplySorting={onApplySorting}
                        />
                        <FilteringComponent
                            value={query.filter}
                            predefinedVisible={visibility.predefined}
                            builderVisible={visibility.builder}
                            recentVisible={visibility.recent}
                            onPredefinedVisibleChange={(visible: boolean) => (
                                setVisibility({ ...defaultVisibility, predefined: visible })
                            )}
                            onBuilderVisibleChange={(visible: boolean) => (
                                setVisibility({ ...defaultVisibility, builder: visible })
                            )}
                            onRecentVisibleChange={(visible: boolean) => (
                                setVisibility({ ...defaultVisibility, builder: visibility.builder, recent: visible })
                            )}
                            onApplyFilter={onApplyFilter}
                        />
                    </div>
                </div>
                <div className='cvat-jobs-page-actions'>
                    <Button
                        className='cvat-export-jobs-button'
                        icon={<ExportOutlined />}
                        onClick={onExport}
                        disabled={!hasSelection}
                    >
                        {exportButtonLabel}
                    </Button>
                </div>
            </Col>
        </Row>
    );
}

export default React.memo(TopBarComponent);
