"use server";

import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";

const SLIP_COUNTER_FILE = path.join(process.cwd(), "data", "slipCounter.json");

type SlipCounterData = {
	count: number;
};

// Initialize counter file if it doesn't exist
async function ensureCounterFile() {
	try {
		await fs.access(SLIP_COUNTER_FILE);
	} catch (error) {
		// File doesn't exist, create it
		await fs.mkdir(path.dirname(SLIP_COUNTER_FILE), { recursive: true });
		await fs.writeFile(SLIP_COUNTER_FILE, JSON.stringify({ count: 0 }), "utf-8");
	}
}

// Get the current slip count
export async function getSlipCount(): Promise<number> {
	await ensureCounterFile();
	const data = await fs.readFile(SLIP_COUNTER_FILE, "utf-8");
	const counterData = JSON.parse(data) as SlipCounterData;
	return counterData.count;
}

// Increment the slip counter
export async function incrementSlipCount(): Promise<number> {
	await ensureCounterFile();

	const data = await fs.readFile(SLIP_COUNTER_FILE, "utf-8");
	const counterData = JSON.parse(data) as SlipCounterData;

	counterData.count += 1;

	await fs.writeFile(SLIP_COUNTER_FILE, JSON.stringify(counterData), "utf-8");

	// Revalidate paths where this data is used
	revalidatePath("/admin/match/[id]");
	revalidatePath("/match/[id]");

	return counterData.count;
}
