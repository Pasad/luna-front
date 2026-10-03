// app/humidity-map/page.tsx
import type { ComponentProps } from "react";
import { publicFetch } from "@/lib/api";
import MapCanvas from "@/components/MapCanvas";

// 요청마다 최신 데이터를 가져옵니다. (force-dynamic 아래에서는 revalidate가 무시되므로 no-store로 명시)
export const dynamic = "force-dynamic";

type Locations = ComponentProps<typeof MapCanvas>["locations"];

async function getWeatherData(): Promise<{ locations: Locations; failed: boolean }> {
  try {
    // 공개 날씨 데이터라 쿠키를 보내지 않으므로 serverFetch 대신 fetch를 직접 사용
    const res = await publicFetch("/api/weather/visibility/", { cache: "no-store" });

    if (!res.ok) throw new Error(`status ${res.status}`);

    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("예상과 다른 응답 형식");

    return { locations: data, failed: false };
  } catch (err) {
    console.error("Data Load Error", err);
    return { locations: [], failed: true };
  }
}

export default async function HumidityMapPage() {
  const { locations, failed } = await getWeatherData();
  const isEmpty = !failed && locations.length === 0;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#4A4543]">
      <main className="pt-12 pb-20 px-6 flex flex-col items-center">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-[#2D2A28] mb-4 tracking-tight leading-tight">
            제주 현재 시간 습도 맵
          </h1>
        </header>

        {(failed || isEmpty) && (
          <div
            role="alert"
            className="w-full max-w-6xl mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800"
          >
            {failed
              ? "습도 데이터를 불러오지 못했습니다. 서버가 시작되는 중일 수 있으니 잠시 후 새로고침해 주세요."
              : "현재 표시할 관측 데이터가 없습니다."}
          </div>
        )}

        <div className="w-full max-w-6xl h-[700px] bg-white rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.06)] overflow-hidden border border-white relative">
          <MapCanvas locations={locations} />
        </div>

        <footer className="mt-24 text-center border-t border-[#F0EDE5] pt-12 w-full max-w-6xl">
          <p className="text-xs text-[#8E8781] leading-relaxed">
            본 서비스는 기상청 초단기실황 공공데이터를 활용합니다.<br />
            <strong>저작자표시:</strong> 기상청 (공공데이터포털) | <strong>이용허락범위:</strong> 공공누리 제1유형
          </p>
          <p className="text-[10px] text-[#CCC5C0] mt-6 uppercase tracking-[0.3em] font-medium">
            © 2026 LUNA JEJU. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}