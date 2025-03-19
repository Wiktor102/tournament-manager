"use server";

import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";
import { Match, MatchData } from "../../types/types";
import { sendMatchUpdate } from "../api/events/route";

const dataFilePath = path.join(process.cwd(), "data", "matches.json");

// Ensure data directory exists
async function ensureDataDir() {
	const dataDir = path.join(process.cwd(), "data");
	try {
		await fs.access(dataDir);
	} catch {
		await fs.mkdir(dataDir, { recursive: true });
	}
}

async function readMatchesFromFile(): Promise<Match[]> {
	"use server";
	try {
		const data = await fs.readFile(dataFilePath, "utf8");
		return JSON.parse(data);
	} catch {
		// If file doesn't exist yet, return empty array
		return [];
	}
}

async function readMatchFromFile(id: string): Promise<Match | undefined> {
	const matches = await readMatchesFromFile();
	return matches.find(match => match.id === id);
}

async function updateMatchInFile(id: string, update: Partial<Match>): Promise<Match> {
	const matches = await readMatchesFromFile();
	const index = matches.findIndex(match => match.id === id);
	const updatedMatch = { ...matches[index], ...update };
	matches[index] = updatedMatch;
	await fs.writeFile(dataFilePath, JSON.stringify(matches, null, 2));

	revalidatePath("/admin");
	revalidatePath(`/match/${id}`);

	sendMatchUpdate(id, updatedMatch);

	return updatedMatch;
}

// ----------------------------
// ----------------------------
// ----------------------------
// Actions
// ----------------------------

// Save matches data
async function saveMatches(matches: Match[]): Promise<void> {
	await ensureDataDir();
	await fs.writeFile(dataFilePath, JSON.stringify(matches, null, 2));
}

// Create a new match
async function createMatch(formData: MatchData): Promise<Match> {
	const matches = await readMatchesFromFile();

	const newMatch: Match = {
		id: uuid(),
		team1: formData.homeTeam.toUpperCase(),
		team2: formData.awayTeam.toUpperCase(),
		score1: 0,
		score2: 0,
		pitchId: formData.pitchId,
		status: "scheduled",
		mode: "1x15", // TODO: Add mode to form
		currentTime: "0",
		addedTime: 0
	};

	matches.push(newMatch);
	await saveMatches(matches);
	revalidatePath("/admin");
	revalidatePath("/");

	return newMatch;
}

// Update a match
async function updateMatch(id: string, formData: MatchData): Promise<Match> {
	const match = await readMatchFromFile(id);

	if (!match) {
		throw new Error("Match not found");
	}

	const updatedMatch: Partial<Match> = {
		team1: formData.homeTeam.toUpperCase(),
		team2: formData.awayTeam.toUpperCase(),
		pitchId: formData.pitchId
	};

	return await updateMatchInFile(id, updatedMatch);
}

async function startMatch(id: string): Promise<Match> {
	const match = await readMatchFromFile(id);
	if (!match) throw new Error("Match not found");
	if (match.status !== "scheduled") throw new Error("Match must be in the 'scheduled' state to start");

	const update: Partial<Match> = { status: "live", startedAt: Date.now() };
	return await updateMatchInFile(id, update);
}

// Update match score
async function updateMatchScore(id: string, action: { team: "team1" | "team2"; change: number }): Promise<Match> {
	const match = await readMatchFromFile(id);

	if (!match) throw new Error("Match not found");
	const propertyToUpdate = action.team === "team1" ? "score1" : "score2";
	const updatedMatch = await updateMatchInFile(id, { [propertyToUpdate]: match[propertyToUpdate] + action.change });

	return updatedMatch;
}

async function updateMatchAdditionalTime(id: string, addedTime: number): Promise<Match> {
	const match = await readMatchFromFile(id);
	if (!match) throw new Error("Match not found");
	const updatedMatch = await updateMatchInFile(id, { addedTime });
	return updatedMatch;
}

// Delete a match
async function deleteMatch(formData: FormData): Promise<void> {
	const matchId = formData.get("matchId")! as string;
	const matches = await readMatchesFromFile();
	const filteredMatches = matches.filter(match => match.id !== matchId);

	if (filteredMatches.length < matches.length) {
		await saveMatches(filteredMatches);
		revalidatePath("/admin");
		revalidatePath("/");
	}
}

export { readMatchesFromFile as getMatches, readMatchFromFile as getMatch };
export { startMatch, updateMatchScore, updateMatchAdditionalTime };
export { createMatch, updateMatch, deleteMatch };
