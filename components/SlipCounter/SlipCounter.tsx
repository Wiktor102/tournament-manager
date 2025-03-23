"use client";

import { useState, useEffect } from "react";
import { getSlipCount } from "@/app/actions/slipCounterActions";
import "./SlipCounter.scss";

export default function SlipCounter() {
	const [slipCount, setSlipCount] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchSlipCount = async () => {
			setIsLoading(true);
			try {
				const count = await getSlipCount();
				setSlipCount(count);
			} catch (error) {
				console.error("Error fetching slip count:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchSlipCount();

		// Set up interval to periodically check for updates
		const intervalId = setInterval(fetchSlipCount, 5000);

		return () => clearInterval(intervalId);
	}, []);

	if (isLoading && slipCount === null) {
		return <div className="slip-counter">Ładowanie...</div>;
	}

	return (
		<div className="slip-counter">
			<div className="slip-counter-label">Poślizgnięcia:</div>
			<div className="slip-counter-value">{slipCount}</div>
		</div>
	);
}
