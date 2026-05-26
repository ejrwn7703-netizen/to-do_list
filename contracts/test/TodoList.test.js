const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");

// Priority enum 매핑 (Solidity enum 순서와 일치)
const Priority = { LOW: 0n, MEDIUM: 1n, HIGH: 2n };

// =========================================================
// Fixtures
// =========================================================

async function deployFixture() {
  const [owner, user1, user2] = await ethers.getSigners();
  const TodoList = await ethers.getContractFactory("TodoList");
  const todoList = await TodoList.deploy();
  return { todoList, owner, user1, user2 };
}

/** owner에게 카테고리 하나(ID=1, "일반")를 미리 추가한 fixture */
async function withCategoryFixture() {
  const base = await deployFixture();
  await base.todoList.connect(base.owner).addCategory("일반");
  return base;
}

/** owner에게 카테고리 + Todo 하나를 미리 추가한 fixture */
async function withTodoFixture() {
  const base = await withCategoryFixture();
  await base.todoList
    .connect(base.owner)
    .addTodo("기본 할 일", "기본 설명", 1n, Priority.MEDIUM, 0n);
  return base;
}

// =========================================================
// Tests
// =========================================================

describe("TodoList", function () {
  // -------------------------------------------------------
  // 배포
  // -------------------------------------------------------
  describe("Deployment", function () {
    it("컨트랙트 주소가 유효해야 한다", async function () {
      const { todoList } = await loadFixture(deployFixture);
      expect(await todoList.getAddress()).to.be.properAddress;
    });

    it("초기 카테고리 목록은 비어 있어야 한다", async function () {
      const { todoList, owner } = await loadFixture(deployFixture);
      expect(await todoList.connect(owner).getCategories()).to.have.lengthOf(0);
    });

    it("초기 Todo 목록은 비어 있어야 한다", async function () {
      const { todoList, owner } = await loadFixture(deployFixture);
      expect(await todoList.connect(owner).getTodos()).to.have.lengthOf(0);
    });
  });

  // -------------------------------------------------------
  // addCategory
  // -------------------------------------------------------
  describe("addCategory", function () {
    it("카테고리를 추가하면 CategoryAdded 이벤트가 발생해야 한다", async function () {
      const { todoList, owner } = await loadFixture(deployFixture);
      await expect(todoList.connect(owner).addCategory("업무"))
        .to.emit(todoList, "CategoryAdded")
        .withArgs(owner.address, 1n);
    });

    it("추가된 카테고리가 getCategories에 반영되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(deployFixture);
      await todoList.connect(owner).addCategory("업무");
      await todoList.connect(owner).addCategory("개인");

      const cats = await todoList.connect(owner).getCategories();
      expect(cats).to.have.lengthOf(2);
      expect(cats[0].name).to.equal("업무");
      expect(cats[1].name).to.equal("개인");
      expect(cats[0].isActive).to.equal(true);
    });

    it("ID는 전역 카운터로 증가해야 한다", async function () {
      const { todoList, owner, user1 } = await loadFixture(deployFixture);
      await todoList.connect(owner).addCategory("오너 카테고리"); // ID=1
      await todoList.connect(user1).addCategory("유저1 카테고리"); // ID=2

      const ownerCats = await todoList.connect(owner).getCategories();
      const user1Cats = await todoList.connect(user1).getCategories();
      expect(ownerCats[0].id).to.equal(1n);
      expect(user1Cats[0].id).to.equal(2n);
    });

    it("빈 이름이면 revert 되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(deployFixture);
      await expect(
        todoList.connect(owner).addCategory("")
      ).to.be.revertedWith("Category name cannot be empty");
    });

    it("이름이 50자를 초과하면 revert 되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(deployFixture);
      await expect(
        todoList.connect(owner).addCategory("a".repeat(51))
      ).to.be.revertedWith("Category name too long");
    });

    it("정확히 50자 이름은 허용되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(deployFixture);
      await expect(
        todoList.connect(owner).addCategory("a".repeat(50))
      ).not.to.be.reverted;
    });

    it("사용자별로 독립적인 카테고리 공간을 가져야 한다", async function () {
      const { todoList, owner, user1 } = await loadFixture(deployFixture);
      await todoList.connect(owner).addCategory("오너");
      await todoList.connect(user1).addCategory("유저1");

      expect(await todoList.connect(owner).getCategories()).to.have.lengthOf(1);
      expect(await todoList.connect(user1).getCategories()).to.have.lengthOf(1);
    });
  });

  // -------------------------------------------------------
  // deleteCategory
  // -------------------------------------------------------
  describe("deleteCategory", function () {
    it("카테고리를 삭제하면 CategoryDeleted 이벤트가 발생해야 한다", async function () {
      const { todoList, owner } = await loadFixture(withCategoryFixture);
      await expect(todoList.connect(owner).deleteCategory(1n))
        .to.emit(todoList, "CategoryDeleted")
        .withArgs(owner.address, 1n);
    });

    it("삭제된 카테고리는 getCategories에 나타나지 않아야 한다", async function () {
      const { todoList, owner } = await loadFixture(withCategoryFixture);
      await todoList.connect(owner).deleteCategory(1n);
      expect(await todoList.connect(owner).getCategories()).to.have.lengthOf(0);
    });

    it("존재하지 않는 카테고리 삭제는 revert 되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(deployFixture);
      await expect(
        todoList.connect(owner).deleteCategory(999n)
      ).to.be.revertedWith("Category not found");
    });

    it("이미 삭제된 카테고리를 다시 삭제하면 revert 되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(withCategoryFixture);
      await todoList.connect(owner).deleteCategory(1n);
      await expect(
        todoList.connect(owner).deleteCategory(1n)
      ).to.be.revertedWith("Category not found");
    });

    it("활성 Todo가 있는 카테고리는 삭제 불가해야 한다", async function () {
      const { todoList, owner } = await loadFixture(withTodoFixture);
      await expect(
        todoList.connect(owner).deleteCategory(1n)
      ).to.be.revertedWith("Category has active todos");
    });

    it("Todo를 먼저 삭제한 후에는 카테고리를 삭제할 수 있어야 한다", async function () {
      const { todoList, owner } = await loadFixture(withTodoFixture);
      await todoList.connect(owner).deleteTodo(1n);
      await expect(todoList.connect(owner).deleteCategory(1n)).not.to.be.reverted;
    });
  });

  // -------------------------------------------------------
  // addTodo
  // -------------------------------------------------------
  describe("addTodo", function () {
    it("Todo를 추가하면 TodoAdded 이벤트가 발생해야 한다", async function () {
      const { todoList, owner } = await loadFixture(withCategoryFixture);
      await expect(
        todoList.connect(owner).addTodo("할 일", "설명", 1n, Priority.HIGH, 0n)
      )
        .to.emit(todoList, "TodoAdded")
        .withArgs(owner.address, 1n);
    });

    it("추가된 Todo의 모든 필드가 올바르게 저장되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(withCategoryFixture);
      const futureDeadline = BigInt((await time.latest()) + 86400); // 1일 후
      await todoList
        .connect(owner)
        .addTodo("제목", "상세 설명", 1n, Priority.MEDIUM, futureDeadline);

      const todos = await todoList.connect(owner).getTodos();
      expect(todos).to.have.lengthOf(1);
      const t = todos[0];
      expect(t.id).to.equal(1n);
      expect(t.title).to.equal("제목");
      expect(t.description).to.equal("상세 설명");
      expect(t.categoryId).to.equal(1n);
      expect(t.priority).to.equal(Priority.MEDIUM);
      expect(t.deadline).to.equal(futureDeadline);
      expect(t.isCompleted).to.equal(false);
      expect(t.isActive).to.equal(true);
      expect(t.createdAt).to.be.gt(0n);
    });

    it("빈 제목이면 revert 되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(withCategoryFixture);
      await expect(
        todoList.connect(owner).addTodo("", "", 1n, Priority.LOW, 0n)
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("제목이 100자를 초과하면 revert 되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(withCategoryFixture);
      await expect(
        todoList.connect(owner).addTodo("a".repeat(101), "", 1n, Priority.LOW, 0n)
      ).to.be.revertedWith("Title too long");
    });

    it("정확히 100자 제목은 허용되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(withCategoryFixture);
      await expect(
        todoList.connect(owner).addTodo("a".repeat(100), "", 1n, Priority.LOW, 0n)
      ).not.to.be.reverted;
    });

    it("설명이 500자를 초과하면 revert 되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(withCategoryFixture);
      await expect(
        todoList
          .connect(owner)
          .addTodo("제목", "a".repeat(501), 1n, Priority.LOW, 0n)
      ).to.be.revertedWith("Description too long");
    });

    it("정확히 500자 설명은 허용되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(withCategoryFixture);
      await expect(
        todoList
          .connect(owner)
          .addTodo("제목", "a".repeat(500), 1n, Priority.LOW, 0n)
      ).not.to.be.reverted;
    });

    it("유효하지 않은 카테고리 ID이면 revert 되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(withCategoryFixture);
      await expect(
        todoList.connect(owner).addTodo("제목", "", 999n, Priority.LOW, 0n)
      ).to.be.revertedWith("Invalid category");
    });

    it("categoryId=0이면 revert 되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(withCategoryFixture);
      await expect(
        todoList.connect(owner).addTodo("제목", "", 0n, Priority.LOW, 0n)
      ).to.be.revertedWith("Invalid category");
    });

    it("삭제된 카테고리로 Todo 추가 시 revert 되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(withCategoryFixture);
      await todoList.connect(owner).deleteCategory(1n);
      await expect(
        todoList.connect(owner).addTodo("제목", "", 1n, Priority.LOW, 0n)
      ).to.be.revertedWith("Invalid category");
    });

    it("마감일이 과거 시점이면 revert 되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(withCategoryFixture);
      const past = BigInt((await time.latest()) - 1);
      await expect(
        todoList.connect(owner).addTodo("제목", "", 1n, Priority.LOW, past)
      ).to.be.revertedWith("Invalid deadline");
    });

    it("마감일이 0이면 (마감일 없음) 허용되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(withCategoryFixture);
      await expect(
        todoList.connect(owner).addTodo("제목", "", 1n, Priority.LOW, 0n)
      ).not.to.be.reverted;
    });

    it("마감일이 미래 시점이면 허용되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(withCategoryFixture);
      const future = BigInt((await time.latest()) + 3600);
      await expect(
        todoList.connect(owner).addTodo("제목", "", 1n, Priority.LOW, future)
      ).not.to.be.reverted;
    });

    it("Todo ID는 전역 카운터로 사용자 간 중복 없이 증가해야 한다", async function () {
      const { todoList, owner, user1 } = await loadFixture(withCategoryFixture);
      await todoList.connect(user1).addCategory("유저1 카테고리"); // catId=2
      await todoList.connect(owner).addTodo("오너 Todo", "", 1n, Priority.LOW, 0n); // todoId=1
      await todoList.connect(user1).addTodo("유저1 Todo", "", 2n, Priority.LOW, 0n); // todoId=2

      const ownerTodos = await todoList.connect(owner).getTodos();
      const user1Todos = await todoList.connect(user1).getTodos();
      expect(ownerTodos[0].id).to.equal(1n);
      expect(user1Todos[0].id).to.equal(2n);
    });
  });

  // -------------------------------------------------------
  // updateTodo
  // -------------------------------------------------------
  describe("updateTodo", function () {
    it("Todo를 수정하면 TodoUpdated 이벤트가 발생해야 한다", async function () {
      const { todoList, owner } = await loadFixture(withTodoFixture);
      await expect(
        todoList.connect(owner).updateTodo(1n, "수정 제목", "", 1n, Priority.HIGH, 0n)
      )
        .to.emit(todoList, "TodoUpdated")
        .withArgs(owner.address, 1n);
    });

    it("수정 후 모든 필드가 갱신되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(withTodoFixture);
      await todoList
        .connect(owner)
        .updateTodo(1n, "새 제목", "새 설명", 1n, Priority.HIGH, 0n);
      const t = await todoList.connect(owner).getTodoById(1n);
      expect(t.title).to.equal("새 제목");
      expect(t.description).to.equal("새 설명");
      expect(t.priority).to.equal(Priority.HIGH);
    });

    it("수정 후 updatedAt이 createdAt보다 커야 한다", async function () {
      const { todoList, owner } = await loadFixture(withTodoFixture);
      const before = await todoList.connect(owner).getTodoById(1n);
      await time.increase(5);
      await todoList
        .connect(owner)
        .updateTodo(1n, "수정", "", 1n, Priority.LOW, 0n);
      const after = await todoList.connect(owner).getTodoById(1n);
      expect(after.updatedAt).to.be.gt(before.updatedAt);
    });

    it("isCompleted 상태는 updateTodo로 변경되지 않아야 한다", async function () {
      const { todoList, owner } = await loadFixture(withTodoFixture);
      await todoList.connect(owner).toggleComplete(1n); // true로
      await todoList
        .connect(owner)
        .updateTodo(1n, "수정", "", 1n, Priority.LOW, 0n);
      const t = await todoList.connect(owner).getTodoById(1n);
      expect(t.isCompleted).to.equal(true); // 여전히 완료 상태
    });

    it("존재하지 않는 Todo 수정은 revert 되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(withCategoryFixture);
      await expect(
        todoList.connect(owner).updateTodo(999n, "제목", "", 1n, Priority.LOW, 0n)
      ).to.be.revertedWith("Todo not found");
    });

    it("삭제된 Todo 수정은 revert 되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(withTodoFixture);
      await todoList.connect(owner).deleteTodo(1n);
      await expect(
        todoList.connect(owner).updateTodo(1n, "수정", "", 1n, Priority.LOW, 0n)
      ).to.be.revertedWith("Todo is deleted");
    });

    it("수정 시에도 제목 길이 제한이 적용되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(withTodoFixture);
      await expect(
        todoList
          .connect(owner)
          .updateTodo(1n, "a".repeat(101), "", 1n, Priority.LOW, 0n)
      ).to.be.revertedWith("Title too long");
    });
  });

  // -------------------------------------------------------
  // deleteTodo
  // -------------------------------------------------------
  describe("deleteTodo", function () {
    it("Todo를 삭제하면 TodoDeleted 이벤트가 발생해야 한다", async function () {
      const { todoList, owner } = await loadFixture(withTodoFixture);
      await expect(todoList.connect(owner).deleteTodo(1n))
        .to.emit(todoList, "TodoDeleted")
        .withArgs(owner.address, 1n);
    });

    it("삭제된 Todo는 getTodos에 나타나지 않아야 한다 (논리 삭제)", async function () {
      const { todoList, owner } = await loadFixture(withTodoFixture);
      await todoList.connect(owner).deleteTodo(1n);
      expect(await todoList.connect(owner).getTodos()).to.have.lengthOf(0);
    });

    it("삭제된 Todo는 getTodoById로 조회되지 않아야 한다", async function () {
      const { todoList, owner } = await loadFixture(withTodoFixture);
      await todoList.connect(owner).deleteTodo(1n);
      await expect(
        todoList.connect(owner).getTodoById(1n)
      ).to.be.revertedWith("Todo is deleted");
    });

    it("여러 Todo 중 특정 하나만 삭제해도 나머지는 조회되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(withCategoryFixture);
      await todoList.connect(owner).addTodo("할 일 1", "", 1n, Priority.LOW, 0n);
      await todoList.connect(owner).addTodo("할 일 2", "", 1n, Priority.LOW, 0n);
      await todoList.connect(owner).addTodo("할 일 3", "", 1n, Priority.LOW, 0n);

      await todoList.connect(owner).deleteTodo(2n); // 중간 항목 삭제

      const todos = await todoList.connect(owner).getTodos();
      expect(todos).to.have.lengthOf(2);
      expect(todos[0].id).to.equal(1n);
      expect(todos[1].id).to.equal(3n);
    });

    it("존재하지 않는 Todo 삭제는 revert 되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(deployFixture);
      await expect(
        todoList.connect(owner).deleteTodo(999n)
      ).to.be.revertedWith("Todo not found");
    });

    it("이미 삭제된 Todo를 다시 삭제하면 revert 되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(withTodoFixture);
      await todoList.connect(owner).deleteTodo(1n);
      await expect(
        todoList.connect(owner).deleteTodo(1n)
      ).to.be.revertedWith("Todo is deleted");
    });
  });

  // -------------------------------------------------------
  // toggleComplete
  // -------------------------------------------------------
  describe("toggleComplete", function () {
    it("미완료 → 완료 전환 시 TodoCompleted(true) 이벤트가 발생해야 한다", async function () {
      const { todoList, owner } = await loadFixture(withTodoFixture);
      await expect(todoList.connect(owner).toggleComplete(1n))
        .to.emit(todoList, "TodoCompleted")
        .withArgs(owner.address, 1n, true);
    });

    it("완료 → 미완료 전환 시 TodoCompleted(false) 이벤트가 발생해야 한다", async function () {
      const { todoList, owner } = await loadFixture(withTodoFixture);
      await todoList.connect(owner).toggleComplete(1n); // true
      await expect(todoList.connect(owner).toggleComplete(1n))
        .to.emit(todoList, "TodoCompleted")
        .withArgs(owner.address, 1n, false);
    });

    it("토글 후 isCompleted 상태가 실제로 변경되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(withTodoFixture);
      await todoList.connect(owner).toggleComplete(1n);
      expect((await todoList.connect(owner).getTodoById(1n)).isCompleted).to.equal(true);
      await todoList.connect(owner).toggleComplete(1n);
      expect((await todoList.connect(owner).getTodoById(1n)).isCompleted).to.equal(false);
    });

    it("삭제된 Todo 토글은 revert 되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(withTodoFixture);
      await todoList.connect(owner).deleteTodo(1n);
      await expect(
        todoList.connect(owner).toggleComplete(1n)
      ).to.be.revertedWith("Todo is deleted");
    });

    it("존재하지 않는 Todo 토글은 revert 되어야 한다", async function () {
      const { todoList, owner } = await loadFixture(deployFixture);
      await expect(
        todoList.connect(owner).toggleComplete(999n)
      ).to.be.revertedWith("Todo not found");
    });
  });

  // -------------------------------------------------------
  // getTodos / getTodoById
  // -------------------------------------------------------
  describe("getTodos / getTodoById", function () {
    it("getTodos는 isActive=true 인 Todo만 반환해야 한다", async function () {
      const { todoList, owner } = await loadFixture(withCategoryFixture);
      await todoList.connect(owner).addTodo("Todo 1", "", 1n, Priority.LOW, 0n);
      await todoList.connect(owner).addTodo("Todo 2", "", 1n, Priority.LOW, 0n);
      await todoList.connect(owner).deleteTodo(1n);

      const todos = await todoList.connect(owner).getTodos();
      expect(todos).to.have.lengthOf(1);
      expect(todos[0].id).to.equal(2n);
    });

    it("getTodoById는 올바른 Todo를 반환해야 한다", async function () {
      const { todoList, owner } = await loadFixture(withTodoFixture);
      const t = await todoList.connect(owner).getTodoById(1n);
      expect(t.title).to.equal("기본 할 일");
      expect(t.priority).to.equal(Priority.MEDIUM);
    });

    it("다른 사용자의 getTodos는 독립적이어야 한다", async function () {
      const { todoList, owner, user1 } = await loadFixture(withTodoFixture);
      const user1Todos = await todoList.connect(user1).getTodos();
      expect(user1Todos).to.have.lengthOf(0);
    });
  });

  // -------------------------------------------------------
  // 접근 제어 (Access Control) — SRS 보안 요구사항 검증
  // -------------------------------------------------------
  describe("Access Control", function () {
    it("user1의 카테고리는 user2의 컨텍스트에서 유효하지 않아야 한다", async function () {
      const { todoList, user1, user2 } = await loadFixture(deployFixture);
      await todoList.connect(user1).addCategory("user1 cat"); // catId=1 (전역)
      // user2는 카테고리를 만들지 않았으므로 catId=1은 user2 컨텍스트에서 무효
      await expect(
        todoList.connect(user2).addTodo("제목", "", 1n, Priority.LOW, 0n)
      ).to.be.revertedWith("Invalid category");
    });

    it("user2는 user1의 Todo를 updateTodo로 수정할 수 없어야 한다", async function () {
      const { todoList, user1, user2 } = await loadFixture(deployFixture);
      await todoList.connect(user1).addCategory("cat"); // catId=1
      await todoList.connect(user1).addTodo("user1 Todo", "", 1n, Priority.LOW, 0n); // todoId=1
      await todoList.connect(user2).addCategory("user2 cat"); // catId=2
      // user2 컨텍스트에서 todoId=1 조회 → user2에게 todo가 없으므로 "Todo not found"
      await expect(
        todoList.connect(user2).updateTodo(1n, "해킹", "", 2n, Priority.LOW, 0n)
      ).to.be.revertedWith("Todo not found");
    });

    it("user2는 user1의 Todo를 deleteTodo로 삭제할 수 없어야 한다", async function () {
      const { todoList, user1, user2 } = await loadFixture(deployFixture);
      await todoList.connect(user1).addCategory("cat");
      await todoList.connect(user1).addTodo("user1 Todo", "", 1n, Priority.LOW, 0n);
      await expect(
        todoList.connect(user2).deleteTodo(1n)
      ).to.be.revertedWith("Todo not found");
    });

    it("user2는 user1의 Todo를 toggleComplete로 변경할 수 없어야 한다", async function () {
      const { todoList, user1, user2 } = await loadFixture(deployFixture);
      await todoList.connect(user1).addCategory("cat");
      await todoList.connect(user1).addTodo("user1 Todo", "", 1n, Priority.LOW, 0n);
      await expect(
        todoList.connect(user2).toggleComplete(1n)
      ).to.be.revertedWith("Todo not found");
    });

    it("user2는 user1의 카테고리를 deleteCategory로 삭제할 수 없어야 한다", async function () {
      const { todoList, user1, user2 } = await loadFixture(deployFixture);
      await todoList.connect(user1).addCategory("user1 cat"); // catId=1
      // user2 컨텍스트에서 catId=1을 삭제 시도 → user2에게 catId=1 없음
      await expect(
        todoList.connect(user2).deleteCategory(1n)
      ).to.be.revertedWith("Category not found");
    });
  });

  // -------------------------------------------------------
  // 가스 사용량 기록 (SRS Phase 2 사이드 이펙트 검증)
  // -------------------------------------------------------
  describe("Gas Usage", function () {
    it("addCategory 가스 사용량 기록", async function () {
      const { todoList, owner } = await loadFixture(deployFixture);
      const tx = await todoList.connect(owner).addCategory("업무");
      const receipt = await tx.wait();
      console.log(`\n      [Gas] addCategory: ${receipt.gasUsed.toLocaleString()} gas`);
    });

    it("addTodo 가스 사용량 기록 (deadline=0)", async function () {
      const { todoList, owner } = await loadFixture(withCategoryFixture);
      const tx = await todoList
        .connect(owner)
        .addTodo("테스트 할 일", "상세한 설명입니다.", 1n, Priority.HIGH, 0n);
      const receipt = await tx.wait();
      console.log(`\n      [Gas] addTodo: ${receipt.gasUsed.toLocaleString()} gas`);
    });

    it("updateTodo 가스 사용량 기록", async function () {
      const { todoList, owner } = await loadFixture(withTodoFixture);
      const tx = await todoList
        .connect(owner)
        .updateTodo(1n, "수정된 제목", "수정된 설명", 1n, Priority.HIGH, 0n);
      const receipt = await tx.wait();
      console.log(`\n      [Gas] updateTodo: ${receipt.gasUsed.toLocaleString()} gas`);
    });

    it("deleteTodo 가스 사용량 기록", async function () {
      const { todoList, owner } = await loadFixture(withTodoFixture);
      const tx = await todoList.connect(owner).deleteTodo(1n);
      const receipt = await tx.wait();
      console.log(`\n      [Gas] deleteTodo: ${receipt.gasUsed.toLocaleString()} gas`);
    });

    it("toggleComplete 가스 사용량 기록", async function () {
      const { todoList, owner } = await loadFixture(withTodoFixture);
      const tx = await todoList.connect(owner).toggleComplete(1n);
      const receipt = await tx.wait();
      console.log(`\n      [Gas] toggleComplete: ${receipt.gasUsed.toLocaleString()} gas`);
    });
  });
});
