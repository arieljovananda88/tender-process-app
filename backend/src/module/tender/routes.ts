import { Router } from "express";
import {
    createTender,
    addParticipant,
    selectWinner,
} from "./internal/controller";

const router = Router();

router.post("/", createTender);
router.post("/:tenderId/participants", addParticipant);
router.post("/:tenderId/select-winner", selectWinner);

export const tenderRouter = {
    router
};