// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TodoList
 * @notice 블록체인 기반 To-Do List.
 *         모든 데이터는 온체인에 저장되며,
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
    event CategoryRenamed(address indexed owner, uint256 indexed categoryId, string newName);
    event CategoryDeleted(address indexed owner, uint256 indexed categoryId);

    // =========================================================
    // Category Functions
    // =========================================================

    /**
     * @notice 카테고리를 추가한다.
     * @param name 카테고리 이름 (1~50자)
     * @return 생성된 카테고리 ID
     */
    function addCategory(string calldata name) external returns (uint256) {
        require(bytes(name).length > 0, "Category name cannot be empty");
        require(bytes(name).length <= 50, "Category name too long");

        _categoryCounter++;
        uint256 newId = _categoryCounter;
        uint256 idx = _userCategories[msg.sender].length;

        _userCategories[msg.sender].push(Category({
            id: newId,
            name: name,
            isActive: true
        }));
        _categoryIndexById[msg.sender][newId] = idx;

        emit CategoryAdded(msg.sender, newId);
        return newId;
    }

    /**
     * @notice 카테고리 이름을 변경한다.
     * @param categoryId 수정할 카테고리 ID
     * @param name       새 이름 (1~50자)
     */
    function renameCategory(uint256 categoryId, string calldata name) external {
        require(bytes(name).length > 0, "Category name cannot be empty");
        require(bytes(name).length <= 50, "Category name too long");

        uint256 idx = _getActiveCategoryIdx(msg.sender, categoryId);
        _userCategories[msg.sender][idx].name = name;

        emit CategoryRenamed(msg.sender, categoryId, name);
    }

    /**
     * @notice 카테고리를 논리적으로 삭제한다.
     *         해당 카테고리에 활성 Todo가 있으면 삭제 불가.
     * @param categoryId 삭제할 카테고리 ID
     */
    function deleteCategory(uint256 categoryId) external {
        uint256 idx = _getActiveCategoryIdx(msg.sender, categoryId);

        // 이 카테고리에 활성 Todo가 없어야 함
        Todo[] storage todos = _userTodos[msg.sender];
        for (uint256 i = 0; i < todos.length; i++) {
            require(
                !(todos[i].isActive && todos[i].categoryId == categoryId),
                "Category has active todos"
            );
        }

        _userCategories[msg.sender][idx].isActive = false;
        emit CategoryDeleted(msg.sender, categoryId);
    }

    /**
     * @notice msg.sender의 활성 카테고리 목록을 반환한다.
     */
    function getCategories() external view returns (Category[] memory) {
        Category[] storage all = _userCategories[msg.sender];
        uint256 count = 0;
        for (uint256 i = 0; i < all.length; i++) {
            if (all[i].isActive) count++;
        }

        Category[] memory result = new Category[](count);
        uint256 j = 0;
        for (uint256 i = 0; i < all.length; i++) {
            if (all[i].isActive) result[j++] = all[i];
        }
        return result;
    }

    // =========================================================
    // Todo Functions
    // =========================================================

    /**
     * @notice Todo를 추가한다.
     * @param title       제목 (1~100자)
     * @param description 설명 (0~500자)
     * @param categoryId  유효한 카테고리 ID
     * @param priority    우선순위 (LOW=0, MEDIUM=1, HIGH=2)
     * @param deadline    Unix timestamp. 0이면 마감일 없음. 0 이외면 미래 시점이어야 함.
     * @return 생성된 Todo ID
     */
    function addTodo(
        string calldata title,
        string calldata description,
        uint256 categoryId,
        Priority priority,
        uint256 deadline
    ) external returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(title).length <= 100, "Title too long");
        require(bytes(description).length <= 500, "Description too long");
        require(_isCategoryValid(msg.sender, categoryId), "Invalid category");
        require(deadline == 0 || deadline > block.timestamp, "Invalid deadline");

        _todoCounter++;
        uint256 newId = _todoCounter;
        uint256 idx = _userTodos[msg.sender].length;

        _userTodos[msg.sender].push(Todo({
            id: newId,
            title: title,
            description: description,
            categoryId: categoryId,
            priority: priority,
            deadline: deadline,
            isCompleted: false,
            isActive: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        }));
        _todoIndexById[msg.sender][newId] = idx;

        emit TodoAdded(msg.sender, newId);
        return newId;
    }

    /**
     * @notice Todo를 수정한다. isCompleted 상태는 변경하지 않는다.
     * @param todoId      수정할 Todo ID
     * @param title       새 제목 (1~100자)
     * @param description 새 설명 (0~500자)
     * @param categoryId  새 카테고리 ID
     * @param priority    새 우선순위
     * @param deadline    새 마감일
     */
    function updateTodo(
        uint256 todoId,
        string calldata title,
        string calldata description,
        uint256 categoryId,
        Priority priority,
        uint256 deadline
    ) external {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(title).length <= 100, "Title too long");
        require(bytes(description).length <= 500, "Description too long");
        require(_isCategoryValid(msg.sender, categoryId), "Invalid category");
        require(deadline == 0 || deadline > block.timestamp, "Invalid deadline");

        uint256 idx = _getActiveTodoIdx(msg.sender, todoId);
        Todo storage todo = _userTodos[msg.sender][idx];

        todo.title = title;
        todo.description = description;
        todo.categoryId = categoryId;
        todo.priority = priority;
        todo.deadline = deadline;
        todo.updatedAt = block.timestamp;

        emit TodoUpdated(msg.sender, todoId);
    }

    /**
     * @notice Todo를 논리적으로 삭제한다 (isActive = false).
     * @param todoId 삭제할 Todo ID
     */
    function deleteTodo(uint256 todoId) external {
        uint256 idx = _getActiveTodoIdx(msg.sender, todoId);
        Todo storage todo = _userTodos[msg.sender][idx];
        todo.isActive = false;
        todo.updatedAt = block.timestamp;
        emit TodoDeleted(msg.sender, todoId);
    }

    /**
     * @notice Todo의 완료 상태를 토글한다 (false→true, true→false).
     * @param todoId 토글할 Todo ID
     */
    function toggleComplete(uint256 todoId) external {
        uint256 idx = _getActiveTodoIdx(msg.sender, todoId);
        Todo storage todo = _userTodos[msg.sender][idx];
        todo.isCompleted = !todo.isCompleted;
        todo.updatedAt = block.timestamp;
        emit TodoCompleted(msg.sender, todoId, todo.isCompleted);
    }

    /**
     * @notice msg.sender의 활성(isActive=true) Todo 목록을 반환한다.
     */
    function getTodos() external view returns (Todo[] memory) {
        Todo[] storage all = _userTodos[msg.sender];
        uint256 count = 0;
        for (uint256 i = 0; i < all.length; i++) {
            if (all[i].isActive) count++;
        }

        Todo[] memory result = new Todo[](count);
        uint256 j = 0;
        for (uint256 i = 0; i < all.length; i++) {
            if (all[i].isActive) result[j++] = all[i];
        }
        return result;
    }

    /**
     * @notice 특정 Todo를 단건 조회한다. 삭제된 항목은 조회 불가.
     * @param todoId 조회할 Todo ID
     */
    function getTodoById(uint256 todoId) external view returns (Todo memory) {
        uint256 idx = _getActiveTodoIdx(msg.sender, todoId);
        return _userTodos[msg.sender][idx];
    }

    // =========================================================
    // Internal Helpers
    // =========================================================

    /**
     * @dev categoryId가 owner의 활성 카테고리인지 검증한다.
     *      ID는 1부터 시작하므로 0은 즉시 false.
     *      매핑 기본값(0)과의 충돌을 cats[idx].id == categoryId 비교로 방어한다.
     */
    function _isCategoryValid(address owner, uint256 categoryId) internal view returns (bool) {
        if (categoryId == 0) return false;
        Category[] storage cats = _userCategories[owner];
        if (cats.length == 0) return false;
        uint256 idx = _categoryIndexById[owner][categoryId];
        if (idx >= cats.length) return false;
        return cats[idx].id == categoryId && cats[idx].isActive;
    }

    /**
     * @dev owner의 활성 카테고리 배열 인덱스를 반환한다. 없으면 revert.
     */
    function _getActiveCategoryIdx(address owner, uint256 categoryId) internal view returns (uint256) {
        Category[] storage cats = _userCategories[owner];
        require(cats.length > 0, "Category not found");
        uint256 idx = _categoryIndexById[owner][categoryId];
        require(
            idx < cats.length && cats[idx].id == categoryId && cats[idx].isActive,
            "Category not found"
        );
        return idx;
    }

    /**
     * @dev owner의 활성 Todo 배열 인덱스를 반환한다. 없거나 삭제됐으면 revert.
     *      매핑 기본값(0)과의 충돌을 todos[idx].id == todoId 비교로 방어한다.
     */
    function _getActiveTodoIdx(address owner, uint256 todoId) internal view returns (uint256) {
        Todo[] storage todos = _userTodos[owner];
        uint256 idx = _todoIndexById[owner][todoId];
        require(idx < todos.length, "Todo not found");
        require(todos[idx].id == todoId, "Todo not found");
        require(todos[idx].isActive, "Todo is deleted");
        return idx;
    }
}
