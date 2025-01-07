import React, { Suspense, useEffect, useRef, useState } from "react";
import {
  Col,
  Flex,
  Row,
  Typography,
  Tabs,
  Switch,
  Tooltip,
  Avatar,
  Dropdown,
  Button,
} from "antd";

const Collect = React.lazy(() => import("./Collect"));
const Autoscan = React.lazy(() => import("./Autoscan"));
import AppIcon from "../../static/icon.png";
import { CenteredLoader } from "./Loader";
import { GithubOutlined, SettingOutlined } from "@ant-design/icons";

const Popup = () => {
  const [activeTab, setActiveTab] = useState("collect");
  const [isActive, setActive] = useState(true);
  const lastSettingsKey = useRef(null);
  const [settings, setSettings] = useState({ visible: false });

  useEffect(() => {
    chrome.storage.sync.get(
      { activeUITab: "collect", isAppActive: true },
      (result) => {
        setActiveTab(result.activeUITab);
        setActive(result.isAppActive);
      }
    );
  }, []);

  const keepSettingsOpen = (key) => {
    return ["Activity"].includes(key);
  };

  const handleSettingsMenuClick = (info) => {
    const { key } = info;
    lastSettingsKey.current = key;
    setSettings({
      visible: keepSettingsOpen(key),
    });
  };

  const onSettingsOpenChange = (open, info) => {
    if (info.source == "menu" && keepSettingsOpen(lastSettingsKey.current)) {
      setSettings({ ...settings, visible: true });
    } else {
      setSettings({ ...settings, visible: open });
    }
  };

  const onTabChange = (value) => {
    setActiveTab(value);
    chrome.storage.sync.set({ activeUITab: value });
  };

  const onAppActivityChange = (value) => {
    setActive(value);
    chrome.storage.sync.set({ isAppActive: value });
  };

  return (
    <Row gutter={[0, 0]} style={{ padding: 5 }}>
      <Col span={24}>
        <Flex
          align="center"
          justify="space-between"
          style={{ marginBottom: 0, marginTop: 2.5 }}
        >
          <Flex align="center">
            <Avatar
              src={AppIcon}
              alt="app icon"
              draggable={false}
              size="large"
              shape="square"
            />
            <Typography.Title
              level={4}
              style={{
                margin: 0,
                paddingLeft: 5,
              }}
            >
              Email Collector
            </Typography.Title>
          </Flex>
          <Flex align="center" gap={5}>
            <Flex align="center">
              <Button
                type="ghost"
                href="https://github.com/buraketmen/email-collector"
                target="_blank"
              >
                <GithubOutlined style={{ fontSize: 20, color: "#000" }} />
              </Button>
            </Flex>

            <Dropdown
              destroyPopupOnHide
              trigger={["click"]}
              placement="bottomRight"
              open={settings.visible}
              onOpenChange={(open, info) => onSettingsOpenChange(open, info)}
              arrow
              menu={{
                style: { width: 160, borderRadius: 4 },
                onClick: handleSettingsMenuClick,
                items: [
                  {
                    key: "Activity",
                    label: (
                      <Flex align="center" justify="space-between">
                        <Tooltip
                          title="Indicates whether email address scanning is active or inactive. When disabled it won't work on new tabs."
                          placement="bottom"
                        >
                          <Typography.Text>State</Typography.Text>
                        </Tooltip>
                        <Switch
                          checkedChildren="Enabled"
                          unCheckedChildren="Disabled"
                          value={isActive}
                          onChange={(checked) => onAppActivityChange(checked)}
                        />
                      </Flex>
                    ),
                  },
                ],
              }}
            >
              <SettingOutlined style={{ fontSize: 20, paddingRight: 10 }} />
            </Dropdown>
          </Flex>
        </Flex>
      </Col>
      <Col span={24}>
        <Tabs
          defaultActiveKey="collect"
          activeKey={activeTab}
          onChange={onTabChange}
          centered
          items={[
            {
              label: "Collection",
              key: "collect",
              children: (
                <Suspense
                  fallback={
                    <div style={{ height: 200 }}>
                      <CenteredLoader />
                    </div>
                  }
                >
                  <Collect />
                </Suspense>
              ),
            },
            {
              label: "Tasks",
              key: "autoscan",
              children: (
                <Suspense
                  fallback={
                    <div style={{ height: 200 }}>
                      <CenteredLoader />
                    </div>
                  }
                >
                  <Autoscan />
                </Suspense>
              ),
            },
          ]}
        />
      </Col>
    </Row>
  );
};

export default Popup;
