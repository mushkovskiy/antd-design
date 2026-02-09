import React from 'react';
import { Form, Input } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { DynamicInputListProps } from '../types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DynamicInputList: React.FC<DynamicInputListProps> = ({ form: _form, name, label }) => {
  return (
    <Form.Item label={label} colon={false}>
      <Form.List name={name} initialValue={['']}>
        {(fields, { add, remove }) => (
          <>
            {fields.map((field, index) => {
              const isFirst = index === 0;
              const suffix = isFirst ? (
                <PlusOutlined
                  onClick={() => add('')}
                  style={{ cursor: 'pointer', color: '#1677ff' }}
                />
              ) : (
                <DeleteOutlined
                  onClick={() => remove(field.name)}
                  style={{ cursor: 'pointer', color: '#ff4d4f' }}
                />
              );

              return (
                <Form.Item
                  {...field}
                  style={index > 0 ? { marginTop: 8, marginBottom: 0 } : { marginBottom: 0 }}
                >
                  <Input suffix={suffix} />
                </Form.Item>
              );
            })}
          </>
        )}
      </Form.List>
    </Form.Item>
  );
};

export default DynamicInputList;
