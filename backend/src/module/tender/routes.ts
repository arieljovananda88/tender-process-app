import { Router } from "express";
import {
    createTender,
    addParticipant,
    selectWinner,
    getTender,
    getParticipants,
    getTendersByOwner,
    getAllTenders
} from "./internal/controller";

const router = Router();

router.post("/", createTender);
router.get("/", getAllTenders);
router.get("/owner/:owner", getTendersByOwner);
router.get("/:tenderId", getTender);
router.post("/:tenderId/participants", addParticipant);
router.post("/:tenderId/winner", selectWinner);
router.get("/:tenderId/participants", getParticipants);

export const tenderRouter = {
    router
};