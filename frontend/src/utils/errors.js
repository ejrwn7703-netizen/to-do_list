const REVERT_MAP = {
  "Category name cannot be empty": "카테고리 이름을 입력해주세요.",
  "Category name too long": "카테고리 이름이 너무 깁니다. (최대 50자)",
  "Category has active todos": "이 카테고리에 할 일이 있어 삭제할 수 없습니다.",
  "Category not found": "카테고리를 찾을 수 없습니다.",
  "Title cannot be empty": "제목을 입력해주세요.",
  "Title too long": "제목이 너무 깁니다. (최대 100자)",
  "Description too long": "설명이 너무 깁니다. (최대 500자)",
  "Invalid category": "유효하지 않은 카테고리입니다.",
  "Invalid deadline": "마감일이 유효하지 않습니다. (현재 시각 이후여야 합니다)",
  "Todo not found": "할 일을 찾을 수 없습니다.",
  "Todo is deleted": "이미 삭제된 할 일입니다.",
};

export function parseContractError(e) {
  if (e.code === "INSUFFICIENT_FUNDS") {
    return "가스비가 부족합니다. Sepolia ETH Faucet에서 테스트 ETH를 충전해주세요.";
  }
  if (e.code === "NETWORK_ERROR") {
    return "네트워크 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.";
  }
  if (e.code === "TIMEOUT") {
    return "요청 시간이 초과되었습니다. 네트워크 상태를 확인하고 다시 시도해주세요.";
  }
  if (e.code === "UNPREDICTABLE_GAS_LIMIT") {
    const inner = e.error?.reason ?? e.error?.message ?? "";
    const mapped = matchRevert(inner);
    return mapped ?? "트랜잭션 예측에 실패했습니다. 입력 내용을 확인해주세요.";
  }

  // CALL_EXCEPTION (컨트랙트 revert)
  const reason = e.reason ?? e.data?.message ?? e.shortMessage ?? e.message ?? "";
  const mapped = matchRevert(reason);
  if (mapped) return mapped;

  // 알 수 없는 에러 — 원문에서 의미 있는 부분만 추출
  const raw = e.shortMessage ?? e.message ?? "알 수 없는 오류가 발생했습니다.";
  if (raw.length > 120) return raw.slice(0, 120) + "…";
  return raw;
}

function matchRevert(text) {
  if (!text) return null;
  for (const [key, val] of Object.entries(REVERT_MAP)) {
    if (text.includes(key)) return val;
  }
  return null;
}
