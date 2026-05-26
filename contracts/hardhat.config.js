require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/**
 * 환경변수에서 Sepolia 계정을 안전하게 로드한다.
 * 플레이스홀더 값이나 짧은 키를 .env에 입력해도 로컬 테스트가 깨지지 않는다.
 */
function getSepoliaAccounts() {
  const raw = (process.env.DEPLOYER_PRIVATE_KEY || "").trim();
  // 플레이스홀더 또는 비어있으면 빈 배열 반환
  if (!raw || raw.startsWith("your_") || raw.length < 32) return [];
  return [raw.startsWith("0x") ? raw : `0x${raw}`];
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: getSepoliaAccounts(),
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },
};
