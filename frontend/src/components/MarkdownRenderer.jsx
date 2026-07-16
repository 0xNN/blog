import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState, useRef, useEffect } from "react";
import { Copy, Check, Play, ChevronDown, Terminal } from "lucide-react";
import { Sandpack } from "@codesandbox/sandpack-react";

const LANG_LABELS = {
  bash: "Bash",
  shell: "Shell",
  js: "JavaScript",
  javascript: "JavaScript",
  jsx: "JSX",
  ts: "TypeScript",
  tsx: "TSX",
  tsx: "TSX",
  python: "Python",
  py: "Python",
  json: "JSON",
  html: "HTML",
  css: "CSS",
  sql: "SQL",
  go: "Go",
  rust: "Rust",
  java: "Java",
  php: "PHP",
  yaml: "YAML",
  yml: "YAML",
  markdown: "Markdown",
  md: "Markdown",
  text: "Text",
  diff: "Diff",
  dockerfile: "Dockerfile",
};

const LANG_COLORS = {
  bash: "#89e051",
  shell: "#89e051",
  js: "#f7df1e",
  javascript: "#f7df1e",
  jsx: "#61dafb",
  ts: "#3178c6",
  tsx: "#3178c6",
  python: "#3572A5",
  py: "#3572A5",
  json: "#cbcb41",
  html: "#e34c26",
  css: "#563d7c",
  sql: "#e38c00",
  go: "#00ADD8",
  rust: "#dea584",
  java: "#b07219",
  php: "#4F5D95",
  yaml: "#cb171e",
  yml: "#cb171e",
  markdown: "#083fa1",
  md: "#083fa1",
  text: "#6b7280",
  diff: "#4b8b6b",
  dockerfile: "#384d54",
};

const COLLAPSE_THRESHOLD = 18;

function CodeBlock({ inline, className, children, ...props }) {
    const [copied, setCopied] = useState(false);
    const [playgroundOpen, setPlaygroundOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(true);
    const [showCollapse, setShowCollapse] = useState(false);
    const codeRef = useRef(null);
    const match = /language-(\w+)/.exec(className || "");
    const lang = match?.[1] || "text";
    const code = String(children).replace(/\n$/, "");
    const lineCount = code.split("\n").length;
    const label = LANG_LABELS[lang.toLowerCase()] || lang;
    const langColor = LANG_COLORS[lang.toLowerCase()] || "#6b7280";

    useEffect(() => {
        setShowCollapse(lineCount > COLLAPSE_THRESHOLD);
    }, [lineCount]);

    if (inline) {
        return <code className={className} {...props}>{children}</code>;
    }

    const canPlayground = ["jsx", "tsx", "js", "javascript", "react"].includes(lang.toLowerCase());

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isCollapsed = showCollapse && collapsed && !playgroundOpen;

    return (
        <div className="not-prose group relative my-6 rounded-xl border border-border overflow-hidden bg-[#0a0a0a] transition-shadow hover:shadow-lg">
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-2.5">
                    {/* Traffic lights */}
                    <div className="flex items-center gap-1.5 mr-1">
                        <span className="h-3 w-3 rounded-full bg-[#ff5f57]"></span>
                        <span className="h-3 w-3 rounded-full bg-[#febc2e]"></span>
                        <span className="h-3 w-3 rounded-full bg-[#28c840]"></span>
                    </div>
                    <span
                        className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-white/50"
                    >
                        <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: langColor }}
                        />
                        {label}
                    </span>
                    {lineCount > 1 && (
                        <span className="text-[10px] font-mono text-white/25 hidden sm:inline">
                            {lineCount} {lineCount === 1 ? "line" : "lines"}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {showCollapse && !playgroundOpen && (
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-white/40 hover:text-white/80 hover:bg-white/5 transition text-xs"
                        >
                            <ChevronDown className={`h-3 w-3 transition-transform ${collapsed ? "" : "rotate-180"}`} />
                            {collapsed ? "Expand" : "Collapse"}
                        </button>
                    )}
                    {canPlayground && (
                        <button
                            data-testid="run-playground-btn"
                            onClick={() => {
                                setPlaygroundOpen(!playgroundOpen);
                                setCollapsed(false);
                            }}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-white/40 hover:text-[hsl(var(--accent))] hover:bg-white/5 transition text-xs"
                        >
                            <Play className="h-3 w-3" />
                            {playgroundOpen ? "Close" : "Run"}
                        </button>
                    )}
                    <button
                        data-testid="copy-code-btn"
                        onClick={handleCopy}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition text-xs ${
                            copied
                                ? "text-[hsl(var(--accent))] bg-[hsl(var(--accent)/0.1)]"
                                : "text-white/40 hover:text-white/80 hover:bg-white/5"
                        }`}
                    >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied ? "Copied" : "Copy"}
                    </button>
                </div>
            </div>

            {/* Code body */}
            <div
                ref={codeRef}
                className="relative overflow-auto"
                style={isCollapsed ? { maxHeight: "18rem" } : undefined}
            >
                <SyntaxHighlighter
                    language={lang}
                    style={oneDark}
                    showLineNumbers={lineCount > 3}
                    customStyle={{
                        margin: 0,
                        background: "transparent",
                        padding: "1rem 1.25rem",
                        fontSize: "0.8125rem",
                    }}
                    lineNumberStyle={{
                        color: "rgba(255,255,255,0.15)",
                        fontSize: "0.75rem",
                        paddingRight: "1.5em",
                        userSelect: "none",
                    }}
                    codeTagProps={{ style: { fontFamily: "JetBrains Mono, monospace" } }}
                >
                    {code}
                </SyntaxHighlighter>

                {/* Gradient fade when collapsed */}
                {isCollapsed && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
                )}
            </div>

            {/* Expand hint when collapsed */}
            {isCollapsed && (
                <button
                    onClick={() => setCollapsed(false)}
                    className="w-full py-2 border-t border-white/[0.06] bg-white/[0.02] text-xs font-mono text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition flex items-center justify-center gap-1.5"
                >
                    <ChevronDown className="h-3 w-3" />
                    {lineCount - COLLAPSE_THRESHOLD} more {lineCount - COLLAPSE_THRESHOLD === 1 ? "line" : "lines"}
                </button>
            )}

            {/* Playground */}
            {canPlayground && playgroundOpen && (
                <div className="border-t border-white/[0.06]">
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

function MarkdownHeading({ level, children, ...props }) {
    const Tag = `h${level}`;
    const text = typeof children === "string" ? children : children?.props?.children || "";
    const id = String(text).toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    return (
        <Tag id={id} className="group-heading relative scroll-mt-24" {...props}>
            <a
                href={`#${id}`}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 opacity-0 group-heading:hover:opacity-100 transition-opacity text-muted-foreground hover:text-[hsl(var(--accent))]"
                aria-label={`Link to ${text}`}
            >
                #
            </a>
            {children}
        </Tag>
    );
}

export default function MarkdownRenderer({ content }) {
    return (
        <div className="prose-article">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code: CodeBlock,
                    a: MarkdownLink,
                    h2: (props) => <MarkdownHeading level={2} {...props} />,
                    h3: (props) => <MarkdownHeading level={3} {...props} />,
                    h4: (props) => <MarkdownHeading level={4} {...props} />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
