# BlockTodo — 블록체인 기반 To-Do List

Ethereum Sepolia 테스트넷에서 동작하는 블록체인 기반 할 일 관리 앱입니다.
MetaMask 지갑 하나로 로그인하고, 모든 데이터는 온체인에 저장됩니다.

---

## 배포 URL

https://blocktodo.pages.dev

---

## 스마트 컨트랙트 정보

| 항목 | 내용 |
|------|------|
| 네트워크 | Ethereum Sepolia Testnet |
| 컨트랙트 주소 | `0x7C23f1c65Ab6E850CC069Abc6AaBb56761F25A39` |
| Etherscan | https://sepolia.etherscan.io/address/0x7C23f1c65Ab6E850CC069Abc6AaBb56761F25A39 |
| 솔리디티 버전 | `^0.8.20` |

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 스마트 컨트랙트 | Solidity ^0.8.20 (Hardhat) |
| 프론트엔드 | React 19 + Vite |
| Web3 | ethers.js v6 |
| CSS | Tailwind CSS v3 |
| 지갑 | MetaMask |
| 배포 | Cloudflare Pages |

---

## 폴더 구조

```
to-do_list/            <- 프로젝트 루트 (git 저장소)
├── frontend/          <- React 앱 (npm 명령은 여기서 실행)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── wrangler.toml
├── contracts/         <- Hardhat + Solidity
└── README.md
```

---

## 로컬 실행 방법

### 사전 준비

- Node.js 18+ 설치
- MetaMask 브라우저 확장 설치
- Sepolia 테스트 ETH 보유 (https://sepoliafaucet.com)

### 환경 변수 설정

```bash
cd to-do_list/frontend
cp .env.example .env
```

`.env` 파일을 열어 값을 확인합니다. 컨트랙트 주소는 이미 설정되어 있습니다:

```
VITE_CONTRACT_ADDRESS=0x7C23f1c65Ab6E850CC069Abc6AaBb56761F25A39
VITE_ETHERSCAN_URL=https://sepolia.etherscan.io
```

### 의존성 설치 및 개발 서버 실행

```bash
cd to-do_list/frontend    # ← 반드시 이 폴더에서 실행
npm install
npm run dev
```

브라우저에서 http://localhost:5173 접속 후 MetaMask로 Sepolia 네트워크에 연결합니다.

---

## Cloudflare Pages 로컬 테스트

빌드 결과물을 Cloudflare 환경과 동일하게 로컬에서 테스트합니다.

```bash
cd to-do_list/frontend    # ← 반드시 이 폴더에서 실행
npm run build
npm run pages:dev         # http://localhost:4173 에서 미리보기
```

---

## Cloudflare Pages 배포

### 1. Wrangler 로그인

```bash
cd to-do_list/frontend
npx wrangler login        # 브라우저에서 sd27649@naver.com 계정으로 인증
```

### 2. 배포 실행

```bash
cd to-do_list/frontend    # ← 반드시 이 폴더에서 실행
npm run build
npm run pages:deploy
```

### 3. 환경 변수 등록 (최초 1회)

Cloudflare Dashboard → Pages → blocktodo → Settings → Environment variables 에서 아래 값을 추가합니다:

| 변수명 | 값 |
|--------|-----|
| `VITE_CONTRACT_ADDRESS` | `0x7C23f1c65Ab6E850CC069Abc6AaBb56761F25A39` |
| `VITE_ETHERSCAN_URL` | `https://sepolia.etherscan.io` |

---

## 주요 기능

- MetaMask 지갑 연결 / 연결 해제
- Sepolia 네트워크 자동 감지 및 전환 유도
- 카테고리 추가 / 삭제 (온체인)
- 할 일 추가 / 편집 / 삭제 / 완료 토글 (온체인)
- 상태 · 카테고리 · 우선순위 필터 + 정렬
- D-day 표시 (마감일 기준)
- 트랜잭션 처리 중 오버레이 + Etherscan 링크
- 가스비 예상치 실시간 표시

---

## 주의사항

온체인에 기록된 데이터는 누구나 조회할 수 있습니다.
민감한 개인정보는 입력하지 마세요.