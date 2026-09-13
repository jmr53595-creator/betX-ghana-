import React, { useEffect, useMemo, useState } from "react";

/* =========================================================
   BETX GHANA — API-FOOTBALL FRONTEND
   Replace YOUR_API_FOOTBALL_KEY with your API-Football key.
   ========================================================= */

const CONFIG = {
  WHATSAPP: "233504877566",

  API_BASE: "https://v3.football.api-sports.io",
  API_KEY: "YOUR_API_FOOTBALL_KEY",

  // Add/remove league IDs as required.
  LEAGUES: [
    { id: 39, name: "Premier League" },
    { id: 140, name: "LaLiga" },
    { id: 2, name: "Champions League" },
    { id: 78, name: "Bundesliga" },
    { id: 135, name: "Serie A" },
    { id: 61, name: "Ligue 1" },
    { id: 233, name: "Ghana Premier League" },
  ],

  // API-Football updates live fixtures frequently.
  REFRESH_MS: 30000,
};

/* =========================================================
   API
   ========================================================= */

async function apiFootball(endpoint) {
  if (!CONFIG.API_KEY || CONFIG.API_KEY === "YOUR_API_FOOTBALL_KEY") {
    throw new Error("API-Football API key has not been added.");
  }

  const response = await fetch(`${CONFIG.API_BASE}${endpoint}`, {
    method: "GET",
    headers: {
      "x-apisports-key": CONFIG.API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(JSON.stringify(data.errors));
  }

  return data;
}

/* =========================================================
   HELPERS
   ========================================================= */

function formatTime(dateString) {
  if (!dateString) return "--:--";

  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateString) {
  if (!dateString) return "";

  return new Date(dateString).toLocaleDateString([], {
    day: "2-digit",
    month: "short",
  });
}

function isLiveFixture(status) {
  const liveStatuses = [
    "1H",
    "HT",
    "2H",
    "ET",
    "BT",
    "P",
    "LIVE",
  ];

  return liveStatuses.includes(status);
}

function normalizeFixture(item) {
  const fixture = item.fixture;
  const league = item.league;
  const teams = item.teams;
  const goals = item.goals;
  const status = fixture.status;

  const homeScore = goals?.home;
  const awayScore = goals?.away;

  return {
    id: fixture.id,

    league: league?.name || "Football",
    leagueId: league?.id,

    country: league?.country || "",

    home: teams?.home?.name || "Home",
    away: teams?.away?.name || "Away",

    homeLogo: teams?.home?.logo || "",
    awayLogo: teams?.away?.logo || "",

    date: fixture.date,
    time: formatTime(fixture.date),

    live: isLiveFixture(status?.short),

    status: status?.short || "",
    statusLong: status?.long || "",

    minute:
      status?.elapsed !== null &&
      status?.elapsed !== undefined
        ? `${status.elapsed}'`
        : "",

    score:
      homeScore !== null &&
      homeScore !== undefined &&
      awayScore !== null &&
      awayScore !== undefined
        ? `${homeScore}-${awayScore}`
        : "vs",

    odds: {
      "1": null,
      X: null,
      "2": null,
    },

    oddsSource: null,
  };
}

/* =========================================================
   FETCH FIXTURES
   ========================================================= */

async function fetchFixtures() {
  const today = new Date().toISOString().split("T")[0];

  const data = await apiFootball(`/fixtures?date=${today}`);

  return (data.response || [])
    .map(normalizeFixture)
    .sort((a, b) => {
      if (a.live && !b.live) return -1;
      if (!a.live && b.live) return 1;

      return new Date(a.date) - new Date(b.date);
    });
}

/* =========================================================
   FETCH ODDS FOR A FIXTURE
   ========================================================= */

async function fetchFixtureOdds(fixtureId) {
  try {
    const data = await apiFootball(`/odds?fixture=${fixtureId}`);

    const bookmakers = data.response?.[0]?.bookmakers || [];

    let one = null;
    let draw = null;
    let two = null;
    let bookmakerName = null;

    /*
      Find the Match Winner market.

      API-Football normally represents:
      Home = 1
      Draw = X
      Away = 2
    */

    for (const bookmaker of bookmakers) {
      const bets = bookmaker.bets || [];

      const matchWinner = bets.find(
        (bet) =>
          bet.name === "Match Winner" ||
          bet.name === "1X2" ||
          bet.id === 1
      );

      if (!matchWinner) continue;

      const values = matchWinner.values || [];

      for (const value of values) {
        const label = String(value.value || "").toLowerCase();

        if (
          label === "home" ||
          label === "1" ||
          label.includes("home")
        ) {
          one = Number(value.odd);
        }

        if (
          label === "draw" ||
          label === "x"
        ) {
          draw = Number(value.odd);
        }

        if (
          label === "away" ||
          label === "2" ||
          label.includes("away")
        ) {
          two = Number(value.odd);
        }
      }

      if (one && draw && two) {
        bookmakerName = bookmaker.name;
        break;
      }
    }

    return {
      "1": one,
      X: draw,
      "2": two,
      bookmaker: bookmakerName,
    };
  } catch (error) {
    console.error(`Odds error for fixture ${fixtureId}:`, error);

    return {
      "1": null,
      X: null,
      "2": null,
      bookmaker: null,
    };
  }
}

/* =========================================================
   FETCH LIVE ODDS
   ========================================================= */

async function fetchLiveOdds(fixtureId) {
  try {
    const data = await apiFootball(`/odds/live?fixture=${fixtureId}`);

    const bookmakers = data.response?.[0]?.odds || [];

    let one = null;
    let draw = null;
    let two = null;

    /*
      Live odds structures can differ depending on the
      bookmaker/market returned by API-Football.

      We look for a 1X2 / Match Winner market.
    */

    for (const market of bookmakers) {
      const marketName = String(
        market.name || market.label || ""
      ).toLowerCase();

      if (
        !marketName.includes("winner") &&
        !marketName.includes("1x2") &&
        !marketName.includes("match")
      ) {
        continue;
      }

      const values = market.values || [];

      for (const value of values) {
        const label = String(
          value.value || value.name || ""
        ).toLowerCase();

        const odd = Number(
          value.odd ||
          value.odds ||
          value.price
        );

        if (!Number.isFinite(odd)) continue;

        if (
          label === "home" ||
          label === "1" ||
          label.includes("home")
        ) {
          one = odd;
        }

        if (label === "draw" || label === "x") {
          draw = odd;
        }

        if (
          label === "away" ||
          label === "2" ||
          label.includes("away")
        ) {
          two = odd;
        }
      }
    }

    return {
      "1": one,
      X: draw,
      "2": two,
    };
  } catch (error) {
    console.error("Live odds error:", error);

    return {
      "1": null,
      X: null,
      "2": null,
    };
  }
}

/* =========================================================
   FETCH EVERYTHING
   ========================================================= */

async function fetchMatchesFromAPI() {
  const fixtures = await fetchFixtures();

  /*
    Limit odds requests so we don't unnecessarily consume
    your API quota.

    Odds are fetched for the first 30 fixtures.
  */

  const oddsTargets = fixtures.slice(0, 30);

  const oddsResults = await Promise.all(
    oddsTargets.map(async (match) => {
      const odds = match.live
        ? await fetchLiveOdds(match.id)
        : await fetchFixtureOdds(match.id);

      return {
        id: match.id,
        odds,
      };
    })
  );

  const oddsMap = new Map(
    oddsResults.map((item) => [item.id, item.odds])
  );

  return fixtures.map((match) => ({
    ...match,

    odds: oddsMap.get(match.id) || {
      "1": null,
      X: null,
      "2": null,
    },

    oddsSource:
      oddsMap.get(match.id)?.bookmaker || null,
  }));
}

/* =========================================================
   UI COMPONENTS
   ========================================================= */

function TeamLogo({ src, name }) {
  if (!src) {
    return (
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "#333",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          color: "#aaa",
        }}
      >
        ⚽
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      style={{
        width: 28,
        height: 28,
        objectFit: "contain",
      }}
    />
  );
}

function OddsButton({
  label,
  odd,
  selected,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      disabled={!odd}
      style={{
        background: selected
          ? "#e00000"
          : odd
          ? "#383838"
          : "#242424",

        color: selected
          ? "#fff"
          : odd
          ? "#ffeb3b"
          : "#666",

        border: selected
          ? "1px solid #ff3333"
          : "1px solid #444",

        borderRadius: 5,
        minHeight: 42,
        cursor: odd ? "pointer" : "not-allowed",
        fontWeight: "bold",
        fontSize: 13,
      }}
    >
      <div>{label}</div>

      <div style={{ marginTop: 3 }}>
        {odd ? Number(odd).toFixed(2) : "—"}
      </div>
    </button>
  );
}

/* =========================================================
   MAIN APP
   ========================================================= */

export default function App() {
  const [matches, setMatches] = useState([]);

  const [selected, setSelected] = useState(null);

  const [bets, setBets] = useState([]);

  const [tickets, setTickets] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("betx_tickets") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [paperStake, setPaperStake] = useState(10);

  const [tab, setTab] = useState("home");

  const [filter, setFilter] = useState("all");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [lastUpdated, setLastUpdated] = useState(null);

  const [refreshing, setRefreshing] = useState(false);

  /* =======================================================
     LOAD DATA
     ======================================================= */

  const loadMatches = async () => {
    try {
      setError("");

      const data = await fetchMatchesFromAPI();

      setMatches(data);

      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to connect to API-Football."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMatches();

    const interval = setInterval(() => {
      loadMatches();
    }, CONFIG.REFRESH_MS);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "betx_tickets",
      JSON.stringify(tickets)
    );
  }, [tickets]);

  /* =======================================================
     BET CALCULATIONS
     ======================================================= */

  const totalOdds = useMemo(() => {
    if (!bets.length) return 0;

    return bets.reduce(
      (total, bet) => total * Number(bet.odd),
      1
    );
  }, [bets]);

  const possibleWin =
    totalOdds && paperStake
      ? totalOdds * Number(paperStake)
      : 0;

  /* =======================================================
     FILTER MATCHES
     ======================================================= */

  const filteredMatches = useMemo(() => {
    let list = [...matches];

    if (filter === "live") {
      list = list.filter((match) => match.live);
    }

    if (filter === "upcoming") {
      list = list.filter((match) => !match.live);
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      list = list.filter(
        (match) =>
          match.home.toLowerCase().includes(query) ||
          match.away.toLowerCase().includes(query) ||
          match.league.toLowerCase().includes(query)
      );
    }

    return list;
  }, [matches, filter, search]);

  /* =======================================================
     ADD / REMOVE BET
     ======================================================= */

  const addBet = (match, type, odd) => {
    if (!odd) return;

    const id = `${match.id}-${type}`;

    setBets((current) => {
      const exists = current.some(
        (bet) => bet.id === id
      );

      if (exists) {
        return current.filter(
          (bet) => bet.id !== id
        );
      }

      /*
        Remove another market from the same fixture.
        This keeps 1X2 selections sensible.
      */

      const withoutSameMatch = current.filter(
        (bet) => bet.matchId !== match.id
      );

      return [
        ...withoutSameMatch,
        {
          id,
          matchId: match.id,
          game: `${match.home} vs ${match.away}`,
          league: match.league,
          type,
          odd: Number(odd),
        },
      ];
    });
  };

  /* =======================================================
     PLACE PAPER TICKET
     ======================================================= */

  const placePaperTicket = () => {
    if (!bets.length) return;

    const stake = Number(paperStake);

    if (!stake || stake <= 0) {
      alert("Enter a valid stake.");
      return;
    }

    const ticket = {
      id:
        "BX" +
        Date.now()
          .toString()
          .slice(-8),

      createdAt: new Date().toISOString(),

      stake,

      odds: Number(totalOdds.toFixed(2)),

      possibleWin: Number(
        possibleWin.toFixed(2)
      ),

      status: "Open",

      picks: [...bets],
    };

    setTickets((current) => [
      ticket,
      ...current,
    ]);

    setBets([]);

    setTab("bets");
  };

  /* =======================================================
     SELECT MATCH
     ======================================================= */

  if (selected) {
    return (
      <MatchDetails
        match={selected}
        bets={bets}
        addBet={addBet}
        setSelected={setSelected}
        totalOdds={totalOdds}
        paperStake={paperStake}
        setPaperStake={setPaperStake}
        possibleWin={possibleWin}
        placePaperTicket={placePaperTicket}
      />
    );
  }

  /* =======================================================
     APP
     ======================================================= */

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0c0c0c",
        color: "#fff",
        fontFamily:
          "Arial, Helvetica, sans-serif",
        paddingBottom:
          bets.length ? 145 : 65,
      }}
    >
      {/* HEADER */}

      <header
        style={{
          background:
            "linear-gradient(135deg,#e00000,#a80000)",
          padding: "13px 15px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow:
            "0 2px 10px rgba(0,0,0,.35)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 21,
              fontWeight: 900,
              fontStyle: "italic",
            }}
          >
            BetX Ghana
          </div>

          <div
            style={{
              fontSize: 9,
              opacity: 0.8,
              marginTop: 2,
            }}
          >
            FOOTBALL CENTRE
          </div>
        </div>

        <button
          onClick={() => {
            setRefreshing(true);
            loadMatches();
          }}
          style={{
            background:
              "rgba(0,0,0,.22)",
            border: "1px solid rgba(255,255,255,.2)",
            color: "#fff",
            borderRadius: 20,
            padding: "7px 11px",
            cursor: "pointer",
          }}
        >
          {refreshing ? "↻" : "⟳"} Refresh
        </button>
      </header>

      {/* CONNECTION STATUS */}

      <div
        style={{
          background: "#171717",
          borderBottom:
            "1px solid #252525",
          padding: "8px 12px",
          fontSize: 10,
          color: error
            ? "#ff6b6b"
            : "#62e36b",
        }}
      >
        <span>
          {error
            ? "● API connection problem"
            : "● API-Football connected"}
        </span>

        {lastUpdated && !error && (
          <span
            style={{
              color: "#888",
              marginLeft: 10,
            }}
          >
            Updated{" "}
            {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* ERROR */}

      {error && (
        <div
          style={{
            margin: 12,
            padding: 14,
            background: "#281414",
            border:
              "1px solid #7a2525",
            borderRadius: 8,
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: 5,
            }}
          >
            API-Football connection error
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#bbb",
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 11,
              color: "#ffb0b0",
            }}
          >
            Check that your API key is entered
            correctly in CONFIG.API_KEY.
          </div>
        </div>
      )}

      {/* SEARCH */}

      {tab === "home" && (
        <>
          <div
            style={{
              padding: 10,
              background: "#121212",
            }}
          >
            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search team or league..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#242424",
                border:
                  "1px solid #363636",
                color: "#fff",
                borderRadius: 7,
                padding: "11px 13px",
                outline: "none",
              }}
            />
          </div>

          {/* FILTERS */}

          <div
            style={{
              display: "flex",
              gap: 7,
              overflowX: "auto",
              padding:
                "3px 10px 10px",
              background: "#121212",
            }}
          >
            {[
              ["all", "All"],
              ["live", "🔴 Live"],
              ["upcoming", "Upcoming"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() =>
                  setFilter(value)
                }
                style={{
                  whiteSpace: "nowrap",
                  background:
                    filter === value
                      ? "#e00000"
                      : "#292929",
                  border: "none",
                  color: "#fff",
                  padding:
                    "8px 13px",
                  borderRadius: 18,
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: "bold",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* HOME */}

      {tab === "home" && (
        <main>
          {loading ? (
            <Loading />
          ) : filteredMatches.length === 0 ? (
            <EmptyMatches />
          ) : (
            filteredMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                bets={bets}
                addBet={addBet}
                openDetails={() =>
                  setSelected(match)
                }
              />
            ))
          )}
        </main>
      )}

      {/* BETS */}

      {tab === "bets" && (
        <BetsPage
          tickets={tickets}
          bets={bets}
          totalOdds={totalOdds}
          paperStake={paperStake}
          setPaperStake={setPaperStake}
          possibleWin={possibleWin}
          addBet={addBet}
          placePaperTicket={
            placePaperTicket
          }
        />
      )}

      {/* ME */}

      {tab === "me" && (
        <MePage
          matches={matches}
          tickets={tickets}
        />
      )}

      {/* BET SLIP */}

      {bets.length > 0 && (
        <BetSlip
          bets={bets}
          totalOdds={totalOdds}
          paperStake={paperStake}
          setPaperStake={setPaperStake}
          possibleWin={possibleWin}
          setBets={setBets}
          placePaperTicket={
            placePaperTicket
          }
        />
      )}

      {/* BOTTOM NAV */}

      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 58,
          background: "#111",
          borderTop:
            "1px solid #292929",
          display: "grid",
          gridTemplateColumns:
            "repeat(3,1fr)",
          zIndex: 60,
        }}
      >
        <NavButton
          active={tab === "home"}
          icon="⚽"
          label="Home"
          onClick={() =>
            setTab("home")
          }
        />

        <NavButton
          active={tab === "bets"}
          icon="🧾"
          label={`Bets${
            bets.length
              ? ` (${bets.length})`
              : ""
          }`}
          onClick={() =>
            setTab("bets")
          }
        />

        <NavButton
          active={tab === "me"}
          icon="👤"
          label="Me"
          onClick={() =>
            setTab("me")
          }
        />
      </nav>
    </div>
  );
}

/* =========================================================
   MATCH CARD
   ========================================================= */

function MatchCard({
  match,
  bets,
  addBet,
  openDetails,
}) {
  return (
    <div
      style={{
        background: "#202020",
        marginBottom: 5,
        borderBottom:
          "1px solid #101010",
      }}
    >
      <div
        onClick={openDetails}
        style={{
          padding:
            "8px 11px",
          display: "flex",
          justifyContent:
            "space-between",
          cursor: "pointer",
          background: "#292929",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              color: "#aaa",
            }}
          >
            {match.league}
            {match.country
              ? ` • ${match.country}`
              : ""}
          </div>

          <div
            style={{
              fontSize: 9,
              color: "#666",
              marginTop: 2,
            }}
          >
            {formatDate(match.date)}
          </div>
        </div>

        <div
          style={{
            textAlign: "right",
          }}
        >
          {match.live ? (
            <>
              <div
                style={{
                  color: "#00e676",
                  fontWeight:
                    "bold",
                  fontSize: 11,
                }}
              >
                ● LIVE
              </div>

              <div
                style={{
                  color: "#fff",
                  fontWeight:
                    "bold",
                  marginTop: 2,
                }}
              >
                {match.score}
                {match.minute
                  ? ` • ${match.minute}`
                  : ""}
              </div>
            </>
          ) : (
            <div
              style={{
                color: "#ddd",
                fontWeight:
                  "bold",
                fontSize: 11,
              }}
            >
              {match.time}
            </div>
          )}
        </div>
      </div>

      {/* TEAMS */}

      <div
        onClick={openDetails}
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 40px 1fr",
          alignItems: "center",
          padding:
            "11px 10px 7px",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <TeamLogo
            src={match.homeLogo}
            name={match.home}
          />

          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {match.home}
          </span>
        </div>

        <div
          style={{
            textAlign: "center",
            color: "#777",
            fontSize: 10,
          }}
        >
          VS
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "flex-end",
            gap: 7,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              textAlign: "right",
            }}
          >
            {match.away}
          </span>

          <TeamLogo
            src={match.awayLogo}
            name={match.away}
          />
        </div>
      </div>

      {/* ODDS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3,1fr)",
          gap: 5,
          padding:
            "3px 10px 11px",
        }}
      >
        {[
          ["1", match.odds["1"]],
          ["X", match.odds.X],
          ["2", match.odds["2"]],
        ].map(([type, odd]) => {
          const selected = bets.some(
            (bet) =>
              bet.id ===
              `${match.id}-${type}`
          );

          return (
            <OddsButton
              key={type}
              label={type}
              odd={odd}
              selected={selected}
              onClick={() =>
                addBet(
                  match,
                  type,
                  odd
                )
              }
            />
          );
        })}
      </div>

      {match.oddsSource && (
        <div
          style={{
            padding:
              "0 10px 8px",
            fontSize: 8,
            color: "#666",
            textAlign: "right",
          }}
        >
          Odds: {match.oddsSource}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MATCH DETAILS
   ========================================================= */

function MatchDetails({
  match,
  bets,
  addBet,
  setSelected,
  totalOdds,
  paperStake,
  setPaperStake,
  possibleWin,
  placePaperTicket,
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0d0d",
        color: "#fff",
        paddingBottom:
          bets.length ? 150 : 30,
        fontFamily:
          "Arial, Helvetica, sans-serif",
      }}
    >
      {/* TOP */}

      <div
        style={{
          background:
            "linear-gradient(135deg,#e00000,#a80000)",
          padding: 13,
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <button
          onClick={() =>
            setSelected(null)
          }
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          ← Back
        </button>

        <strong
          style={{
            fontSize: 13,
          }}
        >
          Match
        </strong>

        <span
          style={{
            width: 45,
          }}
        />
      </div>

      {/* MATCH */}

      <div
        style={{
          padding: 25,
          textAlign: "center",
          background:
            "linear-gradient(#191919,#111)",
        }}
      >
        <div
          style={{
            color: "#999",
            fontSize: 11,
            marginBottom: 15,
          }}
        >
          {match.league}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent:
              "center",
            alignItems: "center",
            gap: 25,
          }}
        >
          <TeamDetail
            logo={match.homeLogo}
            name={match.home}
          />

          <div
            style={{
              color: "#777",
              fontSize: 12,
            }}
          >
            {match.live ? (
              <>
                <div
                  style={{
                    color: "#00e676",
                    fontWeight:
                      "bold",
                  }}
                >
                  LIVE
                </div>

                <div
                  style={{
                    fontSize: 23,
                    color: "#fff",
                    fontWeight:
                      "bold",
                    marginTop: 6,
                  }}
                >
                  {match.score}
                </div>

                <div
                  style={{
                    fontSize: 10,
                    marginTop: 3,
                  }}
                >
                  {match.minute}
                </div>
              </>
            ) : (
              <>
                <div>VS</div>

                <div
                  style={{
                    marginTop: 5,
                    color: "#ddd",
                    fontWeight:
                      "bold",
                  }}
                >
                  {match.time}
                </div>
              </>
            )}
          </div>

          <TeamDetail
            logo={match.awayLogo}
            name={match.away}
          />
        </div>
      </div>

      {/* MARKET */}

      <div
        style={{
          padding: 12,
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            fontSize: 14,
            marginBottom: 10,
          }}
        >
          Match Result
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3,1fr)",
            gap: 7,
          }}
        >
          {[
            ["1", match.odds["1"]],
            ["X", match.odds.X],
            ["2", match.odds["2"]],
          ].map(([type, odd]) => (
            <OddsButton
              key={type}
              label={
                type === "1"
                  ? "Home"
                  : type === "X"
                  ? "Draw"
                  : "Away"
              }
              odd={odd}
              selected={bets.some(
                (bet) =>
                  bet.id ===
                  `${match.id}-${type}`
              )}
              onClick={() =>
                addBet(
                  match,
                  type,
                  odd
                )
              }
            />
          ))}
        </div>
      </div>

      {/* PAPER BET SLIP */}

      {bets.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "#1b1b1b",
            borderTop:
              "2px solid #e00000",
            padding: 12,
            zIndex: 50,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              fontSize: 11,
              marginBottom: 8,
            }}
          >
            <span>
              {bets.length} selection
              {bets.length !== 1
                ? "s"
                : ""}
            </span>

            <span
              style={{
                color: "#ffeb3b",
                fontWeight:
                  "bold",
              }}
            >
              {totalOdds.toFixed(2)}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: 7,
            }}
          >
            <input
              type="number"
              min="1"
              value={paperStake}
              onChange={(e) =>
                setPaperStake(
                  Number(e.target.value)
                )
              }
              style={{
                width: 80,
                background: "#080808",
                color: "#fff",
                border:
                  "1px solid #444",
                borderRadius: 5,
                padding: 9,
              }}
            />

            <button
              onClick={
                placePaperTicket
              }
              style={{
                flex: 1,
                background:
                  "#e00000",
                color: "#fff",
                border: "none",
                borderRadius: 5,
                fontWeight:
                  "bold",
              }}
            >
              Create Paper Ticket •{" "}
              GH₵{" "}
              {possibleWin.toFixed(2)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   TEAM DETAIL
   ========================================================= */

function TeamDetail({ logo, name }) {
  return (
    <div
      style={{
        width: 100,
        textAlign: "center",
      }}
    >
      <div
        style={{
          height: 55,
          display: "flex",
          justifyContent:
            "center",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        {logo ? (
          <img
            src={logo}
            alt={name}
            style={{
              maxWidth: 55,
              maxHeight: 55,
              objectFit:
                "contain",
            }}
          />
        ) : (
          "⚽"
        )}
      </div>

      <div
        style={{
          fontSize: 12,
          fontWeight: "bold",
        }}
      >
        {name}
      </div>
    </div>
  );
}

/* =========================================================
   BET SLIP
   ========================================================= */

function BetSlip({
  bets,
  totalOdds,
  paperStake,
  setPaperStake,
  possibleWin,
  setBets,
  placePaperTicket,
}) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 58,
        left: 0,
        right: 0,
        background: "#181818",
        borderTop:
          "2px solid #e00000",
        padding: 10,
        zIndex: 55,
        boxShadow:
          "0 -5px 20px rgba(0,0,0,.45)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          fontSize: 11,
        }}
      >
        <strong>
          BET SLIP ({bets.length})
        </strong>

        <button
          onClick={() => setBets([])}
          style={{
            background: "none",
            border: "none",
            color: "#ff5555",
            cursor: "pointer",
          }}
        >
          Clear
        </button>
      </div>

      <div
        style={{
          maxHeight: 70,
          overflowY: "auto",
          marginTop: 6,
        }}
      >
        {bets.map((bet) => (
          <div
            key={bet.id}
            style={{
              fontSize: 10,
              color: "#bbb",
              padding: "2px 0",
            }}
          >
            {bet.game} •{" "}
            <strong
              style={{
                color: "#ffeb3b",
              }}
            >
              {bet.type}@{" "}
              {bet.odd.toFixed(2)}
            </strong>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "75px 1fr 1fr",
          gap: 7,
          marginTop: 8,
        }}
      >
        <input
          type="number"
          min="1"
          value={paperStake}
          onChange={(e) =>
            setPaperStake(
              Number(e.target.value)
            )
          }
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: "#050505",
            color: "#fff",
            border:
              "1px solid #444",
            borderRadius: 5,
            padding: 9,
          }}
        />

        <div
          style={{
            background: "#242424",
            borderRadius: 5,
            padding: 8,
            fontSize: 9,
          }}
        >
          <div
            style={{
              color: "#777",
            }}
          >
            TOTAL ODDS
          </div>

          <strong
            style={{
              color: "#ffeb3b",
            }}
          >
            {totalOdds.toFixed(2)}
          </strong>
        </div>

        <button
          onClick={placePaperTicket}
          style={{
            background:
              "#e00000",
            color: "#fff",
            border: "none",
            borderRadius: 5,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Ticket
        </button>
      </div>

      <div
        style={{
          textAlign: "right",
          fontSize: 9,
          color: "#777",
          marginTop: 5,
        }}
      >
        Possible return: GH₵{" "}
        {possibleWin.toFixed(2)}
      </div>
    </div>
  );
}

/* =========================================================
   BETS PAGE
   ========================================================= */

function BetsPage({
  tickets,
  bets,
  totalOdds,
  paperStake,
  setPaperStake,
  possibleWin,
  addBet,
  placePaperTicket,
}) {
  return (
    <div
      style={{
        padding: 12,
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: "bold",
          marginBottom: 3,
        }}
      >
        My Tickets
      </div>

      <div
        style={{
          color: "#777",
          fontSize: 11,
          marginBottom: 15,
        }}
      >
        Your locally saved paper tickets
      </div>

      {tickets.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: "#555",
            paddingTop: 70,
          }}
        >
          <div
            style={{
              fontSize: 40,
              marginBottom: 10,
            }}
          >
            🧾
          </div>

          No tickets yet
        </div>
      ) : (
        tickets.map((ticket) => (
          <div
            key={ticket.id}
            style={{
              background: "#202020",
              border:
                "1px solid #303030",
              borderRadius: 9,
              padding: 12,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
              }}
            >
              <strong>
                {ticket.id}
              </strong>

              <span
                style={{
                  background:
                    "#754d00",
                  color:
                    "#ffd76a",
                  borderRadius: 15,
                  padding:
                    "3px 8px",
                  fontSize: 9,
                }}
              >
                {ticket.status}
              </span>
            </div>

            <div
              style={{
                fontSize: 9,
                color: "#777",
                marginTop: 5,
              }}
            >
              {new Date(
                ticket.createdAt
              ).toLocaleString()}
            </div>

            <div
              style={{
                marginTop: 10,
              }}
            >
              {ticket.picks.map(
                (pick) => (
                  <div
                    key={pick.id}
                    style={{
                      borderTop:
                        "1px solid #303030",
                      padding:
                        "8px 0",
                      fontSize: 11,
                    }}
                  >
                    <div>
                      {pick.game}
                    </div>

                    <div
                      style={{
                        color:
                          "#ffeb3b",
                        marginTop: 3,
                      }}
                    >
                      {pick.type} @{" "}
                      {pick.odd.toFixed(
                        2
                      )}
                    </div>
                  </div>
                )
              )}
            </div>

            <div
              style={{
                borderTop:
                  "1px solid #303030",
                paddingTop: 9,
                display: "flex",
                justifyContent:
                  "space-between",
                fontSize: 11,
              }}
            >
              <span>
                Stake: GH₵{" "}
                {Number(
                  ticket.stake
                ).toFixed(2)}
              </span>

              <strong>
                Possible: GH₵{" "}
                {Number(
                  ticket.possibleWin
                ).toFixed(2)}
              </strong>
            </div>
          </div>
        ))
      )}

      {bets.length > 0 && (
        <div
          style={{
            marginTop: 15,
            background: "#181818",
            padding: 12,
            borderRadius: 8,
          }}
        >
          <strong>
            Current selection
          </strong>

          <div
            style={{
              fontSize: 10,
              color: "#aaa",
              marginTop: 5,
            }}
          >
            {bets.length} selection(s) •{" "}
            {totalOdds.toFixed(2)}
          </div>

          <input
            type="number"
            value={paperStake}
            onChange={(e) =>
              setPaperStake(
                Number(
                  e.target.value
                )
              )
            }
            style={{
              marginTop: 10,
              width: "100%",
              boxSizing: "border-box",
              background: "#050505",
              border:
                "1px solid #333",
              color: "#fff",
              padding: 10,
              borderRadius: 5,
            }}
          />

          <button
            onClick={
              placePaperTicket
            }
            style={{
              width: "100%",
              marginTop: 8,
              padding: 11,
              background:
                "#e00000",
              border: "none",
              color: "#fff",
              borderRadius: 5,
              fontWeight: "bold",
            }}
          >
            Create Paper Ticket • GH₵{" "}
            {possibleWin.toFixed(2)}
          </button>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   ME PAGE
   ========================================================= */

function MePage({
  matches,
  tickets,
}) {
  const live = matches.filter(
    (match) => match.live
  ).length;

  return (
    <div
      style={{
        padding: 15,
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(135deg,#242424,#171717)",
          border:
            "1px solid #303030",
          borderRadius: 10,
          padding: 18,
        }}
      >
        <div
          style={{
            width: 55,
            height: 55,
            borderRadius: "50%",
            background:
              "#e00000",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
            fontSize: 25,
            marginBottom: 10,
          }}
        >
          👤
        </div>

        <div
          style={{
            fontSize: 18,
            fontWeight: "bold",
          }}
        >
          BetX User
        </div>

        <div
          style={{
            color: "#777",
            fontSize: 10,
            marginTop: 3,
          }}
        >
          Football account
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr",
          gap: 8,
          marginTop: 10,
        }}
      >
        <Stat
          value={matches.length}
          label="Today's Matches"
        />

        <Stat
          value={live}
          label="Live Now"
        />

        <Stat
          value={tickets.length}
          label="Tickets"
        />

        <Stat
          value="API"
          label="Data Source"
        />
      </div>

      <div
        style={{
          marginTop: 15,
          background: "#1c1c1c",
          borderRadius: 8,
          padding: 13,
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            marginBottom: 12,
          }}
        >
          About
        </div>

        <InfoRow
          label="Sports data"
          value="API-Football"
        />

        <InfoRow
          label="Live refresh"
          value="30 seconds"
        />

        <InfoRow
          label="Markets"
          value="Match Result"
        />

        <InfoRow
          label="Ticket mode"
          value="Paper / local"
        />
      </div>
    </div>
  );
}

/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function Stat({ value, label }) {
  return (
    <div
      style={{
        background: "#1c1c1c",
        borderRadius: 8,
        padding: 15,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: "bold",
          color: "#ffeb3b",
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: "#777",
          fontSize: 9,
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        padding: "9px 0",
        borderBottom:
          "1px solid #292929",
        fontSize: 11,
      }}
    >
      <span
        style={{
          color: "#777",
        }}
      >
        {label}
      </span>

      <span>{value}</span>
    </div>
  );
}

function NavButton({
  active,
  icon,
  label,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        color: active
          ? "#e00000"
          : "#777",
        cursor: "pointer",
        fontSize: 10,
        fontWeight: active
          ? "bold"
          : "normal",
      }}
    >
      <div
        style={{
          fontSize: 18,
          marginBottom: 2,
        }}
      >
        {icon}
      </div>

      {label}
    </button>
  );
}

function Loading() {
  return (
    <div
      style={{
        padding: 60,
        textAlign: "center",
        color: "#777",
      }}
    >
      <div
        style={{
          fontSize: 30,
          marginBottom: 10,
        }}
      >
        ⚽
      </div>

      Loading real football data...
    </div>
  );
}

function EmptyMatches() {
  return (
    <div
      style={{
        padding: 70,
        textAlign: "center",
        color: "#666",
      }}
    >
      <div
        style={{
          fontSize: 35,
          marginBottom: 10,
        }}
      >
        ⚽
      </div>

      <div>
        No matches found.
      </div>

      <div
        style={{
          fontSize: 10,
          marginTop: 5,
        }}
      >
        Try another search or filter.
      </div>
    </div>
  );
}
