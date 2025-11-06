import "./HomePage.css";
import Link from "next/link";
import Image from "next/image";

function Home() {
	return (
		<div className="home-container">
			<div className="home-content">
				<Image src="/elektronik-logo.png" alt="Liga elektronika" width={128} height={128} />
				<h1 className="home-title">Liga Elektronika</h1>
				<p className="home-subtitle">Menedżer szkolnych turniejów sportowych</p>

				<div className="home-button-grid">
					<Link href="/admin" className="home-button">
						<span className="home-button-icon">⚙️</span>
						<span className="home-button-text">Panel Administratorski</span>
					</Link>
					<Link href="/match/current" className="home-button">
						<span className="home-button-icon">🏐</span>
						<span className="home-button-text">Obecny mecz</span>
					</Link>
				</div>
			</div>
		</div>
	);
}

export default Home;
