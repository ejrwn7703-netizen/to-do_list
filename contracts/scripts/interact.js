// scripts/interact.js
// 배포된 TodoList 컨트랙트의 주요 함수를 직접 호출하여 동작을 검증하는 스크립트.
// 실행: npx hardhat run scripts/interact.js --network sepolia
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const Priority = { LOW: 0, MEDIUM: 1, HIGH: 2 };

function etherscanTx(hash) {
  return `https://sepolia.etherscan.io/tx/${hash}`;
}

async function sendAndWait(label, txPromise) {
  process.stdout.write(`  [TX] ${label}...`);
  const tx = await txPromise;
  const receipt = await tx.wait();
  console.log(
    ` 완료 | gas: ${receipt.gasUsed.toLocaleString()} | ${etherscanTx(receipt.hash)}`
  );
  return receipt;
}

async function main() {
  // 배포 정보 로드
  const deploymentsPath = path.join(__dirname, "..", "deployments.json");
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error(
      "contracts/deployments.json 파일이 없습니다. 먼저 deploy.js를 실행해주세요."
    );
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  const contractAddress = deployments.contractAddress;

  console.log("===========================================");
  console.log("  BlockTodo - 배포된 컨트랙트 상호작용 테스트");
  console.log("===========================================");
  console.log("컨트랙트 :", contractAddress);
  console.log(
    "Etherscan : https://sepolia.etherscan.io/address/" + contractAddress
  );
  console.log("");

  const [deployer] = await ethers.getSigners();
  console.log("사용 지갑 :", deployer.address);

  const TodoList = await ethers.getContractFactory("TodoList");
  const todoList = TodoList.attach(contractAddress);

  // -------------------------------------------------------
  // 1. 카테고리 추가
  // -------------------------------------------------------
  console.log("\n[1] 카테고리 추가");
  await sendAndWait(
    "addCategory('업무')",
    todoList.connect(deployer).addCategory("업무")
  );
  await sendAndWait(
    "addCategory('개인')",
    todoList.connect(deployer).addCategory("개인")
  );

  const cats = await todoList.connect(deployer).getCategories();
  console.log(
    "  getCategories →",
    cats.map((c) => `[${c.id}] ${c.name}`).join(", ")
  );

  const catId = cats[0].id; // 업무 카테고리 ID

  // -------------------------------------------------------
  // 2. Todo 추가
  // -------------------------------------------------------
  console.log("\n[2] Todo 추가");
  await sendAndWait(
    "addTodo(HIGH, 마감일 없음)",
    todoList.connect(deployer).addTodo(
      "Sepolia 배포 확인",
      "배포 후 interact.js로 동작 검증",
      catId,
      Priority.HIGH,
      0
    )
  );
  await sendAndWait(
    "addTodo(MEDIUM, 마감일 있음)",
    todoList.connect(deployer).addTodo(
      "프론트엔드 연동",
      "ethers.js로 컨트랙트 연결",
      catId,
      Priority.MEDIUM,
      Math.floor(Date.now() / 1000) + 86400 * 7 // 7일 후
    )
  );

  let todos = await todoList.connect(deployer).getTodos();
  console.log(
    "  getTodos →",
    todos.map((t) => `[${t.id}] ${t.title} (priority=${t.priority})`).join("\n             ")
  );

  const todoId = todos[0].id;

  // -------------------------------------------------------
  // 3. Todo 완료 토글
  // -------------------------------------------------------
  console.log("\n[3] 완료 토글");
  await sendAndWait(
    `toggleComplete(todoId=${todoId})`,
    todoList.connect(deployer).toggleComplete(todoId)
  );

  const toggled = await todoList.connect(deployer).getTodoById(todoId);
  console.log(`  getTodoById → isCompleted: ${toggled.isCompleted}`);

  // -------------------------------------------------------
  // 4. Todo 수정
  // -------------------------------------------------------
  console.log("\n[4] Todo 수정");
  await sendAndWait(
    `updateTodo(todoId=${todoId})`,
    todoList.connect(deployer).updateTodo(
      todoId,
      "Sepolia 배포 확인 (완료됨)",
      "interact.js 검증 완료",
      catId,
      Priority.HIGH,
      0
    )
  );

  const updated = await todoList.connect(deployer).getTodoById(todoId);
  console.log(`  title: "${updated.title}"`);

  // -------------------------------------------------------
  // 5. Todo 삭제
  // -------------------------------------------------------
  console.log("\n[5] Todo 삭제");
  await sendAndWait(
    `deleteTodo(todoId=${todoId})`,
    todoList.connect(deployer).deleteTodo(todoId)
  );

  todos = await todoList.connect(deployer).getTodos();
  console.log(`  getTodos 남은 개수: ${todos.length}`);

  // -------------------------------------------------------
  // 6. 카테고리 삭제 (Todo 없는 카테고리만 가능)
  // -------------------------------------------------------
  console.log("\n[6] 카테고리 삭제 시도 (Todo 있는 catId 삭제 → revert 예상)");
  // catId(업무)에는 아직 todos[1]이 살아있으므로 revert 되어야 함
  try {
    await todoList.connect(deployer).deleteCategory(catId);
    console.log("  경고: revert되지 않았습니다. 확인 필요.");
  } catch (err) {
    const reason = err.reason ?? err.message.split("(")[0].trim();
    console.log(`  예상대로 revert: "${reason}"`);
  }

  // -------------------------------------------------------
  // 결과 요약
  // -------------------------------------------------------
  console.log("\n==========================================");
  console.log("  모든 상호작용 테스트 완료!");
  console.log("==========================================");
  console.log(
    "Etherscan: https://sepolia.etherscan.io/address/" + contractAddress
  );
}

main().catch((error) => {
  console.error("\n상호작용 실패:", error.message);
  process.exitCode = 1;
});
