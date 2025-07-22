import { Request, Response } from "express";
import { getTenderManagerContractInstance } from "../../../commons/contract-clients";

// Helper function to generate a shorter unique ID
function generateTenderId(): string {
    const timestamp = Date.now().toString(36); // Convert timestamp to base36
    const random = Math.random().toString(36).substring(2, 8); // Random 6 chars
    return `${timestamp}-${random}`; // Format: timestamp-random
}

export async function createTender(req: Request, res: Response) {
    const tenderManager = getTenderManagerContractInstance();
    try {
        const { name, startDate, endDate, deadline,
            v,
            r,
            s, } = req.body;
        
        if (!name || !startDate || !endDate || !deadline || !v || !r || !s) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Convert dates to Unix timestamp
        const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
        const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

        // Generate tenderId using timestamp and random number
        const tenderId = generateTenderId();

        const tx = await tenderManager.createTender(
            tenderId,
            name,
            "description",
            startTimestamp,
            endTimestamp,
            v,
            r,
            s,
            deadline
        );

        await tx.wait();

        return res.status(200).json({
            success: true,
            message: "Tender created successfully",
            tenderId: tenderId
        });
    } catch (error: any) {
        console.error("Create tender error:", error);
        return res.status(500).json({ error: "Failed to create tender", details: error.message });
    }
}

export async function addParticipant(req: Request, res: Response) {
    const tenderManager = getTenderManagerContractInstance();

    try {
        const { tenderId } = req.params;
        const { 
        participant,
        deadline,
        v,
        r,
        s,
        participantName,
        participantEmail,
         } = req.body;

        if (!tenderId || !participant || !deadline || !v || !r || !s || !participantName || !participantEmail) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const tx = await tenderManager.addParticipant(
            tenderId,
            participant,
            participantName,
            participantEmail,
            v,
            r,
            s,
            deadline
        );
        await tx.wait();

        return res.status(200).json({
            success: true,
            message: "Participant added successfully"
        });
    } catch (error: any) {
        console.error("Add participant error:", error);
        return res.status(500).json({ error: "Failed to add participant", details: error.message });
    }
}

export async function selectWinner(req: Request, res: Response) {
    const tenderManager = getTenderManagerContractInstance();
    try {
        const { tenderId } = req.params;
        const { winner, reason, v, r, s, deadline } = req.body;

        if (!tenderId || !winner || !reason) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const tx = await tenderManager.selectWinner(
            tenderId,
            winner,
            reason,
            v,
            r,
            s,
            deadline
        );
        await tx.wait();

        return res.status(200).json({
            success: true,
            message: "Winner selected successfully"
        });
    } catch (error: any) {
        console.error("Select winner error:", error);
        return res.status(500).json({ success: false, error: "Failed to select winner", details: error.message });
    }
}
