import { ethers } from "ethers";
import TodoListABI from "../contracts/TodoList.json";
import { CONTRACT_ADDRESS } from "./constants";

export function getContract(signerOrProvider) {
  return new ethers.Contract(CONTRACT_ADDRESS, TodoListABI, signerOrProvider);
}
