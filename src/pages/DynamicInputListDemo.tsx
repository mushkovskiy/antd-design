import React from 'react';
import { Card, Typography, Space, Form, Button, Divider } from 'antd';
import DynamicInputList from '../components/DynamicInputList';

const { Title, Paragraph, Text } = Typography;

export const DynamicInputListDemo: React.FC = () => {
  const [form] = Form.useForm();

  const handleFinish = (values: unknown) => {
    // eslint-disable-next-line no-console
    console.log('Form values:', values);
  };

  const currentValues = form.getFieldsValue();

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Typography>
        <Title level={1}>Dynamic Input List</Title>
        <Paragraph>
          Component for managing a dynamic list of string values inside an Ant Design form.
          Values are kept in sync with the form field as <Text code>string[] | undefined</Text>.
        </Paragraph>
      </Typography>

      <Card title="Demo" style={{ marginTop: 16 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ phones: ['+1 555 0100'] }}
        >
          <DynamicInputList form={form} name="phones" label="Phone numbers" />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
              <Button onClick={() => form.resetFields()}>Reset</Button>
            </Space>
          </Form.Item>
        </Form>

        <Divider />

        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>Live form values:</Text>
          <pre
            style={{
              background: '#f5f5f5',
              padding: 12,
              borderRadius: 6,
              margin: 0,
              fontSize: 12,
              maxHeight: 200,
              overflow: 'auto',
            }}
          >
            {JSON.stringify(currentValues, null, 2)}
          </pre>
        </Space>
      </Card>
    </div>
  );
};

export default DynamicInputListDemo;

