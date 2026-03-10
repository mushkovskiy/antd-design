import React from 'react';
import { Card, Typography, Divider, Tag } from 'antd';
import Gallery from '../components/Gallery';

const { Title, Paragraph, Text } = Typography;

// 8 images — grid mode (≤ 10)
const GRID_IMAGES = Array.from(
  { length: 8 },
  () => `https://picsum.photos/200`,
);

// 15 images — overlay mode (> 10)
const OVERLAY_IMAGES = Array.from(
  { length: 15 },
  () => `https://picsum.photos/200`,
);

const GalleryDemo: React.FC = () => {
  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <Typography>
        <Title level={1}>Gallery</Title>
        <Paragraph>
          Component displays thumbnail images (80×60 px) in two modes depending
          on the number of images. Uses the Ant Design{' '}
          <Text code>Image</Text> component with the default mask disabled.
        </Paragraph>
      </Typography>

      <Card
        title={
          <span>
            Grid mode <Tag color="blue">≤ 10 images</Tag>
          </span>
        }
        style={{ marginTop: 16 }}
      >
        <Paragraph type="secondary">
          8 images — displayed in a flex row with <Text code>gap: 10px</Text>,
          no overlap.
        </Paragraph>
        <Gallery images={GRID_IMAGES} />
      </Card>

      <Divider />

      <Card
        title={
          <span>
            Overlay mode <Tag color="orange">&gt; 10 images</Tag>
          </span>
        }
      >
        <Paragraph type="secondary">
          15 images — each overlaps the next by 50%. Hover to scale up.
          Click the <strong>leftmost</strong> or <strong>rightmost</strong>{' '}
          visible image to scroll.
        </Paragraph>
        <Gallery images={OVERLAY_IMAGES} />
      </Card>
    </div>
  );
};

export default GalleryDemo;
