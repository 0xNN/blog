import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";
import { Copy, Check, Play } from "lucide-react";
import { Sandpack } from "@codesandbox/sandpack-react";

function CodeBlock({ inline, className, children, ...props }) {
    const [copied, setCopied] = useState(false);
    const [playgroundOpen, setPlaygroundOpen] = useState(false);
    const match = /language-(\w+)/.exec(className || "");
    const lang = match?.[1] || "text";
    const code = String(children).replace(/\n$/, "");

    if (inline) {
        return <code className={className} {...props}>{children}</code>;
    }

    const canPlayground = ["jsx", "tsx", "js", "javascript", "react"].includes(lang.toLowerCase());

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="not-prose group relative my-6 rounded-xl border border-border overflow-hidden bg-[#0a0a0a]">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/40 text-xs font-mono">
                <span className="text-white/60 uppercase">{lang}</span>
                <div className="flex items-center gap-1">
                    {canPlayground && (
                        <button
                            data-testid="run-playground-btn"
                            onClick={() => setPlaygroundOpen(!playgroundOpen)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition"
                        >
                            <Play className="h-3 w-3" />
                            {playgroundOpen ? "Close" : "Run"}
                        </button>
                    )}
                    <button
                        data-testid="copy-code-btn"
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition"
                    >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied ? "Copied" : "Copy"}
                    </button>
                </div>
            </div>
            <SyntaxHighlighter
                language={lang}
                style={oneDark}
                customStyle={{ margin: 0, background: "transparent", padding: "1rem 1.25rem", fontSize: "0.875rem" }}
                codeTagProps={{ style: { fontFamily: "JetBrains Mono, monospace" } }}
            >
                {code}
            </SyntaxHighlighter>
            {canPlayground && playgroundOpen && (
                <div className="border-t border-white/10">
                    <Sandpack
                        template={lang === "tsx" || lang === "ts" ? "react-ts" : "react"}
                        theme="dark"
                        files={{ "/App.js": code.includes("export default") ? code : `export default function App(){\n${code}\n}` }}
                        options={{ showTabs: false, showLineNumbers: true, editorHeight: 320 }}
                    />
                </div>
            )}
        </div>
    );
}

function MarkdownLink(props) {
    return <a {...props} target={props.href?.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" />;
}

export default function MarkdownRenderer({ content }) {
    return (
        <div className="prose-article">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code: CodeBlock,
                    a: MarkdownLink,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
