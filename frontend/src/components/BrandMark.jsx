/**
 * MSNCode brand mark — `/>` code tag on teal rounded square.
 * Matches favicon.svg and apple-touch-icon.svg exactly.
 */
export default function BrandMark({ size = 24, className = "" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            fill="none"
            width={size}
            height={size}
            className={className}
            aria-hidden="true"
        >
            <rect width="48" height="48" rx="10" fill="#1a9e80"/>
            <g stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <path d="M16 30 L24 24 L16 18"/>
                <path d="M26 16 L22 32"/>
                <path d="M32 30 L24 24 L32 18"/>
            </g>
        </svg>
    );
}
