/**
 * MSNCode brand mark — `/>` code tag on teal rounded square.
 * Matches the favicon/OG image mark exactly.
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
            <text
                x="50%"
                y="55%"
                dominantBaseline="middle"
                textAnchor="middle"
                fill="white"
                fontSize="20"
                fontWeight="800"
                fontFamily="monospace"
            >&lt;/&gt;</text>
        </svg>
    );
}
