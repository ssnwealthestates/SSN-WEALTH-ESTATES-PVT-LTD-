export function CompanyLogo({
  className = "w-20 h-20",
  showText = true,
  theme = "dark",
}: {
  className?: string;
  showText?: boolean;
  theme?: "dark" | "light";
}) {
  return (
    <div className="flex items-center gap-3.5">
      <svg
        viewBox="0 0 240 220"
        className={`${className} flex-shrink-0 drop-shadow-md`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="SSN Wealth Capital Logo"
      >
        <defs>
          {/* Metallic Gold Gradients */}
          <linearGradient id="goldGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F9E29D" />
            <stop offset="35%" stopColor="#D4AF37" />
            <stop offset="70%" stopColor="#AA771C" />
            <stop offset="100%" stopColor="#87580C" />
          </linearGradient>
          <linearGradient id="goldGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#BF8C25" />
            <stop offset="50%" stopColor="#F3D17A" />
            <stop offset="100%" stopColor="#87580C" />
          </linearGradient>

          {/* Deep Navy Blue Gradients */}
          <linearGradient id="navyGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3E62" />
            <stop offset="50%" stopColor="#0B192C" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>
          <linearGradient id="waveBlueGrad" x1="0%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#4A90E2" />
            <stop offset="30%" stopColor="#2563EB" />
            <stop offset="70%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Skyscraper Gradients */}
          <linearGradient id="towerGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#AA771C" />
            <stop offset="40%" stopColor="#FCE79D" />
            <stop offset="70%" stopColor="#C59B27" />
            <stop offset="100%" stopColor="#784B05" />
          </linearGradient>
          <linearGradient id="towerBlue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#0B192C" />
          </linearGradient>
        </defs>

        {/* Skyscraper Towers in Background */}
        <g transform="translate(115, 20)">
          {/* Left building */}
          <path d="M5 45 L15 35 L23 37 L23 75 L5 75 Z" fill="url(#towerBlue)" />
          {/* Center tall golden tower */}
          <path d="M23 75 L23 15 L32 0 L37 12 L37 75 Z" fill="url(#towerGold)" />
          {/* Right angled tower */}
          <path d="M37 75 L37 18 L46 28 L46 75 Z" fill="url(#towerBlue)" />
          {/* Far right tower */}
          <path d="M46 75 L46 38 L54 44 L54 75 Z" fill="url(#towerGold)" />
        </g>

        {/* Dynamic Blue Water Waves (Left) */}
        <path
          d="M125 72 C90 62 50 65 35 90 C22 110 25 138 42 152 C30 140 30 115 48 95 C68 75 98 73 125 72 Z"
          fill="url(#waveBlueGrad)"
        />
        <path
          d="M110 82 C80 72 45 80 32 108 C24 125 28 145 42 160 C32 145 32 125 45 105 C62 82 85 82 110 82 Z"
          fill="#3B82F6"
          opacity="0.8"
        />
        <path
          d="M130 92 C95 86 60 95 48 120 C40 138 45 158 60 170 C48 155 46 136 58 120 C72 100 100 95 130 92 Z"
          fill="#1E40AF"
        />

        {/* Golden Base Arc / Ring */}
        <path
          d="M45 150 C75 185 170 185 205 145 C190 170 105 175 60 155 Z"
          fill="url(#goldGrad1)"
        />
        <path
          d="M80 162 C125 178 175 165 210 135 C185 158 130 168 80 162 Z"
          fill="url(#goldGrad2)"
        />

        {/* "SSN" 3D Monogram Letters */}
        <g id="SSN-Letters">
          {/* First 'S' - Deep Blue/Gold combo */}
          <path
            d="M95 125 C92 110 80 105 68 112 C58 118 56 128 62 135 C68 142 82 148 88 155 C95 163 92 175 80 180 C68 185 52 178 48 165 L58 162 C60 170 70 174 76 170 C82 166 84 158 78 152 C72 145 58 140 52 132 C45 122 50 108 62 102 C78 95 95 102 98 118 Z"
            fill="url(#navyGrad1)"
          />
          <path
            d="M92 123 C89 111 79 107 69 113 C60 119 59 127 64 133 C70 140 84 146 89 153 C93 158 91 166 83 171 L86 174 C96 167 98 156 92 149 C86 142 74 136 68 130 C64 125 65 119 72 115 C80 110 88 114 90 123 Z"
            fill="url(#goldGrad1)"
          />

          {/* Second 'S' - Bright Gold */}
          <path
            d="M142 125 C139 110 127 105 115 112 C105 118 103 128 109 135 C115 142 129 148 135 155 C142 163 139 175 127 180 C115 185 99 178 95 165 L105 162 C107 170 117 174 123 170 C129 166 131 158 125 152 C119 145 105 140 99 132 C92 122 97 108 109 102 C125 95 142 102 145 118 Z"
            fill="url(#goldGrad1)"
          />
          <path
            d="M138 125 C136 113 126 108 116 114 C108 119 107 127 111 133 C117 139 129 145 134 151 C140 159 137 171 127 176 L125 171 C133 167 134 158 129 152 C123 146 111 141 106 135 C101 127 103 117 113 112 C123 107 135 112 138 125 Z"
            fill="url(#goldGrad2)"
          />

          {/* 'N' - Navy & Gold Intertwined */}
          <path
            d="M152 105 L164 105 L164 165 L152 165 Z"
            fill="url(#navyGrad1)"
          />
          <path
            d="M162 105 L195 160 L204 154 L170 102 Z"
            fill="url(#goldGrad1)"
          />
          <path
            d="M192 105 L204 105 L204 175 L192 175 Z"
            fill="url(#navyGrad1)"
          />
        </g>
      </svg>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-serif tracking-wider font-extrabold text-xl sm:text-2xl ${
                theme === "dark" ? "text-amber-400" : "text-slate-900"
              }`}
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              SSN
            </span>
            <span
              className={`font-serif tracking-widest font-bold text-lg sm:text-xl ${
                theme === "dark" ? "text-slate-100" : "text-slate-800"
              }`}
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              WEALTH CAPITAL
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="h-[1px] w-6 bg-gradient-to-r from-transparent via-amber-400 to-amber-500"></span>
            <p className="text-[11px] sm:text-xs text-amber-400 font-medium tracking-wide">
              Your Trusted Financial Partner
            </p>
            <span className="h-[1px] w-6 bg-gradient-to-l from-transparent via-amber-400 to-amber-500"></span>
          </div>
          <p className="text-[9.5px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">
            SSN WEALTH & ESTATES (OPC) PRIVATE LIMITED
          </p>
        </div>
      )}
    </div>
  );
}
