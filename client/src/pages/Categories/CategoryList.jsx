import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Space, Tag, Popconfirm, Card, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';

const CategoryList = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [form] = Form.useForm();

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const params = {};
            if (searchText) params.search = searchText;
            const res = await axiosClient.get('/categories', { params });
            setCategories(res.metadata);
        } catch (error) {
            message.error('Lỗi khi tải danh mục');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [searchText]);

    const handleSubmit = async (values) => {
        try {
            if (editingCategory) {
                await axiosClient.put(`/categories/${editingCategory._id}`, values);
                message.success('Cập nhật danh mục thành công');
            } else {
                await axiosClient.post('/categories', values);
                message.success('Tạo danh mục thành công');
            }
            setModalOpen(false);
            form.resetFields();
            setEditingCategory(null);
            fetchCategories();
        } catch (error) {
            message.error(error.response?.data?.message || 'Thao tác thất bại');
        }
    };

    const handleEdit = (record) => {
        setEditingCategory(record);
        form.setFieldsValue(record);
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        try {
            await axiosClient.delete(`/categories/${id}`);
            message.success('Xóa danh mục thành công');
            fetchCategories();
        } catch (error) {
            message.error(error.response?.data?.message || 'Xóa thất bại');
        }
    };

    const handleAdd = () => {
        setEditingCategory(null);
        form.resetFields();
        setModalOpen(true);
    };

    const columns = [
        {
            title: 'STT',
            key: 'index',
            width: 60,
            align: 'center',
            render: (_, __, index) => index + 1,
        },
        {
            title: 'Tên danh mục',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 120,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        style={{ color: '#4F46E5' }}
                    />
                    <Popconfirm
                        title="Xóa danh mục"
                        description="Bạn có chắc muốn xóa danh mục này?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="text" icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div className="page-header">
                <h2>Quản lý danh mục</h2>
                <p>Quản lý danh mục sản phẩm trong kho hàng</p>
            </div>

            <Card>
                <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1E293B' }}>Danh sách danh mục</h3>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                        Thêm danh mục
                    </Button>
                </div>
                <div style={{ marginBottom: 20 }}>
                    <Input
                        placeholder="Tìm kiếm danh mục..."
                        prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ maxWidth: 360 }}
                        allowClear
                    />
                </div>

                <Table
                    columns={columns}
                    dataSource={categories}
                    rowKey="_id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: false,
                        showTotal: (total) => `Tổng ${total} danh mục`,
                    }}
                    locale={{ emptyText: 'Chưa có danh mục nào' }}
                />
            </Card>

            <Modal
                title={editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
                open={modalOpen}
                onCancel={() => {
                    setModalOpen(false);
                    form.resetFields();
                    setEditingCategory(null);
                }}
                footer={null}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false} className="mt-4">
                    <Form.Item
                        name="name"
                        label="Tên danh mục"
                        rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}
                    >
                        <Input placeholder="Nhập tên danh mục" />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea rows={3} placeholder="Mô tả danh mục (tùy chọn)" />
                    </Form.Item>
                    <div className="flex justify-end gap-2">
                        <Button
                            onClick={() => {
                                setModalOpen(false);
                                form.resetFields();
                            }}
                        >
                            Hủy
                        </Button>
                        <Button type="primary" htmlType="submit">
                            {editingCategory ? 'Cập nhật' : 'Tạo mới'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default CategoryList;
