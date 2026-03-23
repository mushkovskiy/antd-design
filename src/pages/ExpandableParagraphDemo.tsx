import React from 'react';
import { Card, Space, Switch, Typography } from 'antd';
import ExpandableParagraph from '../components/ExpandableParagraph';

const { Title, Paragraph, Text } = Typography;

const SHORT_TEXT =
  'Короткий текст помещается в несколько строк и не должен показывать кнопку управления.';

const LONG_TEXT = `Ant Design предоставляет готовую обрезку текста, но в прикладном коде обычно нужен более удобный интерфейс. Компонент должен сам определять, когда текст действительно переполняет заданное количество строк, и только в этом случае показывать действие для раскрытия. Это избавляет потребителя от ручных проверок длины строки и делает поведение одинаковым во всех местах использования.

В развернутом состоянии текст должен отображаться полностью, а кнопка должна менять подпись на обратное действие. Дополнительно важна поддержка управляемого режима, чтобы родительский компонент мог синхронизировать раскрытие с внешним состоянием, аналитикой или другими элементами интерфейса.`;

const ExpandableParagraphDemo: React.FC = () => {
  const [expanded, setExpanded] = React.useState(false);
  const [lastClick, setLastClick] = React.useState<{ x: number; y: number } | null>(
    null,
  );

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <Typography>
        <Title level={1}>Expandable Paragraph</Title>
        <Paragraph>
          Обертка над <Text code>Typography.Paragraph</Text> с автоматическим
          определением переполнения и двусторонним toggle для длинного текста.
        </Paragraph>
      </Typography>

      <Space direction="vertical" size={16} style={{ display: 'flex' }}>
        <Card title="Короткий текст">
          <ExpandableParagraph>{SHORT_TEXT}</ExpandableParagraph>
        </Card>

        <Card title="Стандартное поведение">
          <ExpandableParagraph>{LONG_TEXT}</ExpandableParagraph>
        </Card>

        <Card
          title="Управляемый режим"
          extra={
            <Space>
              <Text>Expanded</Text>
              <Switch checked={expanded} onChange={setExpanded} />
            </Space>
          }
        >
          <ExpandableParagraph
            expanded={expanded}
            rows={4}
            symbol={(isOpen) => (isOpen ? 'Скрыть детали' : 'Читать далее')}
            onExpand={(nextExpanded, info) => {
              setExpanded(nextExpanded);
              setLastClick(info);
            }}
          >
            {LONG_TEXT}
          </ExpandableParagraph>

          {lastClick && (
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Последний клик по toggle: x={lastClick.x}, y={lastClick.y}
            </Paragraph>
          )}
        </Card>
      </Space>
    </div>
  );
};

export default ExpandableParagraphDemo;
