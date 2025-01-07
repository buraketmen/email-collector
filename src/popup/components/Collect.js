import React, { useEffect, useMemo, useState } from "react";
import {
  Col,
  Flex,
  Row,
  Typography,
  Button,
  Space,
  Popconfirm,
  Alert,
  Input,
  Tooltip,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import Export from "./Export";
import EmailList from "./EmailList";
import { useEmail } from "../context/EmailContext";

const Collect = () => {
  const [copyButtonText, setCopyButtonText] = useState("Copy");
  const {
    searchText,
    setSearchText,
    clearEmails,
    isEmailEmpty,
    reScanEmails,
    loaders,
    processes,
    copyEmails,
  } = useEmail();

  useEffect(() => {
    if (loaders.copy == true) {
      setCopyButtonText("Copied!");
      setTimeout(() => {
        setCopyButtonText("Copy");
      }, 1000);
    }
  }, [loaders.copy]);

  return (
    <Col span={24} style={{ padding: 5 }}>
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
        Collect email addresses from active and new tabs.
      </Typography.Text>
      {processes.reScanIsFailed && (
        <Col span={24} style={{ paddingBottom: 5 }}>
          <Alert
            closable
            message="Failed! Refresh the active chrome tab."
            type="error"
            showIcon
          />
        </Col>
      )}
      <Row gutter={[5, 5]}>
        <Col span={24}>
          <Flex align="center" justify="space-between">
            <Input.Search
              placeholder="Search email"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 230 }}
            />
            <Tooltip
              title="Rescan the active chrome tab to collect email addresses."
              placement="bottomRight"
            >
              <Button
                type="text"
                disabled={loaders.reScan}
                onClick={reScanEmails}
              >
                <ReloadOutlined spin={loaders.reScan} /> Rescan
              </Button>
            </Tooltip>
          </Flex>
        </Col>
        <Col span={24}>
          {useMemo(
            () => (
              <EmailList />
            ),
            []
          )}
        </Col>
        <Col span={24}>
          <Space.Compact block>
            <Col span={8}>
              <Tooltip title="Copy email address list." placement="topLeft">
                <Button
                  type="primary"
                  loading={loaders.copy}
                  disabled={isEmailEmpty || loaders.copy}
                  block
                  onClick={copyEmails}
                >
                  {copyButtonText}
                </Button>
              </Tooltip>
            </Col>
            <Export />
            <Popconfirm
              placement="topRight"
              title="Are you sure to clear email addresses?"
              description="Clear all email addresses."
              okText="Confirm"
              cancelText="Back"
              okType="danger"
              onConfirm={clearEmails}
            >
              <Col span={8}>
                <Button block type="primary" danger disabled={isEmailEmpty}>
                  Clear
                </Button>
              </Col>
            </Popconfirm>
          </Space.Compact>
        </Col>
      </Row>
    </Col>
  );
};

export default Collect;
