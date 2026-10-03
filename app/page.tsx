import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF9F6] text-[#4A4543] flex flex-col items-center px-6 py-16 md:py-24">
      
      {/* 히어로 섹션 */}
      <div className="text-center max-w-2xl mb-16 md:mb-20 animate-fade-in">
        <span className="text-xs font-bold uppercase tracking-widest text-teal-600 bg-teal-50 px-4 py-1.5 rounded-full border border-teal-100/50 mb-4 inline-block">
          Luna Community & Weather
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-[#2D2A28] tracking-tight leading-tight mb-4 mt-2">
          제주의 날씨와 일상을 <br className="sm:hidden" /> 한눈에 담다
        </h1>
        <p className="text-sm md:text-base text-[#8E8781] leading-relaxed font-medium max-w-lg mx-auto">
          기상청 초단기실황 공공데이터로 제주의 습도를 확인하고, <br className="hidden sm:inline" />
          유용한 정보를 자유롭게 나누어 보세요.
        </p>
      </div>

      {/* 주요 서비스 바로가기 카드 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        
        {/* 카드 1: 습도 맵 */}
        <Link 
          href="/humidity-map" 
          className="group bg-white p-8 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.04)] border border-[#F0EDE5] hover:border-teal-300 transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="bg-teal-50 p-4 rounded-2xl group-hover:bg-teal-500 transition-colors duration-300">
              <span className="text-2xl group-hover:filter group-hover:brightness-0 group-hover:invert">💧</span>
            </div>
            <span className="text-[#CCC5C0] font-bold text-sm tracking-wider group-hover:text-teal-500 transition-colors">EXPLORE →</span>
          </div>
          <h3 className="text-2xl font-black text-[#2D2A28] mb-3">제주 습도 맵</h3>
          <p className="text-sm text-[#8E8781] leading-relaxed">
            제주 전역의 습도와 기온 정보를 지도 위에서 한눈에 시각적으로 확인하세요.
          </p>
        </Link>

        {/* 카드 2: 커뮤니티 게시판 */}
        <Link 
          href="/board" 
          className="group bg-white p-8 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.04)] border border-[#F0EDE5] hover:border-amber-300 transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="bg-amber-50 p-4 rounded-2xl group-hover:bg-amber-500 transition-colors duration-300">
              <span className="text-2xl group-hover:filter group-hover:brightness-0 group-hover:invert">📝</span>
            </div>
            <span className="text-[#CCC5C0] font-bold text-sm tracking-wider group-hover:text-amber-500 transition-colors">COMMUNITY →</span>
          </div>
          <h3 className="text-2xl font-black text-[#2D2A28] mb-3">게시판</h3>
          <p className="text-sm text-[#8E8781] leading-relaxed">
            다양한 정보와 의견을 자유롭게 나누는 소통의 공간입니다.
          </p>
        </Link>

      </div>
    </div>
  );
}