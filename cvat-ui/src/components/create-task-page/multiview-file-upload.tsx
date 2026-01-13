// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { Row, Col } from 'antd/lib/grid';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import InputNumber from 'antd/lib/input-number';
import Upload, { UploadFile } from 'antd/lib/upload';
import Button from 'antd/lib/button';
import Text from 'antd/lib/typography/Text';
import { UploadOutlined, CheckCircleOutlined, CloseCircleOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';

export const MIN_VIEWS = 1;
export const MAX_VIEWS = 10;
export const DEFAULT_VIEW_COUNT = 1;

export interface MultiviewFiles {
    [viewId: number]: File | null;
}

interface Props {
    files: MultiviewFiles;
    viewCount: number;
    sessionId: string;
    partNumber: number;
    onFileChange: (viewId: number, file: File | null) => void;
    onAddView: () => void;
    onRemoveView: (viewId: number) => void;
    onSessionIdChange: (value: string) => void;
    onPartNumberChange: (value: number) => void;
}

function MultiviewFileUpload(props: Props): JSX.Element {
    const {
        files,
        viewCount,
        sessionId,
        partNumber,
        onFileChange,
        onAddView,
        onRemoveView,
        onSessionIdChange,
        onPartNumberChange,
    } = props;

    // Generate viewIds dynamically based on viewCount
    const viewIds = Array.from({ length: viewCount }, (_, i) => i + 1);

    const renderViewCard = (viewId: number): JSX.Element => {
        const file = files[viewId];
        const fileList: UploadFile[] = file ? [{
            uid: `-${viewId}`,
            name: file.name,
            status: 'done',
        }] : [];

        const canRemove = viewCount > MIN_VIEWS;

        return (
            <div key={viewId} className='cvat-multiview-view-card'>
                <div className='cvat-multiview-view-header'>
                    <Text strong>View {viewId}</Text>
                    {canRemove && (
                        <Button
                            type='text'
                            danger
                            size='small'
                            icon={<DeleteOutlined />}
                            onClick={() => onRemoveView(viewId)}
                        >
                            Remove
                        </Button>
                    )}
                </div>
                <div className='cvat-multiview-view-content'>
                    <Upload
                        accept='video/*'
                        fileList={fileList}
                        beforeUpload={(uploadedFile: File): boolean => {
                            onFileChange(viewId, uploadedFile);
                            return false; // Prevent auto upload
                        }}
                        onRemove={(): void => {
                            onFileChange(viewId, null);
                        }}
                        maxCount={1}
                    >
                        <Button icon={<UploadOutlined />}>
                            Select Video
                        </Button>
                    </Upload>
                    {file ? (
                        <Text type='success' className='cvat-multiview-file-status'>
                            <CheckCircleOutlined /> {file.name}
                        </Text>
                    ) : (
                        <Text type='secondary' className='cvat-multiview-file-status'>
                            <CloseCircleOutlined /> No file selected
                        </Text>
                    )}
                </div>
            </div>
        );
    };

    const selectedCount = viewIds.filter((id) => files[id] !== null && files[id] !== undefined).length;
    const canAddMore = viewCount < MAX_VIEWS;

    return (
        <div className='cvat-multiview-file-upload'>
            <Row gutter={[16, 8]}>
                <Col span={24}>
                    <Text strong>Multiview Configuration</Text>
                </Col>

                <Col span={12}>
                    <Form.Item label='Session ID' required>
                        <Input
                            value={sessionId}
                            onChange={(e): void => onSessionIdChange(e.target.value)}
                            placeholder='e.g., session_001'
                        />
                    </Form.Item>
                </Col>

                <Col span={12}>
                    <Form.Item label='Part Number' required>
                        <InputNumber
                            value={partNumber}
                            onChange={(value): void => onPartNumberChange(value || 1)}
                            min={1}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <div className='cvat-multiview-views-header'>
                        <Text strong>
                            Video Files ({selectedCount}/{viewCount} selected)
                        </Text>
                        {canAddMore && (
                            <Button
                                type='dashed'
                                icon={<PlusOutlined />}
                                onClick={onAddView}
                                className='cvat-multiview-add-view-btn'
                            >
                                Add View
                            </Button>
                        )}
                    </div>
                </Col>

                <Col span={24}>
                    <div className='cvat-multiview-views-list'>
                        {viewIds.map((viewId) => renderViewCard(viewId))}
                    </div>
                </Col>
            </Row>
        </div>
    );
}

export default MultiviewFileUpload;
