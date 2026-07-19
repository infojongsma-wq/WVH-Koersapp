// Vector recreation of the WV Holten club badge — round, black/white, with
// "WV HOLTEN · SINCE 1978" along the top, "HOME OF CYCLING" along the bottom,
// and three pine trees in the middle. Scales crisply at any size.
// To use the exact raster logo instead, drop it in /public and swap this
// component for a <img>/<Image>.
export function WvhLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="WV Holten — Home of Cycling, since 1978"
    >
      <defs>
        <path id="wvh-arc-top" d="M 25,100 A 75,75 0 0 1 175,100" />
        <path id="wvh-arc-bottom" d="M 30,100 A 70,70 0 0 0 170,100" />
      </defs>

      {/* Badge base */}
      <circle cx="100" cy="100" r="97" fill="#0A0A0A" />
      <circle cx="100" cy="100" r="90" fill="none" stroke="#fff" strokeWidth="2.5" />
      <circle cx="100" cy="100" r="57" fill="none" stroke="#fff" strokeWidth="2.5" />

      {/* Curved text */}
      <text
        fill="#fff"
        fontSize="13.5"
        fontWeight="700"
        letterSpacing="1.3"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        <textPath href="#wvh-arc-top" startOffset="50%">
          WV HOLTEN · SINCE 1978
        </textPath>
      </text>
      <text
        fill="#fff"
        fontSize="13.5"
        fontWeight="700"
        letterSpacing="2.5"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        <textPath href="#wvh-arc-bottom" startOffset="50%">
          HOME OF CYCLING
        </textPath>
      </text>

      {/* Separator dots between top and bottom text */}
      <circle cx="24" cy="100" r="2.5" fill="#fff" />
      <circle cx="176" cy="100" r="2.5" fill="#fff" />

      {/* Pine trees */}
      <g fill="#fff">
        <rect x="66" y="130" width="68" height="3" />
        {/* left */}
        <polygon points="76,104 70,116 82,116" />
        <polygon points="76,111 67,124 85,124" />
        <polygon points="76,118 65,131 87,131" />
        <rect x="74.5" y="131" width="3" height="2" />
        {/* center (tallest) */}
        <polygon points="100,92 92,110 108,110" />
        <polygon points="100,102 88,122 112,122" />
        <polygon points="100,113 85,131 115,131" />
        <rect x="98.5" y="131" width="3" height="2" />
        {/* right */}
        <polygon points="124,104 118,116 130,116" />
        <polygon points="124,111 115,124 133,124" />
        <polygon points="124,118 113,131 135,131" />
        <rect x="122.5" y="131" width="3" height="2" />
      </g>
    </svg>
  );
}
