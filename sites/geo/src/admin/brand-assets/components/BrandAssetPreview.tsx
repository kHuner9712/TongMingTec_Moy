interface Props {
  markdown: string;
  onCopy: () => void;
  onDownload: () => void;
  copied: boolean;
}

export default function BrandAssetPreview({ markdown, onCopy, onDownload, copied }: Props) {
  return (
    <div style={{ border: "1px solid #e8ecf1", borderRadius: 10, background: "#fff", overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderBottom: "1px solid #e8ecf1", background: "#f7f9fb" }}>
        <button onClick={onCopy} style={btnStyle}>{copied ? "已复制 ✓" : "复制 Markdown"}</button>
        <button onClick={onDownload} style={{ ...btnStyle, background: "#0055cc", color: "#fff", borderColor: "#0055cc" }}>下载 .md</button>
      </div>
      <div style={{ padding: 20, maxHeight: "calc(100vh - 240px)", overflow: "auto" }}>
        {markdown ? (
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: 13, lineHeight: 1.7, color: "#0d1b2a" }}>
            {markdown}
          </pre>
        ) : (
          <div style={{ textAlign: "center", color: "#8a9aaa", padding: 40, fontSize: 14 }}>
            点击"生成资产包"查看 Markdown 输出
          </div>
        )}
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "7px 16px", border: "1px solid #d0d7de", borderRadius: 6,
  background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
};
