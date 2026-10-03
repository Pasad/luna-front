// lib/ownership.ts

interface Me {
  id?: number;
  username: string;
}

interface Owner {
  id?: number | null;        // 응답의 author_id
  username?: string | null;  // 응답의 author / author_username
}

/**
 * 현재 사용자가 리소스의 소유자인지 판별합니다. (UI 표시용, 실제 권한은 백엔드가 판단)
 * - 양쪽에 id가 있으면 id로 비교 (username 변경/재사용에 안전)
 * - 응답에 author_id가 없으면 username으로 대체 (백엔드 배포 순서가 어긋나도 동작)
 */
export function isResourceOwner(me: Me | null | undefined, owner: Owner): boolean {
  if (!me) return false;
  if (owner.id != null && me.id != null) return me.id === owner.id;
  return Boolean(owner.username) && me.username === owner.username;
}