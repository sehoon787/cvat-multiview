// Copyright (C) 2024 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { useState } from 'react';
import { useHistory } from 'react-router';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Button from 'antd/lib/button';
import Upload, { RcFile } from 'antd/lib/upload';
import notification from 'antd/lib/notification';
import Select from 'antd/lib/select';
import Card from 'antd/lib/card';
import Descriptions from 'antd/lib/descriptions';
import Space from 'antd/lib/space';
import Typography from 'antd/lib/typography';
import { InboxOutlined } from '@ant-design/icons';

import './styles.scss';

const { Dragger } = Upload;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

interface MultiviewSession {
    id: string;
    part: number;
    complete: boolean;
    view1?: File;
    view2?: File;
    view3?: File;
    view4?: File;
    view5?: File;
}

/**
 * Parse multiview files from file list
 * Expected format: {id}-View{1-5}-Part{N}.mp4
 * Example: 00-View1-Part1.mp4
 */
function parseMultiviewFiles(fileList: File[]): MultiviewSession[] {
    const regex = /^(\d+)-View([1-5])-Part(\d+)\.mp4$/i;
    const sessionsMap = new Map<string, MultiviewSession>();

    fileList.forEach((file) => {
        const match = file.name.match(regex);
        if (match) {
            const [, id, view, part] = match;
            const key = `${id}-${part}`;
            const viewKey = `view${view}` as keyof MultiviewSession;

            if (!sessionsMap.has(key)) {
                sessionsMap.set(key, {
                    id,
                    part: parseInt(part, 10),
                    complete: false,
                });
            }

            const session = sessionsMap.get(key)!;
            (session as any)[viewKey] = file;

            // Check if all 5 views are present
            session.complete = [1, 2, 3, 4, 5].every(
                (v) => (session as any)[`view${v}`] !== undefined,
            );
        }
    });

    return Array.from(sessionsMap.values()).sort((a, b) => {
        // Sort by ID first, then by part number
        if (a.id !== b.id) {
            return a.id.localeCompare(b.id);
        }
        return a.part - b.part;
    });
}

export default function CreateMultiviewTaskPage(): JSX.Element {
    const [form] = Form.useForm();
    const history = useHistory();

    const [fileList, setFileList] = useState<File[]>([]);
    const [sessions, setSessions] = useState<MultiviewSession[]>([]);
    const [selectedSessionKey, setSelectedSessionKey] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleFilesChange = (info: any): void => {
        const files = info.fileList.map((f: any) => f.originFileObj).filter(Boolean);
        setFileList(files);

        const parsedSessions = parseMultiviewFiles(files);
        setSessions(parsedSessions);

        // Auto-select the first complete session
        const firstComplete = parsedSessions.find((s) => s.complete);
        if (firstComplete) {
            setSelectedSessionKey(`${firstComplete.id}-${firstComplete.part}`);
        } else {
            setSelectedSessionKey(null);
        }
    };

    const handleSubmit = async (): Promise<void> => {
        try {
            const values = await form.validateFields();
            const session = sessions.find((s) => `${s.id}-${s.part}` === selectedSessionKey);

            if (!session || !session.complete) {
                notification.error({
                    message: 'Invalid Session',
                    description: 'Please select a complete session with all 5 video views.',
                });
                return;
            }

            setSubmitting(true);

            // Prepare FormData
            const formData = new FormData();
            formData.append('name', values.taskName);
            formData.append('dimension', 'multiview');
            formData.append('session_id', session.id);
            formData.append('part_number', session.part.toString());

            // Append video files
            formData.append('video_view1', session.view1!);
            formData.append('video_view2', session.view2!);
            formData.append('video_view3', session.view3!);
            formData.append('video_view4', session.view4!);
            formData.append('video_view5', session.view5!);

            // Make API call
            const response = await fetch('/api/tasks/create_multiview', {
                method: 'POST',
                body: formData,
                // Note: Do not set Content-Type header, browser will set it with boundary for FormData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const task = await response.json();

            notification.success({
                message: 'Multiview Task Created',
                description: `Task "${values.taskName}" has been created successfully.`,
            });

            // Redirect to task page
            history.push(`/tasks/${task.id}`);
        } catch (error: any) {
            console.error('Failed to create multiview task:', error);
            notification.error({
                message: 'Task Creation Failed',
                description: error.message || 'An unknown error occurred.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const selectedSession = sessions.find((s) => `${s.id}-${s.part}` === selectedSessionKey);
    const completeSessions = sessions.filter((s) => s.complete);
    const incompleteSessions = sessions.filter((s) => !s.complete);

    return (
        <div className='cvat-create-multiview-task-page'>
            <div className='cvat-create-multiview-task-content'>
                <Title level={2}>Create Multiview Task</Title>
                <Paragraph type='secondary'>
                    Upload 5 synchronized video files (View1-View5) from the MultiSensor-Home1 dataset
                    to create a multiview annotation task.
                </Paragraph>

                <Form
                    form={form}
                    layout='vertical'
                    className='cvat-create-multiview-task-form'
                >
                    {/* Task Name */}
                    <Form.Item
                        name='taskName'
                        label='Task Name'
                        rules={[{ required: true, message: 'Please enter a task name' }]}
                    >
                        <Input placeholder='e.g., MultiSensor-Home1-Session-00-Part-1' />
                    </Form.Item>

                    {/* File Upload */}
                    <Form.Item label='Upload Video Files'>
                        <Dragger
                            multiple
                            accept='.mp4'
                            beforeUpload={() => false}
                            onChange={handleFilesChange}
                            fileList={fileList.map((f, idx) => ({
                                uid: `${idx}`,
                                name: f.name,
                                status: 'done' as const,
                                originFileObj: f,
                            }))}
                        >
                            <p className='ant-upload-drag-icon'>
                                <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                            </p>
                            <p className='ant-upload-text'>
                                Click or drag files to this area to upload
                            </p>
                            <p className='ant-upload-hint'>
                                Expected format: <strong>{'{id}'}-View{'{1-5}'}-Part{'{N}'}.mp4</strong>
                                <br />
                                Example: <code>00-View1-Part1.mp4</code>, <code>00-View2-Part1.mp4</code>, ...
                            </p>
                        </Dragger>
                    </Form.Item>

                    {/* Session Selection */}
                    {sessions.length > 0 && (
                        <Form.Item label='Select Session'>
                            <Select
                                placeholder='Choose a complete session with all 5 views'
                                value={selectedSessionKey}
                                onChange={setSelectedSessionKey}
                            >
                                {completeSessions.length > 0 && (
                                    <Select.OptGroup label='Complete Sessions (All 5 Views)'>
                                        {completeSessions.map((session) => (
                                            <Option
                                                key={`${session.id}-${session.part}`}
                                                value={`${session.id}-${session.part}`}
                                            >
                                                Session {session.id} - Part {session.part}
                                            </Option>
                                        ))}
                                    </Select.OptGroup>
                                )}
                                {incompleteSessions.length > 0 && (
                                    <Select.OptGroup label='Incomplete Sessions (Missing Views)'>
                                        {incompleteSessions.map((session) => (
                                            <Option
                                                key={`${session.id}-${session.part}`}
                                                value={`${session.id}-${session.part}`}
                                                disabled
                                            >
                                                Session {session.id} - Part {session.part} (Incomplete)
                                            </Option>
                                        ))}
                                    </Select.OptGroup>
                                )}
                            </Select>
                        </Form.Item>
                    )}

                    {/* Session Details */}
                    {selectedSession && selectedSession.complete && (
                        <Card
                            title='Session Details'
                            size='small'
                            className='cvat-session-details-card'
                        >
                            <Descriptions column={1} size='small'>
                                <Descriptions.Item label='Session ID'>{selectedSession.id}</Descriptions.Item>
                                <Descriptions.Item label='Part Number'>{selectedSession.part}</Descriptions.Item>
                                <Descriptions.Item label='View 1'>
                                    {selectedSession.view1?.name}
                                </Descriptions.Item>
                                <Descriptions.Item label='View 2'>
                                    {selectedSession.view2?.name}
                                </Descriptions.Item>
                                <Descriptions.Item label='View 3'>
                                    {selectedSession.view3?.name}
                                </Descriptions.Item>
                                <Descriptions.Item label='View 4'>
                                    {selectedSession.view4?.name}
                                </Descriptions.Item>
                                <Descriptions.Item label='View 5'>
                                    {selectedSession.view5?.name}
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    )}

                    {/* Submit Button */}
                    <Form.Item>
                        <Space>
                            <Button
                                type='primary'
                                size='large'
                                onClick={handleSubmit}
                                loading={submitting}
                                disabled={!selectedSession || !selectedSession.complete}
                            >
                                Create Task
                            </Button>
                            <Button
                                size='large'
                                onClick={() => history.push('/tasks')}
                            >
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
}
