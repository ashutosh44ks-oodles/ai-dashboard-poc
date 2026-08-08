import { Router } from "express";
import {
  getListOfTables,
  getTableConfig,
  getTableData,
  createRecord,
  updateRecord,
  deleteRecord,
} from "../controllers/dataModelController.js";

const router = Router();

router.get("/", getListOfTables);
router.get("/:tableName/config", getTableConfig);
router.get("/:tableName/data", getTableData);
router.post("/:tableName/records", createRecord);
router.put("/:tableName/records/:recordId", updateRecord);
router.delete("/:tableName/records/:recordId", deleteRecord);

export default router;
