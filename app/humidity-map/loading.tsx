// app/humidity-map/loading.tsx
export default function HumidityMapLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF9F6] flex flex-col items-center justify-center text-[#4A4543]">
      {/* 로딩 스피너 애니메이션 */}
      <div className="w-12 h-12 border-4 border-[#F0EDE5] border-t-teal-500 rounded-full animate-spin mb-4"></div>
      
      <h2 className="text-lg font-bold text-[#2D2A28] mb-1">
        제주 습도 지도를 그려내고 있습니다
      </h2>
      <p className="text-sm text-[#8E8781] animate-pulse">
        콜드 스타트(Cold Start)로 최초 접속시 <span className="text-teal-600 font-bold">약 30초 ~ 1분</span> 정도 시간이 걸릴 수 있습니다. 잠시만 기다려주시면 곧 연결됩니다.
      </p>
    </div>
  );
}