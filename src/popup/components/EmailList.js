import React from "react";
import { Space, Typography, Col } from "antd";
import { useEmail } from "../context/EmailContext";

const EmailList = React.memo(() => {
  const { filteredEmails } = useEmail();

  return (
    <Col
      span={24}
      className="gradient-bg"
      style={{
        height: 340,
        overflow: "auto",
        width: "100%",
        border: `1px solid #dee2e6`,
        borderRadius: 6,
        padding: 5,
      }}
    >
      <Space direction="vertical" size={2.5}>
        {filteredEmails.map((email) => (
          <Typography.Text key={email} ellipsis copyable>
            {email}
          </Typography.Text>
        ))}
      </Space>
    </Col>
  );
});

EmailList.displayName = "EmailList";

export default EmailList;
