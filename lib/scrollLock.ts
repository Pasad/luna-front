// lib/scrollLock.ts
let lockCount = 0;
let originalOverflow = "";

/** body 스크롤을 잠급니다. 반환된 함수를 호출하면 해제됩니다. 중첩 호출에 안전합니다. */
export function lockBodyScroll(): () => void {
  if (lockCount === 0) {
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount++;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount--;
    if (lockCount === 0) document.body.style.overflow = originalOverflow;
  };
}