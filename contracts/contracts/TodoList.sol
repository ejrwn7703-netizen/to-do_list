// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TodoList
 * @notice 블록체인 기반 To-Do List. 모든 데이터는 온체인에 저장되며,
 *         각 지갑 주소(msg.sender)가 독립적인 데이터 공간을 소유한다.
 */
contract TodoList {
    // =========================================================
    // Enums
    // =========================================================

    enum Priority {
        LOW,    // 0
        MEDIUM, // 1
        HIGH    // 2
    }

    // =========================================================
    // Structs
    // =========================================================

    struct Category {
        uint256 id;
        string  name;
        bool    isActive; // false = 논리적 삭제 상태
    }

    struct Todo {
        uint256  id;
        string   title;       // 최대 100자
        string   description; // 최대 500자
        uint256  categoryId;
        Priority priority;
        uint256  deadline;    // Unix timestamp. 0 = 마감일 없음
        bool     isCompleted;
        bool     isActive;    // false = 논리적 삭제 상태
        uint256  createdAt;   // block.timestamp
        uint256  updatedAt;   // block.timestamp
    }

    // =========================================================
    // State Variables
    // =========================================================

    uint256 private _todoCounter;
    uint256 private _categoryCounter;

    // 주소별 Todo 배열
    mapping(address => Todo[]) private _userTodos;

    // 주소별 Category 배열
    mapping(address => Category[]) private _userCategories;

    // Todo ID → 배열 인덱스 (O(1) 접근용)
    mapping(address => mapping(uint256 => uint256)) private _todoIndexById;

    // Category ID → 배열 인덱스 (O(1) 접근용)
    mapping(address => mapping(uint256 => uint256)) private _categoryIndexById;

    // =========================================================
    // Events
    // =========================================================

    event TodoAdded(address indexed owner, uint256 indexed todoId);
    event TodoUpdated(address indexed owner, uint256 indexed todoId);
    event TodoDeleted(address indexed owner, uint256 indexed todoId);
    event TodoCompleted(address indexed owner, uint256 indexed todoId, bool isCompleted);
    event CategoryAdded(address indexed owner, uint256 indexed categoryId);
    event CategoryDeleted(address indexed owner, uint256 indexed categoryId);

    // =========================================================
    // Functions (Phase 2에서 구현)
    // =========================================================

    // addCategory(string memory name) external returns (uint256)
    // deleteCategory(uint256 categoryId) external
    // getCategories() external view returns (Category[] memory)

    // addTodo(string memory title, string memory description,
    //         uint256 categoryId, Priority priority, uint256 deadline)
    //         external returns (uint256)
    // updateTodo(uint256 todoId, string memory title, string memory description,
    //            uint256 categoryId, Priority priority, uint256 deadline) external
    // deleteTodo(uint256 todoId) external
    // toggleComplete(uint256 todoId) external
    // getTodos() external view returns (Todo[] memory)
    // getTodoById(uint256 todoId) external view returns (Todo memory)
}
