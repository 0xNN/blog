/**
 * MSNCode brand mark — geometric M on teal rounded square.
 * Matches the favicon.svg and OG image mark exactly.
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
            <rect width="48" height="24" rx="10" fill="white" fillOpacity="0.07"/>
            <path
                d="M10 34 L10 14 L24 26 L38 14 L38 34"
                stroke="white"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    );
}
