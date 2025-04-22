import { Request, Response } from "express";
import { getTenderManagerContractInstance } from "../../../commons/contract-clients";
import { ethers } from 'ethers';

// Helper function to generate a shorter unique ID
function generateTenderId(): string {
    const timestamp = Date.now().toString(36); // Convert timestamp to base36
    const random = Math.random().toString(36).substring(2, 8); // Random 6 chars
    return `${timestamp}-${random}`; // Format: timestamp-random
}

// Helper function to format tender response
function formatTenderResponse(tender: any, tenderId: string) {
    return {
        tenderId: tenderId,
        owner: tender.owner,
        name: tender.name,
        description: tender.description,
        startDate: new Date(tender.startDate.toNumber() * 1000).toISOString(),
        endDate: new Date(tender.endDate.toNumber() * 1000).toISOString(),
        winner: tender.winner,
        isActive: tender.isActive
    };
}

export async function createTender(req: Request, res: Response) {
    const tenderManager = getTenderManagerContractInstance();
    try {
        const { name, description, startDate, endDate, owner } = req.body;
        
        if (!name || !description || !startDate || !endDate || !owner) {
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
            description,
            startTimestamp,
            endTimestamp,
            owner
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
        const { owner, participant } = req.body;

        if (!tenderId || !owner || !participant) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const tx = await tenderManager.addParticipant(
            tenderId,
            owner,
            participant
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
        const { owner, winner } = req.body;

        if (!tenderId || !owner || !winner) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const tx = await tenderManager.selectWinner(
            tenderId,
            owner,
            winner
        );
        await tx.wait();

        return res.status(200).json({
            success: true,
            message: "Winner selected successfully"
        });
    } catch (error: any) {
        console.error("Select winner error:", error);
        return res.status(500).json({ error: "Failed to select winner", details: error.message });
    }
}

export async function getTender(req: Request, res: Response) {
    const tenderManager = getTenderManagerContractInstance();
    try {
        const { tenderId } = req.params;

        if (!tenderId) {
            return res.status(400).json({ error: "Missing tenderId" });
        }

        const tender = await tenderManager.getTender(tenderId);

        return res.status(200).json({
            success: true,
            tender: formatTenderResponse(tender, tenderId)
        });
    } catch (error: any) {
        console.error("Get tender error:", error);
        return res.status(500).json({ error: "Failed to get tender", details: error.message });
    }
}

export async function getTendersByOwner(req: Request, res: Response) {
    const tenderManager = getTenderManagerContractInstance();
    try {
        const { owner } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;

        if (!owner) {
            return res.status(400).json({ error: "Missing owner address" });
        }

        const [tenderIds, tenderDetails] = await tenderManager.getTendersByOwner(owner, page, pageSize);

        const formattedTenders = tenderIds.map((tenderId: string, index: number) => {
            return formatTenderResponse(tenderDetails[index], tenderId);
        });

        return res.status(200).json({
            success: true,
            tenders: formattedTenders,
            pagination: {
                page,
                pageSize,
                total: await tenderManager.ownerTenderIds(owner).then((ids: any) => ids.length)
            }
        });
    } catch (error: any) {
        console.error("Get tenders by owner error:", error);
        return res.status(500).json({ error: "Failed to get tenders", details: error.message });
    }
}

export async function getAllTenders(req: Request, res: Response) {
    const tenderManager = getTenderManagerContractInstance();
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;

        const [tenderIds, tenderDetails] = await tenderManager.getAllTenders(page, pageSize);

        const formattedTenders = tenderIds.map((tenderId: string, index: number) => {
            return formatTenderResponse(tenderDetails[index], tenderId);
        });

        return res.status(200).json({
            success: true,
            tenders: formattedTenders,
            pagination: {
                page,
                pageSize,
                total: await tenderManager.allTenderIds().then((ids: any) => ids.length)
            }
        });
    } catch (error: any) {
        console.error("Get all tenders error:", error);
        return res.status(500).json({ error: "Failed to get tenders", details: error.message });
    }
}

export async function getParticipants(req: Request, res: Response) {
    const tenderManager = getTenderManagerContractInstance();
    try {
        const { tenderId } = req.params;

        if (!tenderId) {
            return res.status(400).json({ error: "Missing tenderId" });
        }

        // First check if the tender exists
        try {
            const owner = await tenderManager.getOwner(tenderId);
            if (owner === ethers.constants.AddressZero) {
                return res.status(404).json({ error: "Tender not found" });
            }
        } catch (error) {
            return res.status(404).json({ error: "Tender not found" });
        }

        const participants = await tenderManager.getParticipants(tenderId);

        return res.status(200).json({
            success: true,
            participants
        });
    } catch (error: any) {
        console.error("Get participants error:", error);
        if (error.message?.includes("Tender does not exist")) {
            return res.status(404).json({ error: "Tender not found" });
        }
        return res.status(500).json({ error: "Failed to get participants", details: error.message });
    }
} 