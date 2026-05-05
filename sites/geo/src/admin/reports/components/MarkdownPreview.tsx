interface Props {
  markdown: string;
  onCopy: () => void;
  onDownload: () => void;
  copied: boolean;
}

export default function MarkdownPreview({ markdown, onCopy, onDownload, copied }: Props) {
  if (!markdown) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#8a9aaa", border: "1px dashed #d0d7de", borderRadius: 8 }}>
        点击"生成报告"后，Markdown 将在此处预览
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={onCopy} style={btnStyle}>
          {copied ? "已复制 ✓" : "复制 Markdown"}
        </button>
        <button onClick={onDownload} style={{ ...btnStyle, background: "#0055cc", color: "#fff", borderColor: "#0055cc" }}>
          下载 .md 文件
        </button>
      </div>
      <pre style={{
        background: "#f7f9fb", border: "1px solid #e8ecf1", borderRadius: 8,
        padding: 20, fontSize: 13, lineHeight: 1.7, overflow: "auto",
        maxHeight: "calc(100vh - 200px)", whiteSpace: "pre-wrap",
        color: "#0d1b2a", fontFamily: 'Consolas, "Source Code Pro", monospace',
      }}>
        {markdown}
      </pre>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "8px 16px", border: "1px solid #d0d7de", borderRadius: 6,
  background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
};
