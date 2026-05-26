import { CONTRACT_ADDRESS, ETHERSCAN_URL } from "../../utils/constants";

const DEPLOYED_AT = "2026-05-26T15:51:49.373Z";
const DEPLOYER_ADDRESS = "0x5fac31FFeC16e2CabA094004476E24035df7bAd3";
const DEPLOY_TX = "0x80b52642e85186abf34adb447e27f579acfa822ec0a0ad3d11bff74e0de98393";

function ExternalLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-indigo-600 hover:underline break-all font-mono text-xs"
    >
      {children}
    </a>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-col gap-0.5">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-2xl font-bold text-gray-800">{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

export default function AdminPanel({ onClose, todos, categories, account }) {
  const totalTodos = todos.length;
  const completedTodos = todos.filter((t) => t.isCompleted).length;
  const activeTodos = totalTodos - completedTodos;
  const completionRate =
    totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  const deployedDate = new Date(DEPLOYED_AT).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-800">관리자 패널</span>
          <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium">
            ADMIN
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          ✕
        </button>
      </div>

      <div className="px-6 py-5 space-y-6 max-h-[75vh] overflow-y-auto">
        {/* 내 사용 현황 */}
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            내 사용 현황
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="전체 할 일" value={totalTodos} />
            <StatCard label="완료" value={completedTodos} sub={`완료율 ${completionRate}%`} />
            <StatCard label="진행 중" value={activeTodos} />
            <StatCard label="카테고리" value={categories.length} />
          </div>
        </section>

        {/* 컨트랙트 정보 */}
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            컨트랙트 정보
          </h3>
          <div className="bg-gray-50 rounded-xl divide-y divide-gray-200">
            <InfoRow label="네트워크">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                Sepolia Testnet
              </span>
            </InfoRow>
            <InfoRow label="컨트랙트 주소">
              <ExternalLink href={`${ETHERSCAN_URL}/address/${CONTRACT_ADDRESS}`}>
                {CONTRACT_ADDRESS}
              </ExternalLink>
            </InfoRow>
            <InfoRow label="배포자 주소">
              <ExternalLink href={`${ETHERSCAN_URL}/address/${DEPLOYER_ADDRESS}`}>
                {short(DEPLOYER_ADDRESS)}
              </ExternalLink>
            </InfoRow>
            <InfoRow label="배포 트랜잭션">
              <ExternalLink href={`${ETHERSCAN_URL}/tx/${DEPLOY_TX}`}>
                {short(DEPLOY_TX)}
              </ExternalLink>
            </InfoRow>
            <InfoRow label="배포 일시">
              <span className="text-xs text-gray-600">{deployedDate}</span>
            </InfoRow>
          </div>
        </section>

        {/* 연결된 지갑 */}
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            연결된 지갑
          </h3>
          <div className="bg-gray-50 rounded-xl">
            <InfoRow label="지갑 주소">
              <ExternalLink href={`${ETHERSCAN_URL}/address/${account}`}>
                {account}
              </ExternalLink>
            </InfoRow>
          </div>
        </section>

        {/* 안내 */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-xs text-amber-700 leading-relaxed">
            이 컨트랙트는 업그레이드 불가(immutable)한 구조입니다.
            <br />
            사용자 데이터는 각 지갑 주소 단위로 완전히 격리되어 있으며,
            관리자라도 타인의 데이터에 접근하거나 수정할 수 없습니다.
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <span className="text-xs text-gray-400 shrink-0 pt-0.5">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

function short(addr) {
  return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
}
