// scripts/deploy.js
// Sepolia 테스트넷에 TodoList 컨트랙트를 배포하는 스크립트.
// 실행: npx hardhat run scripts/deploy.js --network sepolia
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("===========================================");
  console.log("  BlockTodo - TodoList 컨트랙트 배포");
  console.log("===========================================");
  console.log("배포자 주소 :", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("배포자 잔액 :", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    throw new Error(
      "잔액이 0입니다. https://faucets.chain.link/sepolia 에서 Sepolia ETH를 받아주세요."
    );
  }

  // 가스 예상치 확인
  const TodoList = await ethers.getContractFactory("TodoList");
  const deployTx = await TodoList.getDeployTransaction();
  const estimatedGas = await ethers.provider.estimateGas(deployTx);
  const feeData = await ethers.provider.getFeeData();
  const estimatedCost = estimatedGas * (feeData.gasPrice ?? 0n);
  console.log("예상 가스  :", estimatedGas.toString());
  console.log("예상 비용  :", ethers.formatEther(estimatedCost), "ETH");

  if (balance < estimatedCost) {
    throw new Error(
      `잔액(${ethers.formatEther(balance)} ETH)이 배포 비용(${ethers.formatEther(estimatedCost)} ETH)보다 부족합니다.`
    );
  }

  console.log("\n컨트랙트 배포 중...");
  const todoList = await TodoList.deploy();

  const deployHash = todoList.deploymentTransaction()?.hash ?? "unknown";
  console.log("트랜잭션 해시:", deployHash);
  console.log("블록 포함 대기 중...");

  await todoList.waitForDeployment();
  const contractAddress = await todoList.getAddress();

  console.log("\n==========================================");
  console.log("  배포 완료!");
  console.log("==========================================");
  console.log("컨트랙트 주소 :", contractAddress);
  console.log(
    "Etherscan    : https://sepolia.etherscan.io/address/" + contractAddress
  );

  // 배포 정보를 contracts/deployments.json에 저장
  const deployInfo = {
    network: "sepolia",
    chainId: 11155111,
    contractAddress,
    deployerAddress: deployer.address,
    txHash: deployHash,
    deployedAt: new Date().toISOString(),
  };

  const outPath = path.join(__dirname, "..", "deployments.json");
  fs.writeFileSync(outPath, JSON.stringify(deployInfo, null, 2));
  console.log("\n배포 정보 저장 완료: contracts/deployments.json");

  // frontend/.env 업데이트 안내
  const frontendEnvPath = path.join(__dirname, "..", "..", "frontend", ".env");
  console.log("\n----------------------------------------------");
  console.log("[안내] frontend/.env 를 아래 내용으로 업데이트하세요:");
  console.log(`  VITE_CONTRACT_ADDRESS=${contractAddress}`);

  // frontend/.env 파일이 있으면 컨트랙트 주소를 자동으로 업데이트
  if (fs.existsSync(frontendEnvPath)) {
    let envContent = fs.readFileSync(frontendEnvPath, "utf8");
    if (envContent.includes("VITE_CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(
        /VITE_CONTRACT_ADDRESS=.*/,
        `VITE_CONTRACT_ADDRESS=${contractAddress}`
      );
    } else {
      envContent += `\nVITE_CONTRACT_ADDRESS=${contractAddress}`;
    }
    fs.writeFileSync(frontendEnvPath, envContent);
    console.log("  → frontend/.env 자동 업데이트 완료");
  }

  console.log("\n----------------------------------------------");
  console.log("[다음 단계] Etherscan 소스코드 검증:");
  console.log(
    `  cd contracts && npx hardhat verify --network sepolia ${contractAddress}`
  );
  console.log("----------------------------------------------");
}

main().catch((error) => {
  console.error("\n배포 실패:", error.message);
  process.exitCode = 1;
});
