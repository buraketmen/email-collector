import {
  Button,
  Col,
  Flex,
  Input,
  Popconfirm,
  Radio,
  Row,
  Space,
  Tooltip,
  Typography,
} from "antd";
import React, { useEffect, useMemo, useState } from "react";

const Autoscan = () => {
  const [websites, setWebsites] = useState("");
  const [isScanning, setScanning] = useState(false);
  const [isSequential, setSequential] = useState(true);

  useEffect(() => {
    chrome.storage.sync.get(
      { websites: "", isAutoscanning: false, isAutoscanningSequential: true },
      (result) => {
        setWebsites(result.websites);
        setScanning(result.isAutoscanning);
        setSequential(result.isAutoscanningSequential);
      }
    );
  }, []);

  useEffect(() => {
    chrome.storage.sync.get({ isAutoscanning: false }, (result) => {
      setScanning(result.isAutoscanning);
    });

    function storageChanged(changes, namespace) {
      if (changes?.isAutoscanning) {
        setScanning(changes.isAutoscanning.newValue);
      }
    }

    chrome.storage.onChanged.addListener(storageChanged);

    return () => {
      chrome.storage.onChanged.removeListener(storageChanged);
    };
  }, []);

  const onWebsiteChange = (e) => {
    const value = e.target.value;
    setWebsites(value);
    chrome.storage.sync.set({ websites: value });
  };

  const scanWebsites = async () => {
    try {
      await chrome.runtime.sendMessage({
        action: "scanWebsites",
        websites: websites.replace(/\r\n/g, "\n").split("\n"),
        isSequential: isSequential,
      });
    } catch (error) {}
  };

  const stopScanningWebsite = () => {
    chrome.storage.sync.set({ isAutoscanning: false });
  };

  const onSequentialChange = (value) => {
    setSequential(value);
    chrome.storage.sync.set({ isAutoscanningSequential: value });
  };

  const isWebsiteEmpty = useMemo(() => websites === "", [websites]);

  return (
    <Col span={24} style={{ padding: 5 }}>
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
        Automate your tasks for specified websites.
      </Typography.Text>
      <Row gutter={[5, 5]}>
        <Col span={24}>
          <Flex justify="center" align="center">
            <Tooltip
              title="Indicates whether tasks run sequential or in parallel."
              placement="bottom"
            >
              <Radio.Group
                disabled={isScanning}
                value={isSequential}
                onChange={(e) => onSequentialChange(e.target.value)}
              >
                <Radio.Button
                  style={{ width: 100, textAlign: "center" }}
                  value={true}
                >
                  Sequential
                </Radio.Button>
                <Radio.Button
                  style={{ width: 100, textAlign: "center" }}
                  value={false}
                >
                  Parallel
                </Radio.Button>
              </Radio.Group>
            </Tooltip>
          </Flex>
        </Col>
        <Col span={24}>
          <Input.TextArea
            value={websites}
            placeholder={`https://example.com/
https://www.example.com/example
https://example.com/example?page=1
https://example.com/example?page=2&size=10`}
            className="gradient-bg autoscan-textarea"
            style={{
              minHeight: 200,
              maxHeight: 300,
              width: "100%",
              fontSize: 12,
              overflowX: "auto",
              overflowY: "auto",
              resize: "none",
            }}
            rows={8}
            disabled={isScanning}
            onChange={onWebsiteChange}
          />
        </Col>
        <Col span={24}>
          <Flex vertical gap={5}>
            <Typography.Text
              type="secondary"
              style={{ fontSize: 12, marginBottom: 5 }}
            >
              Findings will be saved in the Collection section.
            </Typography.Text>
            <Space.Compact block>
              <Tooltip
                title="Scan all websites to collect email addresses."
                placement="top"
              >
                <Button
                  type="primary"
                  loading={isScanning}
                  disabled={isScanning || isWebsiteEmpty}
                  block
                  onClick={scanWebsites}
                >
                  Scan
                </Button>
              </Tooltip>

              {isScanning && (
                <Popconfirm
                  placement="topRight"
                  title="Are you sure to stop scanning?"
                  description="Stop the task."
                  okText="Confirm"
                  cancelText="Back"
                  okType="danger"
                  onConfirm={stopScanningWebsite}
                  disabled={false}
                >
                  <Button
                    block
                    type="primary"
                    disabled={false}
                    loading={false}
                    danger
                  >
                    Stop
                  </Button>
                </Popconfirm>
              )}
            </Space.Compact>
          </Flex>
        </Col>
      </Row>
    </Col>
  );
};

export default Autoscan;
