import React, { useState, useRef } from "react";
import { Button, Col, Tooltip } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useEmail } from "../context/EmailContext";

const Export = () => {
  const csvLink = useRef();
  const { filteredEmails, isEmailEmpty } = useEmail();
  const [isLoading, setIsLoading] = useState(false);

  const exportEmails = () => {
    if (filteredEmails.length === 0) return;
    setIsLoading(true);
    const csvContent =
      "\ufeff" + "Emails\n" + filteredEmails.map((email) => email).join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    csvLink.current.href = URL.createObjectURL(blob);
    csvLink.current.download = `emails.csv`;
    csvLink.current.click();
    setTimeout(() => {
      setIsLoading(false);
    }, 250);
  };

  return (
    <Col span={8} style={{ paddingLeft: 5, paddingRight: 5 }}>
      <a style={{ display: "none" }} href="empty" ref={csvLink} />
      <Tooltip title="Download email address list as CSV." placement="top">
        <Button
          loading={isLoading}
          disabled={isEmailEmpty}
          block
          icon={<DownloadOutlined />}
          onClick={exportEmails}
        />
      </Tooltip>
    </Col>
  );
};

export default Export;
