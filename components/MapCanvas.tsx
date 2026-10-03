// components/MapCanvas.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    kakao: any;
  }
}

interface LocationData {
  name: string;
  lat: number;
  lng: number;
  humidity: string;
  temp: string;
}

interface MapCanvasProps {
  locations: LocationData[];
}

const JEJU_CENTER = { lat: 33.3617, lng: 126.545 }; // 한라산 중심 좌표
const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_CLIENT_ID;

// 좌표/필드가 비정상인 데이터는 걸러냅니다 (백엔드 응답을 신뢰하지 않기)
function isValidLocation(loc: LocationData): boolean {
  return (
    loc != null &&
    Number.isFinite(loc.lat) &&
    Number.isFinite(loc.lng) &&
    loc.lat >= 32 && loc.lat <= 35 &&   // 제주 일대 범위
    loc.lng >= 125 && loc.lng <= 128
  );
}

// 텍스트 한 줄을 만드는 헬퍼
function createTextLine(text: unknown, style: Partial<CSSStyleDeclaration>): HTMLDivElement {
  const el = document.createElement("div");
  el.textContent = String(text ?? "");
  Object.assign(el.style, style);
  return el;
}

// 오버레이 카드를 DOM으로 직접 생성
function createOverlayContent(loc: LocationData): HTMLElement {
  const isHigh = parseInt(loc.humidity, 10) >= 90;

  // 중심점 기준으로 라벨을 바깥쪽으로 밀어내는 로직
  const offsetLat = loc.lat - JEJU_CENTER.lat;
  const offsetLng = loc.lng - JEJU_CENTER.lng;

  const card = document.createElement("div");
  Object.assign(card.style, {
    position: "absolute",
    transform: `translate(${offsetLng > 0 ? "5px" : "-105%"}, ${offsetLat > 0 ? "-45px" : "5px"})`,
    background: isHigh ? "rgba(37, 99, 235, 0.95)" : "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(10px)",
    padding: "8px 12px",
    borderRadius: "14px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
    border: `1px solid ${isHigh ? "#2563eb" : "rgba(255,255,255,1)"}`,
    minWidth: "75px",
    textAlign: "center",
    pointerEvents: "none",
    transition: "all 0.3s ease",
  } satisfies Partial<CSSStyleDeclaration>);

  card.appendChild(
    createTextLine(loc.name, {
      fontSize: "8px",
      fontWeight: "800",
      color: isHigh ? "#FFFFFF" : "#A7A29F",
      marginBottom: "1px",
      letterSpacing: "-0.02em",
    })
  );
  card.appendChild(
    createTextLine(`${isHigh ? "💧" : ""}${loc.humidity ?? ""}`, {
      fontSize: "15px",
      fontWeight: "900",
      color: isHigh ? "#FFFFFF" : "#2D2A28",
      lineHeight: "1.1",
    })
  );
  card.appendChild(
    createTextLine(loc.temp, {
      fontSize: "9px",
      fontWeight: "700",
      color: isHigh ? "rgba(255,255,255,0.8)" : "#A7A29F",
    })
  );

  return card;
}

export default function MapCanvas({ locations }: MapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null); // 지도 인스턴스는 한 번만 생성해서 재사용
  const [sdkReady, setSdkReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const hasKey = Boolean(KAKAO_APP_KEY);
  const showError = !hasKey || loadFailed;

  // SDK 스크립트 준비 완료 시 호출 (이미 로드된 상태에서 재진입해도 호출됨)
  const handleSdkReady = () => {
    if (!window.kakao?.maps) {
      setLoadFailed(true);
      return;
    }
    // autoload=false 이므로 load()로 내부 모듈 초기화 후 콜백 실행
    window.kakao.maps.load(() => setSdkReady(true));
  };

  // 지도 생성 + 오버레이 렌더링 (진입점은 이 effect 하나뿐)
  useEffect(() => {
    if (!sdkReady || !mapContainerRef.current) return;
    const { kakao } = window;

    if (!mapRef.current) {
      mapRef.current = new kakao.maps.Map(mapContainerRef.current, {
        center: new kakao.maps.LatLng(JEJU_CENTER.lat, JEJU_CENTER.lng),
        level: 10, // 제주도 전역이 한눈에 보이는 축적 레벨
      });
    }

    const overlays = (locations ?? []).filter(isValidLocation).map(
      (loc) =>
        new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(loc.lat, loc.lng),
          content: createOverlayContent(loc),
          map: mapRef.current,
        })
    );

    // locations 변경 또는 언마운트 시 이전 오버레이 제거
    return () => {
      overlays.forEach((overlay) => overlay.setMap(null));
    };
  }, [sdkReady, locations]);

  return (
    <>
      {hasKey && !loadFailed && (
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(
            KAKAO_APP_KEY as string
          )}&autoload=false`}
          strategy="afterInteractive"
          onReady={handleSdkReady}
          onError={() => setLoadFailed(true)}
        />
      )}

      <div ref={mapContainerRef} className="w-full h-full" />

      {showError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 text-center px-6">
          <span className="text-3xl mb-3">🗺️</span>
          <p className="text-sm font-semibold text-[#2D2A28]">지도를 불러오지 못했습니다.</p>
          <p className="text-xs text-[#8E8781] mt-1">
            잠시 후 새로고침해 주세요. 문제가 계속되면 관리자에게 문의해 주세요.
          </p>
        </div>
      )}
    </>
  );
}