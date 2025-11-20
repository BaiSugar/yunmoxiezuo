import React from "react";
import ReactDOM from "react-dom/client";

function TestApp() {
  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1 style={{ color: "#1e40af", marginBottom: "20px" }}>
        ✅ React 测试页面
      </h1>
      <p>如果你看到这个页面，说明：</p>
      <ul style={{ marginTop: "10px", marginLeft: "20px" }}>
        <li>✅ Vite 服务器正常运行</li>
        <li>✅ React 正常加载</li>
        <li>✅ TypeScript 编译成功</li>
      </ul>
      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          background: "#e0f2fe",
          borderRadius: "8px",
        }}
      >
        <p>
          <strong>端口信息：</strong> {window.location.href}
        </p>
        <p>
          <strong>时间：</strong> {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>
);
