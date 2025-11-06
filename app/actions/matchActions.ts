"use server";

import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";
import {
	Match,
	InitialMatchData,
	MatchFormat,
	TournamentRank,
	VolleyballSet,
	SetScoreUpdate,
	TeamSide
} from "../../types/types";
import { sendMatchDeleteUpdate, sendMatchUpdate } from "@/app/lib/connectionsStore";

const dataFilePath = path.join(process.cwd(), "data", "matches.json");

const FORMAT_BY_RANK: Record<TournamentRank, MatchFormat> = {
	"1/16": "twoSetsTo11",
	"1/8": "twoSetsTo11",
	"1/4": "twoSetsTo11",
	"1/2": "bestOfThreeTo15",
	Finał: "bestOfThreeTo15",
	"O 3 miejsce": "bestOfThreeTo15"
};

const FORMAT_CONFIG: Record<MatchFormat, { targetPoints: number; setsToWin: number; maxSets: number }> = {
	twoSetsTo11: { targetPoints: 11, setsToWin: 2, maxSets: 3 },
	bestOfThreeTo15: { targetPoints: 15, setsToWin: 2, maxSets: 3 }
};

const TWO_POINT_MARGIN = 2;
const DEFAULT_RANK: TournamentRank = "1/16";
const TOURNAMENT_RANKS: readonly TournamentRank[] = ["1/16", "1/8", "1/4", "1/2", "Finał", "O 3 miejsce"];

function isTournamentRank(value: unknown): value is TournamentRank {
	return typeof value === "string" && (TOURNAMENT_RANKS as readonly string[]).includes(value);
}

function isMatchFormat(value: unknown): value is MatchFormat {
	return value === "twoSetsTo11" || value === "bestOfThreeTo15";
}

function coerceTeamSide(value: unknown): TeamSide | undefined {
	return value === "team1" ? "team1" : value === "team2" ? "team2" : undefined;
}

function coerceNumber(value: unknown, fallback = 0): number {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

async function ensureDataDir() {
	const dataDir = path.join(process.cwd(), "data");
	try {
		await fs.access(dataDir);
	} catch {
		await fs.mkdir(dataDir, { recursive: true });
	}
}

function determineFormat(rank: TournamentRank): MatchFormat {
	return FORMAT_BY_RANK[rank] ?? "twoSetsTo11";
}

function createSet(setNumber: number, targetPoints: number, isTieBreak = false): VolleyballSet {
	return {
		setNumber,
		targetPoints,
		team1Points: 0,
		team2Points: 0,
		isTieBreak
	};
}

function createInitialSets(format: MatchFormat): VolleyballSet[] {
	const baseTarget = FORMAT_CONFIG[format].targetPoints;
	if (format === "twoSetsTo11") {
		return [createSet(1, baseTarget), createSet(2, baseTarget)];
	}

	return [createSet(1, baseTarget), createSet(2, baseTarget), createSet(3, baseTarget, true)];
}

function totalPoints(sets: VolleyballSet[]): Record<TeamSide, number> {
	return sets.reduce(
		(acc, set) => {
			acc.team1 += set.team1Points;
			acc.team2 += set.team2Points;
			return acc;
		},
		{ team1: 0, team2: 0 }
	);
}

function findCurrentSetIndex(match: Match): number {
	const firstOpenSet = match.sets.findIndex(set => !set.winner);
	if (firstOpenSet === -1) {
		return Math.max(match.sets.length - 1, 0);
	}
	return firstOpenSet;
}

function evaluateMatchState(match: Match, options: { allowStatusMutation?: boolean } = {}): Match {
	const { allowStatusMutation = true } = options;
	const config = FORMAT_CONFIG[match.format];
	const now = Date.now();

	const setsWon: Record<TeamSide, number> = { team1: 0, team2: 0 };

	match.sets = match.sets.map((set, index) => {
		const normalized: VolleyballSet = {
			setNumber: set.setNumber ?? index + 1,
			targetPoints: set.targetPoints ?? (set.isTieBreak && match.format === "twoSetsTo11" ? 1 : config.targetPoints),
			team1Points: Number.isFinite(set.team1Points) ? set.team1Points : 0,
			team2Points: Number.isFinite(set.team2Points) ? set.team2Points : 0,
			winner: set.winner === "team2" ? "team2" : set.winner === "team1" ? "team1" : undefined,
			isTieBreak: Boolean(set.isTieBreak),
			endedAt: set.endedAt
		};

		const leadingTeam =
			normalized.team1Points === normalized.team2Points
				? undefined
				: normalized.team1Points > normalized.team2Points
				? "team1"
				: "team2";
		const threshold = normalized.targetPoints;
		const margin = Math.abs(normalized.team1Points - normalized.team2Points);

		if (
			!normalized.winner &&
			leadingTeam &&
			Math.max(normalized.team1Points, normalized.team2Points) >= threshold &&
			margin >= TWO_POINT_MARGIN
		) {
			normalized.winner = leadingTeam;
			normalized.endedAt = normalized.endedAt ?? now;
		}

		if (normalized.winner) {
			setsWon[normalized.winner] += 1;
		}

		return normalized;
	});

	match.currentSet = findCurrentSetIndex(match);

	if (!allowStatusMutation) {
		return match;
	}

	const hasStarted = Boolean(match.startedAt);
	let winner: TeamSide | undefined;
	let decidedByTotalPoints = false;

	if (match.format === "twoSetsTo11") {
		const completedSets = match.sets.filter(set => Boolean(set.winner)).length;

		if (setsWon.team1 === config.setsToWin || setsWon.team2 === config.setsToWin) {
			winner = setsWon.team1 > setsWon.team2 ? "team1" : "team2";
		} else if (completedSets >= 2) {
			if (setsWon.team1 === setsWon.team2) {
				const totals = totalPoints(match.sets.slice(0, 2));
				if (totals.team1 !== totals.team2) {
					winner = totals.team1 > totals.team2 ? "team1" : "team2";
					decidedByTotalPoints = true;
				} else if (match.sets.length < config.maxSets) {
					match.sets.push(createSet(match.sets.length + 1, 1, true));
					match.currentSet = findCurrentSetIndex(match);
				}
			} else {
				winner = setsWon.team1 > setsWon.team2 ? "team1" : "team2";
			}
		}
	} else {
		if (setsWon.team1 === config.setsToWin || setsWon.team2 === config.setsToWin) {
			winner = setsWon.team1 > setsWon.team2 ? "team1" : "team2";
		}
	}

	if (winner) {
		match.status = "finished";
		match.winner = winner;
		match.decidedByTotalPoints = decidedByTotalPoints;
		match.endedAt = match.endedAt ?? now;
	} else if (hasStarted) {
		match.status = "live";
		match.winner = undefined;
		match.decidedByTotalPoints = false;
		match.endedAt = undefined;
	}

	return match;
}

function normaliseStatus(status: string | undefined): Match["status"] {
	switch (status) {
		case "live":
		case "finished":
			return status;
		default:
			return "scheduled";
	}
}

function normalizeSetInput(rawSet: unknown, index: number, format: MatchFormat): VolleyballSet {
	if (typeof rawSet !== "object" || rawSet === null) {
		const isPotentialTieBreak = format === "twoSetsTo11" ? index >= 2 : index === 2;
		const target = isPotentialTieBreak && format === "twoSetsTo11" ? 1 : FORMAT_CONFIG[format].targetPoints;
		return createSet(index + 1, target, isPotentialTieBreak);
	}

	const record = rawSet as Record<string, unknown>;
	const isTieBreak = record.isTieBreak === true;
	const setNumber =
		typeof record.setNumber === "number" && Number.isFinite(record.setNumber) ? record.setNumber : index + 1;
	let targetPoints =
		typeof record.targetPoints === "number" && Number.isFinite(record.targetPoints)
			? record.targetPoints
			: FORMAT_CONFIG[format].targetPoints;

	if (isTieBreak && format === "twoSetsTo11") {
		targetPoints = 1;
	}

	return {
		setNumber,
		targetPoints,
		team1Points: coerceNumber(record.team1Points),
		team2Points: coerceNumber(record.team2Points),
		winner: coerceTeamSide(record.winner),
		isTieBreak,
		endedAt: typeof record.endedAt === "number" ? record.endedAt : undefined
	};
}

function normalizeMatch(raw: unknown): Match {
	if (typeof raw !== "object" || raw === null) {
		const format = determineFormat(DEFAULT_RANK);
		return {
			id: uuid(),
			team1: "",
			team2: "",
			status: "scheduled",
			rank: DEFAULT_RANK,
			format,
			sets: createInitialSets(format),
			currentSet: 0,
			servingTeam: "team1",
			startedAt: undefined,
			endedAt: undefined,
			winner: undefined,
			decidedByTotalPoints: false
		};
	}

	const record = raw as Record<string, unknown>;
	const rank = isTournamentRank(record.rank) ? record.rank : DEFAULT_RANK;
	const format = isMatchFormat(record.format) ? record.format : determineFormat(rank);
	const setsSource = Array.isArray(record.sets) ? record.sets : [];
	const sets = setsSource.length
		? setsSource.map((set, index) => normalizeSetInput(set, index, format))
		: createInitialSets(format);

	const match: Match = {
		id: typeof record.id === "string" ? record.id : uuid(),
		team1: typeof record.team1 === "string" ? record.team1.toUpperCase() : "",
		team2: typeof record.team2 === "string" ? record.team2.toUpperCase() : "",
		status: normaliseStatus(typeof record.status === "string" ? record.status : undefined),
		rank,
		format,
		sets,
		currentSet: 0,
		servingTeam: coerceTeamSide(record.servingTeam) ?? "team1",
		startedAt: typeof record.startedAt === "number" ? record.startedAt : undefined,
		endedAt: typeof record.endedAt === "number" ? record.endedAt : undefined,
		winner: coerceTeamSide(record.winner),
		decidedByTotalPoints: record.decidedByTotalPoints === true
	};

	const storedCurrentSet = typeof record.currentSet === "number" ? record.currentSet : undefined;
	match.currentSet =
		storedCurrentSet !== undefined
			? Math.min(storedCurrentSet, Math.max(match.sets.length - 1, 0))
			: findCurrentSetIndex(match);

	const allowStatusMutation = match.status !== "scheduled";
	return evaluateMatchState(match, { allowStatusMutation });
}

async function readMatchesFromFile(): Promise<Match[]> {
	try {
		const data = await fs.readFile(dataFilePath, "utf8");
		const parsed = JSON.parse(data) as unknown;
		if (!Array.isArray(parsed)) {
			return [];
		}
		return parsed.map(entry => normalizeMatch(entry));
	} catch {
		return [];
	}
}

async function readMatchFromFile(id: string): Promise<Match | undefined> {
	const matches = await readMatchesFromFile();
	return matches.find(match => match.id === id);
}

async function saveMatches(matches: Match[]): Promise<void> {
	await ensureDataDir();
	await fs.writeFile(dataFilePath, JSON.stringify(matches, null, 2));
}

async function persistMatch(match: Match, matches?: Match[]): Promise<Match> {
	const snapshot = matches ?? (await readMatchesFromFile());
	const index = snapshot.findIndex(item => item.id === match.id);
	if (index === -1) {
		throw new Error("Match not found");
	}

	snapshot[index] = match;
	await saveMatches(snapshot);

	revalidatePath("/admin");
	revalidatePath(`/match/${match.id}`);
	revalidatePath("/match/current");
	revalidatePath("/");

	await sendMatchUpdate(match.id, match, isCurrentMatch);
	return match;
}

async function createMatch(formData: InitialMatchData): Promise<Match> {
	const matches = await readMatchesFromFile();
	const rank = formData.rank ?? DEFAULT_RANK;
	const format = determineFormat(rank);

	const newMatch: Match = {
		id: uuid(),
		team1: formData.homeTeam.trim().toUpperCase(),
		team2: formData.awayTeam.trim().toUpperCase(),
		status: "scheduled",
		rank,
		format,
		sets: createInitialSets(format),
		currentSet: 0,
		servingTeam: formData.servingTeam,
		startedAt: undefined,
		endedAt: undefined,
		winner: undefined,
		decidedByTotalPoints: false
	};

	matches.push(newMatch);
	await saveMatches(matches);

	revalidatePath("/admin");
	revalidatePath("/");
	revalidatePath("/match/current");

	await sendMatchUpdate(newMatch.id, newMatch, isCurrentMatch);
	return newMatch;
}

async function startMatch(id: string): Promise<Match> {
	const match = await readMatchFromFile(id);
	if (!match) throw new Error("Match not found");
	if (match.status !== "scheduled") throw new Error("Match must be scheduled to start");

	const updated = evaluateMatchState(
		{
			...match,
			status: "live",
			startedAt: Date.now(),
			sets: match.sets.map(set => ({ ...set }))
		},
		{ allowStatusMutation: true }
	);

	return persistMatch(updated);
}

async function updateSetScore(matchId: string, update: SetScoreUpdate): Promise<Match> {
	const match = await readMatchFromFile(matchId);
	if (!match) throw new Error("Match not found");

	const sets = match.sets.map(set => ({ ...set }));
	const targetSet = sets[update.setIndex];
	if (!targetSet) throw new Error("Set not found");

	const key = update.team === "team1" ? "team1Points" : "team2Points";
	const nextValue = targetSet[key] + update.change;
	targetSet[key] = Math.max(0, nextValue);

	const updatedMatch = evaluateMatchState(
		{
			...match,
			sets
		},
		{ allowStatusMutation: true }
	);

	return persistMatch(updatedMatch);
}

async function setServingTeam(matchId: string, servingTeam: TeamSide): Promise<Match> {
	const match = await readMatchFromFile(matchId);
	if (!match) throw new Error("Match not found");

	const updatedMatch = {
		...match,
		servingTeam
	};

	return persistMatch(updatedMatch);
}

async function endMatch(id: string): Promise<Match> {
	const match = await readMatchFromFile(id);
	if (!match) throw new Error("Match not found");

	const updated = evaluateMatchState(
		{
			...match,
			status: "finished",
			sets: match.sets.map(set => ({ ...set })),
			endedAt: Date.now()
		},
		{ allowStatusMutation: true }
	);

	return persistMatch(updated);
}

async function getCurrentLiveMatch(): Promise<Match | undefined> {
	const matches = await readMatchesFromFile();
	const liveMatches = matches.filter(match => match.status === "live");

	if (liveMatches.length === 0) {
		return undefined;
	}

	return liveMatches.sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))[0];
}

async function deleteMatch(formData: FormData): Promise<void> {
	const matchId = formData.get("matchId")! as string;
	const matches = await readMatchesFromFile();
	const matchToDelete = matches.find(m => m.id === matchId);
	const filteredMatches = matches.filter(match => match.id !== matchId);

	if (filteredMatches.length === matches.length) {
		return;
	}

	await saveMatches(filteredMatches);

	if (matchToDelete) {
		await sendMatchDeleteUpdate(matchId);
	}

	revalidatePath("/admin");
	revalidatePath("/");
	revalidatePath("/match/current");
}

async function isCurrentMatch(match: Match): Promise<boolean> {
	const matches = await readMatchesFromFile();
	const liveMatches = matches.filter(item => item.status === "live");

	if (liveMatches.length === 0) return false;

	liveMatches.sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));
	return liveMatches[0].id === match.id;
}

export { readMatchesFromFile as getMatches, readMatchFromFile as getMatch, getCurrentLiveMatch };
export { createMatch, startMatch, updateSetScore, setServingTeam, endMatch, deleteMatch, isCurrentMatch };
