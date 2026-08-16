import { useNavigate, Navigate } from "react-router-dom";
import { isTokenValid } from "../utils/tokenUtils";
import heroImg from "../assets/hero.png";
import "./home.css";

const STEPS = [
    {
        n: "01",
        title: "Upload your resume",
        body: "Drop in a PDF and we read it once — your skills and experience shape every question that follows.",
    },
    {
        n: "02",
        title: "Answer, level by level",
        body: "Work through 100 graded levels. Speak your answer or type it — either way, it's scored the same.",
    },
    {
        n: "03",
        title: "See where you stand",
        body: "Each level ends with real feedback: what landed, what didn't, and whether you're ready for the next one.",
    },
];

const LADDER = [
    { level: 1, status: "passed" },
    { level: 2, status: "passed" },
    { level: 3, status: "passed" },
    { level: 4, status: "ongoing" },
    { level: 5, status: "locked" },
    { level: 6, status: "locked" },
    { level: 7, status: "locked" },
    { level: 8, status: "locked" },
];

function Home() {
    const navigate = useNavigate();

    // Already signed in — skip the pitch, go straight to work.
    if (isTokenValid()) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="home">
            <nav className="home-nav">
                <span className="home-brand">Ascend</span>
                <div className="home-nav-actions">
                    <button
                        className="home-nav-link"
                        onClick={() => navigate("/login")}
                        type="button"
                    >
                        Log in
                    </button>
                    <button
                        className="home-nav-cta"
                        onClick={() => navigate("/register")}
                        type="button"
                    >
                        Get started
                    </button>
                </div>
            </nav>

            <header className="home-hero">
                <div className="home-hero-copy">
                    <span className="home-eyebrow">AI mock interviews</span>
                    <h1>
                        Practice interviews,
                        <br />
                        level by level.
                    </h1>
                    <p className="home-hero-sub">
                        Upload your resume, answer role-aware technical
                        questions by voice or text, and climb through 100
                        graded levels until you're actually ready for the
                        real thing.
                    </p>
                    <div className="home-hero-actions">
                        <button
                            className="home-btn-primary"
                            onClick={() => navigate("/register")}
                            type="button"
                        >
                            Start practicing
                        </button>
                        <button
                            className="home-btn-ghost"
                            onClick={() => navigate("/login")}
                            type="button"
                        >
                            I already have an account
                        </button>
                    </div>
                </div>

                <div className="home-hero-art">
                    <div className="home-hero-glow" aria-hidden="true" />
                    <img
                        className="home-hero-img"
                        src={heroImg}
                        alt="Layered card illustration representing stacked interview levels"
                    />
                </div>
            </header>

            <section className="home-steps">
                <span className="home-section-label">How it works</span>
                <div className="home-steps-grid">
                    {STEPS.map((step) => (
                        <div className="home-step" key={step.n}>
                            <span className="home-step-n">{step.n}</span>
                            <h3>{step.title}</h3>
                            <p>{step.body}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="home-ladder">
                <span className="home-section-label">100 levels, one at a time</span>
                <p className="home-ladder-sub">
                    Every level unlocks the next. Pass one, and the tile
                    above it lights up.
                </p>

                <div className="home-ladder-grid">
                    {LADDER.map((tile) => (
                        <div
                            key={tile.level}
                            className={`home-tile home-tile-${tile.status}`}
                        >
                            {tile.status === "passed" && (
                                <span className="home-tile-icon">✓</span>
                            )}
                            {tile.status === "locked" && (
                                <span className="home-tile-icon">🔒</span>
                            )}
                            <span className="home-tile-num">{tile.level}</span>
                        </div>
                    ))}
                    <div className="home-tile home-tile-more">
                        <span className="home-tile-num">+92</span>
                    </div>
                </div>
            </section>

            <section className="home-final-cta">
                <h2>Your next interview shouldn't be the first time you're tested.</h2>
                <button
                    className="home-btn-primary"
                    onClick={() => navigate("/register")}
                    type="button"
                >
                    Start practicing — it's free
                </button>
            </section>

            <footer className="home-footer">
                <span>Ascend</span>
                <span className="home-footer-note">
                    Built to make the next interview feel like the tenth one.
                </span>
            </footer>
        </div>
    );
}

export default Home;
