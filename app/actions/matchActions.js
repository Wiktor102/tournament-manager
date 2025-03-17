"use server";

import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";

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

async function readMatchesFromFile() {
	try {
		const data = await fs.readFile(dataFilePath, "utf8");
		return JSON.parse(data);
	} catch {
		// If file doesn't exist yet, return empty array
		return [];
	}
}

async function readMatchFromFile(id) {
	const matches = await readMatchesFromFile();
	return matches.find(match => match.id === id);
}

// Save matches data
async function saveMatches(matches) {
	await ensureDataDir();
	await fs.writeFile(dataFilePath, JSON.stringify(matches, null, 2));
}

// Create a new match
async function createMatch(formData) {
	const matches = await readMatchesFromFile();

	const newMatch = {
		id: Date.now().toString(),
		homeTeam: formData.homeTeam,
		awayTeam: formData.awayTeam,
		homeScore: 0,
		awayScore: 0,
		date: formData.date,
		status: "scheduled",
		currentMinute: 0,
		createdAt: new Date().toISOString()
	};

	matches.push(newMatch);
	await saveMatches(matches);
	revalidatePath("/admin");
	revalidatePath("/");

	return newMatch;
}

// Update a match
async function updateMatch(id, formData) {
	const matches = await readMatchesFromFile();
	const match = await getMatch(id);

	if (!match) {
		throw new Error("Match not found");
	}

	const updatedMatch = {
		...match,
		homeTeam: formData.homeTeam,
		awayTeam: formData.awayTeam,
		date: formData.date
	};

	const index = matches.findIndex(m => m.id === id);
	matches[index] = updatedMatch;

	await saveMatches(matches);
	revalidatePath("/admin");
	revalidatePath(`/match/${id}`);
	revalidatePath("/");

	return updatedMatch;
}

// Update match score
async function updateMatchScore(id, scoreData) {
	const matches = await readMatchesFromFile();
	const match = await getMatch(id);

	if (!match) {
		throw new Error("Match not found");
	}

	const updatedMatch = {
		...match,
		homeScore: scoreData.homeScore,
		awayScore: scoreData.awayScore,
		currentMinute: scoreData.currentMinute,
		status: scoreData.status
	};

	const index = matches.findIndex(m => m.id === id);
	matches[index] = updatedMatch;

	await saveMatches(matches);
	revalidatePath("/admin");
	revalidatePath(`/match/${id}`);
	revalidatePath("/");

	return updatedMatch;
}

// Delete a match
async function deleteMatch(id) {
	const matches = await readMatchesFromFile();
	const filteredMatches = matches.filter(match => match.id !== id);

	if (filteredMatches.length < matches.length) {
		await saveMatches(filteredMatches);
		revalidatePath("/admin");
		revalidatePath("/");
		return true;
	}

	return false;
}

export { readMatchesFromFile as getMatches, readMatchFromFile as getMatch };
export { createMatch, updateMatch, updateMatchScore, deleteMatch };
