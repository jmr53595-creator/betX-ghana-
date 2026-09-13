import React, { useEffect, useMemo, useState } from "react";

/* =========================================================
   BETX GHANA
   API-FOOTBALL FOOTBALL CENTRE
   ========================================================= */

const CONFIG = {
  WHATSAPP: "233504877566",

  API_BASE: "https://v3.football.api-sports.io",

  // PUT YOUR AUTHORIZED API-FOOTBALL KEY HERE
  API_KEY: "YOUR_API_FOOTBALL_KEY",

  REFRESH_MS: 30000,

  LEAGUES: [
    { id: 39, name: "Premier League" },
    { id: 140, name: "LaLiga" },
    { id: 2, name: "Champions League" },
    { id: 78, name: "Bundesliga" },
    { id: 135, name: "Serie A" },
    { id: 61, name: "Ligue 1" },
    { id: 233, name: "Ghana Premier League" },
  ],
};

/* =========================================================
   API-FOOTBALL
   ========================================================= */

async function apiFootball(endpoint) {
  if (
    !CONFIG.API_KEY ||
    CONFIG.API_KEY === "YOUR_API_FOOTBALL_KEY"
  ) {
    throw new Error("NO_KEY");
  }

  const response = await fetch(
    `${CONFIG.API_BASE}${endpoint}`,
    {
      method: "GET",
      headers: {
        "x-apisports-key": CONFIG.API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();

  if (
    data.errors &&
    Object.keys(data.errors).length > 0
  ) {
    throw new Error(
      Object.values(data.errors).join(", ")
    );
  }

  return data;
}

/* =========================================================
   HELPERS
   ========================================================= */

function formatTime(date) {
  if (!date) return "--:--";

  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isLiveFixture(status) {
  return [
    "1H",
    "HT",
    "2H",
    "ET",
    "BT",
    "P",
    "LIVE",
  ].includes(status);
}

function normalizeFixture(item) {
  const fixture = item.fixture || {};
  const league = item.league || {};
  const teams = item.teams || {};
  const goals = item.goals || {};
  const status = fixture.status || {};

  return {
    id: fixture.id,

    league: league.name || "Football",
    leagueId: league.id,
    country: league.country || "",

    home: teams.home?.name || "Home",
    away: teams.away?.name || "Away",

    homeLogo: teams.home?.logo || "",
    awayLogo: teams.away?.logo || "",

    date: fixture.date,
    time: formatTime(fixture.date),

    live: isLiveFixture(status.short),

    status: status.short || "",
    statusLong: status.long || "",

    minute:
      status.elapsed != null
        ? `${status.elapsed}'`
        : "",

    score:
      goals.home != null && goals.away != null
        ? `${goals.home}-${goals.away}`
        : "vs",

    odds: {
      "1": null,
      X: null,
      "2": null,
    },

    markets: {
      "1X2": {},
      "Over/Under": {},
      "Double Chance": {},
      "1st Half O/U": {},
      Handicap: {},
      "Next Goal": {},
    },

    oddsSource: null,
  };
}

/* =========================================================
   FIXTURES
   ========================================================= */

async function fetchFixtures() {
  const today = new Date()
    .toISOString()
    .split("T")[0];

  const data = await apiFootball(
    `/fixtures?date=${today}`
  );

  return (data.response || [])
    .map(normalizeFixture)
    .sort((a, b) => {
      if (a.live && !b.live) return -1;
      if (!a.live && b.live) return 1;

      return (
        new Date(a.date) -
        new Date(b.date)
      );
    });
}

/* =========================================================
   ODDS
   ========================================================= */

async function fetchFixtureOdds(fixtureId) {
  try {
    const data = await apiFootball(
      `/odds?fixture=${fixtureId}`
    );

    const bookmakers =
      data.response?.[0]?.bookmakers || [];

    const result = {
      "1": null,
      X: null,
      "2": null,

      "Over 1.5": null,
      "Under 1.5": null,

      "Over 2.5": null,
      "Under 2.5": null,

      bookmaker: null,
    };

    for (const bookmaker of bookmakers) {
      for (const market of bookmaker.bets || []) {
        const marketName =
          String(market.name || "").toLowerCase();

        /* -------------------------
           1X2
        ------------------------- */

        if (
          market.id === 1 ||
          marketName.includes("match winner") ||
          marketName === "1x2"
        ) {
          for (const value of market.values || []) {
            const label = String(
              value.value || ""
            ).toLowerCase();

            const odd = Number(value.odd);

            if (!Number.isFinite(odd)) continue;

            if (
              label === "home" ||
              label === "1"
            ) {
              result["1"] = odd;
            }

            if (
              label === "draw" ||
              label === "x"
            ) {
              result.X = odd;
            }

            if (
              label === "away" ||
              label === "2"
            ) {
              result["2"] = odd;
            }
          }

          if (
            result["1"] &&
            result.X &&
            result["2"]
          ) {
            result.bookmaker =
              bookmaker.name;
          }
        }

        /* -------------------------
           OVER / UNDER
        ------------------------- */

        if (
          marketName.includes("over/under") ||
          marketName.includes("goals over/under")
        ) {
          for (const value of market.values || []) {
            const label = String(
              value.value || ""
            );

            const odd = Number(value.odd);

            if (!Number.isFinite(odd)) continue;

            if (label === "Over 1.5") {
              result["Over 1.5"] = odd;
            }

            if (label === "Under 1.5") {
              result["Under 1.5"] = odd;
            }

            if (label === "Over 2.5") {
              result["Over 2.5"] = odd;
            }

            if (label === "Under 2.5") {
              result["Under 2.5"] = odd;
            }
          }
        }
      }

      if (
        result["1"] &&
        result.X &&
        result["2"]
      ) {
        break;
      }
    }

    return result;
  } catch {
    return {
      "1": null,
      X: null,
      "2": null,
      "Over 1.5": null,
      "Under 1.5": null,
      "Over 2.5": null,
      "Under 2.5": null,
      bookmaker: null,
    };
  }
}

/* =========================================================
   MOCK FALLBACK
   ========================================================= */

function mockMatches() {
  return [
    {
      id: 1001,
      league: "Premier League",
      country: "England",
      home: "Arsenal",
      away: "Manchester City",
      time: "15:00",
      live: false,
      score: "vs",
      minute: "",
      status: "NS",
      homeLogo: "",
      awayLogo: "",

      odds: {
        "1": 2.4,
        X: 3.7,
        "2": 2.2,
      },

      markets: {
        "1X2": {
          "1": 2.4,
          X: 3.7,
          "2": 2.2,
        },

        "Over/Under": {
          "Over 1.5": 1.25,
          "Under 1.5": 3.8,
          "Over 2.5": 1.85,
          "Under 2.5": 1.9,
        },

        "Double Chance": {
          "1X": 1.35,
          "12": 1.22,
          "X2": 1.45,
        },

        "1st Half O/U": {
          "Over 0.5 HT": 1.4,
          "Under 0.5 HT": 2.7,
        },

        Handicap: {
          "Home -1": 2.1,
          "Away +1": 1.7,
        },

        "Next Goal": {
          Home: 1.5,
          "No Goal": 8,
          Away: 4.5,
        },
      },

      oddsSource: "Mock",
    },

    {
      id: 1002,
      league: "LaLiga",
      country: "Spain",
      home: "Real Madrid",
      away: "Barcelona",
      time: "18:00",
      live: false,
      score: "vs",
      minute: "",
      status: "NS",
      homeLogo: "",
      awayLogo: "",

      odds: {
        "1": 2.1,
        X: 3.5,
        "2": 3.1,
      },

      markets: {
        "1X2": {
          "1": 2.1,
          X: 3.5,
          "2": 3.1,
        },

        "Over/Under": {
          "Over 1.5": 1.18,
          "Under 1.5": 4.4,
          "Over 2.5": 1.55,
          "Under 2.5": 2.3,
        },

        "Double Chance": {
          "1X": 1.32,
          "12": 1.2,
          "X2": 1.48,
        },

        "1st Half O/U": {
          "Over 0.5 HT": 1.38,
          "Under 0.5 HT": 2.75,
        },

        Handicap: {
          "Home -1": 2.3,
          "Away +1": 1.65,
        },

        "Next Goal": {
          Home: 1.7,
          "No Goal": 7,
          Away: 2.8,
        },
      },

      oddsSource: "Mock",
    },

    {
      id: 1003,
      league: "Ghana Premier League",
      country: "Ghana",
      home: "Hearts of Oak",
      away: "Asante Kotoko",
      time: "16:00",
      live: false,
      score: "vs",
      minute: "",
      status: "NS",
      homeLogo: "",
      awayLogo: "",

      odds: {
        "1": 2.0,
        X: 3.1,
        "2": 3.0,
      },

      markets: {
        "1X2": {
          "1": 2.0,
          X: 3.1,
          "2": 3.0,
        },

        "Over/Under": {
          "Over 1.5": 1.4,
          "Under 1.5": 2.7,
          "Over 2.5": 2.0,
          "Under 2.5": 1.75,
        },

        "Double Chance": {
          "1X": 1.3,
          "12": 1.3,
          "X2": 1.55,
        },

        "1st Half O/U": {
          "Over 0.5 HT": 1.5,
          "Under 0.5 HT": 2.4,
        },

        Handicap: {
          "Home -1": 3.2,
          "Away +1": 1.35,
        },

        "Next Goal": {
          Home: 1.8,
          "No Goal": 6,
          Away: 3.5,
        },
      },

      oddsSource: "Mock",
    },
  ];
}

/* =========================================================
   LOAD MATCHES + ODDS
   ========================================================= */

async function fetchMatchesFromAPI() {
  try {
    const fixtures = await fetchFixtures();

    /*
      Avoid hammering the odds endpoint for every fixture.
      The first 30 fixtures are loaded with odds.
    */

    const targets = fixtures.slice(0, 30);

    const oddsResults = await Promise.all(
      targets.map(async (match) => ({
        id: match.id,
        odds: await fetchFixtureOdds(match.id),
      }))
    );

    const oddsMap = new Map(
      oddsResults.map((item) => [
        item.id,
        item.odds,
      ])
    );

    return fixtures.map((match) => {
      const odds =
        oddsMap.get(match.id) || {};

      return {
        ...match,

        odds: {
          "1": odds["1"] ?? null,
          X: odds.X ?? null,
          "2": odds["2"] ?? null,
        },

        oddsSource:
          odds.bookmaker || null,

        markets: {
          "1X2": {
            "1": odds["1"] ?? null,
            X: odds.X ?? null,
            "2": odds["2"] ?? null,
          },

          "Over/Under": {
            "Over 1.5":
              odds["Over 1.5"] ?? null,

            "Under 1.5":
              odds["Under 1.5"] ?? null,

            "Over 2.5":
              odds["Over 2.5"] ?? null,

            "Under 2.5":
              odds["Under 2.5"] ?? null,
          },

          /*
            These markets are only populated when
            corresponding API-Football bookmaker data
            is available. They are NOT fabricated.
          */

          "Double Chance": {},
          "1st Half O/U": {},
          Handicap: {},
          "Next Goal": {},
        },
      };
    });
  } catch (error) {
    if (error.message === "NO_KEY") {
      return mockMatches();
    }

    throw error;
  }
}

/* =========================================================
   UI COMPONENTS
   ========================================================= */

function TeamLogo({ src }) {
  if (!src) {
    return (
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "#333",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          flexShrink: 0,
        }}
      >
        ⚽
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      style={{
        width: 30,
        height: 30,
        objectFit: "contain",
        flexShrink: 0,
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
  const available =
    odd !== null &&
    odd !== undefined &&
    Number(odd) > 0;

  return (
    <button
      onClick={onClick}
      disabled={!available}
      style={{
        background: selected
          ? "#e00000"
          : available
          ? "#383838"
          : "#242424",

        color: selected
          ? "#fff"
          : available
          ? "#ffeb3b"
          : "#666",

        border: selected
          ? "1px solid #ff3333"
          : "1px solid #444",

        borderRadius: 5,
        minHeight: 45,
        fontWeight: "bold",
        fontSize: 12,
        cursor: available
          ? "pointer"
          : "not-allowed",
      }}
    >
      <div>{label}</div>

      <div style={{ marginTop: 3 }}>
        {available
          ? Number(odd).toFixed(2)
          : "—"}
      </div>
    </button>
  );
}

/* =========================================================
   APP
   ========================================================= */

export default function App() {
  const [matches, setMatches] = useState([]);
  const [selected, setSelected] =
    useState(null);

  const [mtab, setMtab] =
    useState("1X2");

  const [bets, setBets] = useState([]);

  const [tickets, setTickets] =
    useState(() => {
      try {
        return JSON.parse(
          localStorage.getItem(
            "betx_tickets"
          ) || "[]"
        );
      } catch {
        return [];
      }
    });

  const [paperStake, setPaperStake] =
    useState(0.2);

  const [betType, setBetType] =
    useState("Multiple");

  const [tab, setTab] =
    useState("home");

  const [filter, setFilter] =
    useState("all");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState(null);

  const [refreshing, setRefreshing] =
    useState(false);

  const [viewTicket, setViewTicket] =
    useState(null);

  const [user, setUser] =
    useState(() => {
      try {
        return JSON.parse(
          localStorage.getItem(
            "betx_user"
          ) ||
            `{
              "name":"popki",
              "bal":0.95,
              "phone":"0504877566"
            }`
        );
      } catch {
        return {
          name: "popki",
          bal: 0.95,
          phone: "0504877566",
        };
      }
    });

  /* =======================================================
     LOAD DATA
     ======================================================= */

  const loadMatches = async () => {
    try {
      setError("");

      const data =
        await fetchMatchesFromAPI();

      setMatches(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to load API-Football data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMatches();

    const interval = setInterval(
      loadMatches,
      CONFIG.REFRESH_MS
    );

    return () =>
      clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "betx_tickets",
      JSON.stringify(tickets)
    );
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem(
      "betx_user",
      JSON.stringify(user)
    );
  }, [user]);

  /* =======================================================
     BET CALCULATIONS
     ======================================================= */

  const totalOdds = useMemo(() => {
    if (!bets.length) return 0;

    return bets.reduce(
      (total, bet) =>
        total * Number(bet.odd),
      1
    );
  }, [bets]);

  const possibleWin =
    totalOdds > 0 && paperStake > 0
      ? totalOdds * Number(paperStake)
      : 0;

  /* =======================================================
     FILTER
     ======================================================= */

  const filteredMatches = useMemo(() => {
    let list = [...matches];

    if (filter === "live") {
      list = list.filter(
        (match) => match.live
      );
    }

    if (filter === "upcoming") {
      list = list.filter(
        (match) => !match.live
      );
    }

    if (search.trim()) {
      const query =
        search.toLowerCase();

      list = list.filter(
        (match) =>
          match.home
            .toLowerCase()
            .includes(query) ||
          match.away
            .toLowerCase()
            .includes(query) ||
          match.league
            .toLowerCase()
            .includes(query)
      );
    }

    return list;
  }, [
    matches,
    filter,
    search,
  ]);

  /* =======================================================
     ADD / REMOVE PICK
     ======================================================= */

  const addBet = (
    match,
    type,
    odd
  ) => {
    if (
      odd === null ||
      odd === undefined ||
      Number(odd) <= 0
    ) {
      return;
    }

    const id =
      `${match.id}-${type}`;

    setBets((current) => {
      if (
        current.some(
          (bet) => bet.id === id
        )
      ) {
        return current.filter(
          (bet) => bet.id !== id
        );
      }

      /*
        Only one selection per match.
      */

      const withoutSameMatch =
        current.filter(
          (bet) =>
            bet.matchId !==
            match.id
        );

      return [
        ...withoutSameMatch,
        {
          id,
          matchId: match.id,
          game:
            `${match.home} vs ${match.away}`,
          league: match.league,
          type,
          odd: Number(odd),
        },
      ];
    });
  };

  /* =======================================================
     CREATE LOCAL TICKET
     ======================================================= */

  const placeTicket = () => {
    if (!bets.length) {
      alert(
        "Add at least one selection."
      );
      return;
    }

    const stake =
      Number(paperStake);

    if (
      !stake ||
      stake <= 0
    ) {
      alert(
        "Enter a valid stake."
      );
      return;
    }

    if (
      stake > Number(user.bal)
    ) {
      alert(
        `Insufficient demo balance: GH₵ ${Number(
          user.bal
        ).toFixed(2)}`
      );
      return;
    }

    const ticket = {
      id:
        "BX" +
        Date.now()
          .toString()
          .slice(-8),

      createdAt:
        new Date().toISOString(),

      stake,

      odds:
        Number(
          totalOdds.toFixed(2)
        ),

      possibleWin:
        Number(
          possibleWin.toFixed(2)
        ),

      status: "Open",

      betType,

      picks: [...bets],
    };

    setTickets((current) => [
      ticket,
      ...current,
    ]);

    setUser((current) => ({
      ...current,
      bal: Number(
        (
          Number(current.bal) -
          stake
        ).toFixed(2)
      ),
    }));

    setBets([]);
    setSelected(null);
    setTab("open");

    /*
      Sends a ticket summary to your WhatsApp
      number. This does not process payment.
    */

    const message =
      `BETX GHANA TICKET\n\n` +
      `Ticket: ${ticket.id}\n` +
      `Stake: GHS ${ticket.stake}\n` +
      `Odds: ${ticket.odds}\n` +
      `Potential Win: GHS ${ticket.possibleWin}\n\n` +
      ticket.picks
        .map(
          (pick) =>
            `${pick.game} | ${pick.type} @ ${pick.odd}`
        )
        .join("\n");

    window.open(
      `https://wa.me/${CONFIG.WHATSAPP}?text=${encodeURIComponent(
        message
      )}`,
      "_blank"
    );
  };

  /* =======================================================
     REMIX TICKET
     ======================================================= */

  const remixTicket = (ticket) => {
    setBets(
      ticket.picks.map(
        (pick) => ({
          ...pick,
        })
      )
    );

    setPaperStake(
      ticket.stake
    );

    setBetType(
      ticket.betType ||
        "Multiple"
    );

    setViewTicket(null);
    setTab("home");
  };

  /* =======================================================
     TICKET DETAIL
     ======================================================= */

  if (viewTicket) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#fff",
          color: "#000",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            background: "#e00000",
            color: "#fff",
            padding: 13,
            display: "flex",
            justifyContent:
              "space-between",
          }}
        >
          <button
            onClick={() =>
              setViewTicket(null)
            }
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 15,
            }}
          >
            ← Back
          </button>

          <strong>
            Ticket Details
          </strong>

          <span />
        </div>

        <div
          style={{
            padding: 15,
          }}
        >
          <div
            style={{
              background: "#f5f5f5",
              padding: 14,
              borderRadius: 8,
            }}
          >
            <div>
              Ticket:{" "}
              <strong>
                {viewTicket.id}
              </strong>
            </div>

            <div>
              Type:{" "}
              {viewTicket.betType ||
                "Multiple"}
            </div>

            <div>
              Total Stake:{" "}
              <strong>
                GHS{" "}
                {Number(
                  viewTicket.stake
                ).toFixed(2)}
              </strong>
            </div>

            <div>
              Total Odds:{" "}
              <strong>
                {viewTicket.odds}
              </strong>
            </div>

            <div>
              Potential Win:{" "}
              <strong>
                GHS{" "}
                {Number(
                  viewTicket.possibleWin
                ).toFixed(2)}
              </strong>
            </div>
          </div>

          <h3>
            Selections
          </h3>

          {viewTicket.picks.map(
            (pick, index) => (
              <div
                key={index}
                style={{
                  padding: 11,
                  borderBottom:
                    "1px solid #eee",
                }}
              >
                <strong>
                  {pick.game}
                </strong>

                <div
                  style={{
                    fontSize: 12,
                    marginTop: 5,
                    color: "#555",
                  }}
                >
                  {pick.league}
                </div>

                <div
                  style={{
                    marginTop: 5,
                  }}
                >
                  {pick.type} @{" "}
                  <strong>
                    {pick.odd}
                  </strong>
                </div>

                <div
                  style={{
                    marginTop: 5,
                    fontSize: 11,
                    color: "#888",
                  }}
                >
                  Result: Pending
                </div>
              </div>
            )
          )}

          <button
            onClick={() =>
              remixTicket(viewTicket)
            }
            style={{
              width: "100%",
              marginTop: 15,
              background: "#e00000",
              color: "#fff",
              padding: 12,
              border: "none",
              borderRadius: 6,
              fontWeight: "bold",
            }}
          >
            Remix Bet
          </button>

          <button
            onClick={() => {
              setTickets(
                (current) =>
                  current.filter(
                    (ticket) =>
                      ticket.id !==
                      viewTicket.id
                  )
              );

              setViewTicket(null);
            }}
            style={{
              width: "100%",
              marginTop: 8,
              background: "#000",
              color: "#fff",
              padding: 12,
              border: "none",
              borderRadius: 6,
            }}
          >
            Delete Ticket
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     MATCH DETAIL
     ======================================================= */

  if (selected) {
    const availableMarkets =
      Object.keys(
        selected.markets || {}
      ).filter(
        (market) =>
          Object.keys(
            selected.markets?.[
              market
            ] || {}
          ).length > 0
      );

    if (
      !availableMarkets.includes(
        "1X2"
      )
    ) {
      availableMarkets.unshift(
        "1X2"
      );
    }

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0c0c0c",
          color: "#fff",
          paddingBottom:
            bets.length ? 155 : 25,
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            background: "#e00000",
            padding: 13,
            display: "flex",
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
            }}
          >
            ← Back
          </button>

          <strong
            style={{
              fontSize: 13,
            }}
          >
            {selected.home} vs{" "}
            {selected.away}
          </strong>

          <span
            style={{
              width: 45,
            }}
          />
        </div>

        <div
          style={{
            padding: 15,
            textAlign: "center",
            background: "#191919",
          }}
        >
          <div
            style={{
              color: "#999",
              fontSize: 11,
            }}
          >
            {selected.league}
            {selected.country
              ? ` • ${selected.country}`
              : ""}
          </div>

          <div
            style={{
              marginTop: 10,
              fontSize: 18,
              fontWeight: "bold",
            }}
          >
            {selected.home} vs{" "}
            {selected.away}
          </div>

          <div
            style={{
              marginTop: 7,
              color: selected.live
                ? "#00e676"
                : "#aaa",
              fontSize: 12,
            }}
          >
            {selected.live
              ? `● LIVE ${selected.minute} ${selected.score}`
              : `${selected.time} • ${selected.statusLong || "Upcoming"}`}
          </div>

          {selected.oddsSource && (
            <div
              style={{
                marginTop: 8,
                color: "#777",
                fontSize: 9,
              }}
            >
              Odds:{" "}
              {selected.oddsSource}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            overflowX: "auto",
            background: "#000",
            borderBottom:
              "1px solid #222",
            fontSize: 11,
          }}
        >
          {availableMarkets.map(
            (market) => (
              <button
                key={market}
                onClick={() =>
                  setMtab(market)
                }
                style={{
                  padding:
                    "12px 14px",
                  whiteSpace:
                    "nowrap",
                  color:
                    mtab === market
                      ? "#fff"
                      : "#888",
                  border: "none",
                  borderBottom:
                    mtab === market
                      ? "2px solid #e00000"
                      : "2px solid transparent",
                  background:
                    "transparent",
                }}
              >
                {market}
              </button>
            )
          )}
        </div>

        <div
          style={{
            padding: 12,
          }}
        >
          {Object.keys(
            selected.markets?.[
              mtab
            ] || {}
          ).length === 0 ? (
            <div
              style={{
                padding: 35,
                textAlign: "center",
                color: "#666",
                background: "#171717",
                borderRadius: 8,
              }}
            >
              This market is not
              available from the
              current API-Football
              bookmaker feed.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: 7,
              }}
            >
              {Object.entries(
                selected.markets[
                  mtab
                ] || {}
              ).map(
                ([label, odd]) => {
                  const id =
                    `${selected.id}-${label}`;

                  const picked =
                    bets.some(
                      (bet) =>
                        bet.id === id
                    );

                  return (
                    <OddsButton
                      key={label}
                      label={label}
                      odd={odd}
                      selected={picked}
                      onClick={() =>
                        addBet(
                          selected,
                          label,
                          odd
                        )
                      }
                    />
                  );
                }
              )}
            </div>
          )}
        </div>

        {bets.length > 0 && (
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              background: "#181818",
              borderTop:
                "2px solid #e00000",
              padding: 12,
              zIndex: 70,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                fontSize: 11,
              }}
            >
              <strong>
                BET SLIP ({bets.length})
              </strong>

              <button
                onClick={() =>
                  setBets([])
                }
                style={{
                  background: "none",
                  border: "none",
                  color: "#ff5555",
                }}
              >
                Clear
              </button>
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
                min="0"
                step="0.01"
                value={paperStake}
                onChange={(e) =>
                  setPaperStake(
                    Number(
                      e.target.value
                    )
                  )
                }
                style={{
                  background:
                    "#050505",
                  color: "#fff",
                  border:
                    "1px solid #444",
                  borderRadius: 5,
                  padding: 9,
                }}
              />

              <div
                style={{
                  background:
                    "#242424",
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
                    color:
                      "#ffeb3b",
                  }}
                >
                  {totalOdds.toFixed(
                    2
                  )}
                </strong>
              </div>

              <button
                onClick={
                  placeTicket
                }
                style={{
                  background:
                    "#e00000",
                  color: "#fff",
                  border: "none",
                  borderRadius: 5,
                  fontWeight:
                    "bold",
                }}
              >
                Place Bet
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
              Potential Win: GH₵{" "}
              {possibleWin.toFixed(
                2
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* =======================================================
     MAIN APP
     ======================================================= */

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0c0c0c",
        color: "#fff",
        fontFamily: "Arial",
        paddingBottom:
          bets.length ? 155 : 65,
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
          justifyContent:
            "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
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
            GHANA • FOOTBALL
            CENTRE
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <button
            onClick={() => {
              setRefreshing(true);
              loadMatches();
            }}
            style={{
              background:
                "rgba(0,0,0,.22)",
              border:
                "1px solid rgba(255,255,255,.2)",
              color: "#fff",
              borderRadius: 20,
              padding: "7px 11px",
              fontSize: 11,
            }}
          >
            {refreshing
              ? "↻"
              : "⟳"}{" "}
            Refresh
          </button>

          <div
            style={{
              background:
                "rgba(0,0,0,.3)",
              padding:
                "7px 11px",
              borderRadius: 20,
              fontSize: 11,
            }}
          >
            GH₵{" "}
            {Number(
              user.bal
            ).toFixed(2)}
          </div>
        </div>
      </header>

      {/* CONNECTION STATUS */}

      <div
        style={{
          background: "#171717",
          borderBottom:
            "1px solid #252525",
          padding: "8px 12px",
          fontSize: 10,
        }}
      >
        <span
          style={{
            color: error
              ? "#ff6b6b"
              : "#62e36b",
          }}
        >
          {error
            ? `● ${error}`
            : CONFIG.API_KEY ===
              "YOUR_API_FOOTBALL_KEY"
            ? "● Mock fallback — add API key for live API-Football data"
            : "● API-Football connected"}
        </span>

        {lastUpdated &&
          !error && (
            <span
              style={{
                color: "#888",
                marginLeft: 10,
              }}
            >
              Updated{" "}
              {lastUpdated.toLocaleTimeString()}
              {" • "}
              Live{" "}
              {
                matches.filter(
                  (m) => m.live
                ).length
              }
            </span>
          )}
      </div>

      {/* HOME */}

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
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search team or league..."
              style={{
                width: "100%",
                boxSizing:
                  "border-box",
                background:
                  "#242424",
                border:
                  "1px solid #363636",
                color: "#fff",
                borderRadius: 7,
                padding:
                  "11px 13px",
                outline: "none",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: 7,
              overflowX: "auto",
              padding:
                "3px 10px 10px",
              background:
                "#121212",
            }}
          >
            {[
              ["all", "All"],
              ["live", "🔴 Live"],
              [
                "upcoming",
                "Upcoming",
              ],
            ].map(
              ([value, label]) => (
                <button
                  key={value}
                  onClick={() =>
                    setFilter(value)
                  }
                  style={{
                    whiteSpace:
                      "nowrap",
                    background:
                      filter === value
                        ? "#e00000"
                        : "#292929",
                    border: "none",
                    color: "#fff",
                    padding:
                      "8px 13px",
                    borderRadius: 18,
                    fontSize: 11,
                    fontWeight:
                      "bold",
                  }}
                >
                  {label}
                </button>
              )
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 50px 50px 50px",
              background: "#000",
              padding:
                "6px 10px",
              fontSize: 10,
              color: "#777",
              textAlign: "center",
            }}
          >
            <div
              style={{
                textAlign: "left",
              }}
            >
              Football • Tap match
              for details
            </div>

            <div>1</div>
            <div>X</div>
            <div>2</div>
          </div>
        </>
      )}

      {/* MATCH LIST */}

      {tab === "home" &&
        (loading ? (
          <div
            style={{
              padding: 60,
              textAlign: "center",
              color: "#777",
            }}
          >
            ⚽ Loading
            API-Football data...
          </div>
        ) : filteredMatches.length ===
          0 ? (
          <div
            style={{
              padding: 70,
              textAlign: "center",
              color: "#666",
            }}
          >
            No matches found.
          </div>
        ) : (
          filteredMatches.map(
            (match) => (
              <div
                key={match.id}
                style={{
                  background:
                    "#202020",
                  marginBottom: 5,
                  borderBottom:
                    "1px solid #101010",
                }}
              >
                {/* LEAGUE BAR */}

                <div
                  onClick={() => {
                    setSelected(
                      match
                    );
                    setMtab("1X2");
                  }}
                  style={{
                    padding:
                      "8px 11px",
                    display: "flex",
                    justifyContent:
                      "space-between",
                    cursor: "pointer",
                    background:
                      "#292929",
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
                      {match.time}
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign:
                        "right",
                    }}
                  >
                    {match.live ? (
                      <>
                        <div
                          style={{
                            color:
                              "#00e676",
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
                          {match.score}{" "}
                          {
                            match.minute
                          }
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
                        {match.time} ›
                      </div>
                    )}
                  </div>
                </div>

                {/* TEAMS */}

                <div
                  onClick={() => {
                    setSelected(
                      match
                    );
                    setMtab("1X2");
                  }}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 40px 1fr",
                    alignItems:
                      "center",
                    padding:
                      "11px 10px 7px",
                    cursor:
                      "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      gap: 7,
                    }}
                  >
                    <TeamLogo
                      src={
                        match.homeLogo
                      }
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
                      textAlign:
                        "center",
                      color: "#777",
                      fontSize: 10,
                    }}
                  >
                    VS
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "flex-end",
                      gap: 7,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        textAlign:
                          "right",
                      }}
                    >
                      {match.away}
                    </span>

                    <TeamLogo
                      src={
                        match.awayLogo
                      }
                    />
                  </div>
                </div>

                {/* 1X2 */}

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
                    [
                      "1",
                      match.markets
                        ?.["1X2"]
                        ?.["1"],
                    ],
                    [
                      "X",
                      match.markets
                        ?.["1X2"]
                        ?.X,
                    ],
                    [
                      "2",
                      match.markets
                        ?.["1X2"]
                        ?.["2"],
                    ],
                  ].map(
                    ([type, odd]) => {
                      const selectedBet =
                        bets.some(
                          (bet) =>
                            bet.id ===
                            `${match.id}-${type}`
                        );

                      return (
                        <OddsButton
                          key={type}
                          label={type}
                          odd={odd}
                          selected={
                            selectedBet
                          }
                          onClick={() =>
                            addBet(
                              match,
                              type,
                              odd
                            )
                          }
                        />
                      );
                    }
                  )}
                </div>
              </div>
            )
          )
        ))}

      {/* A-Z */}

      {tab === "az" && (
        <div
          style={{
            background: "#fff",
            color: "#000",
            minHeight: "70vh",
            padding: 10,
          }}
        >
          <div
            style={{
              background: "#e00000",
              padding: 8,
              borderRadius: 20,
              display: "flex",
            }}
          >
            <input
              placeholder="Teams, Players, Leagues, ID"
              style={{
                flex: 1,
                border: "none",
                background:
                  "transparent",
                color: "#fff",
                outline: "none",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 10,
            }}
          >
            <div
              style={{
                width: 120,
                background:
                  "#f5f5f5",
              }}
            >
              {[
                "Football",
                "vFootball",
                "Basketball",
                "Tennis",
              ].map(
                (item) => (
                  <div
                    key={item}
                    style={{
                      padding: 12,
                      borderLeft:
                        item ===
                        "Football"
                          ? "3px solid #e00000"
                          : "",
                      background:
                        item ===
                        "Football"
                          ? "#fff"
                          : "",
                    }}
                  >
                    {item}
                  </div>
                )
              )}
            </div>

            <div
              style={{
                flex: 1,
                padding: 10,
                fontSize: 13,
              }}
            >
              {CONFIG.LEAGUES.map(
                (league) => (
                  <div
                    key={league.id}
                    onClick={() => {
                      setTab(
                        "home"
                      );
                      setSearch(
                        league.name
                      );
                    }}
                    style={{
                      padding:
                        "10px 0",
                      borderBottom:
                        "1px solid #eee",
                      cursor:
                        "pointer",
                    }}
                  >
                    {league.name} ›
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* OPEN BETS */}

      {tab === "open" && (
        <div
          style={{
            padding: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              background: "#fff",
              borderRadius: 20,
              padding: 3,
              fontSize: 12,
            }}
          >
            <div
              style={{
                flex: 1,
                background: "#000",
                color: "#fff",
                padding: 8,
                borderRadius: 20,
                textAlign: "center",
              }}
            >
              Open Bets (
              {
                tickets.filter(
                  (ticket) =>
                    ticket.status ===
                    "Open"
                ).length
              }
              )
            </div>

            <div
              style={{
                flex: 1,
                padding: 8,
                textAlign: "center",
                color: "#888",
              }}
            >
              Bet History
            </div>
          </div>

          {tickets.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: "#666",
                padding: 60,
              }}
            >
              No open bets.
            </div>
          ) : (
            tickets.map(
              (ticket) => (
                <div
                  key={ticket.id}
                  onClick={() =>
                    setViewTicket(
                      ticket
                    )
                  }
                  style={{
                    background:
                      "#202020",
                    border:
                      "1px solid #303030",
                    borderRadius: 9,
                    padding: 12,
                    marginTop: 10,
                    cursor:
                      "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      fontSize: 11,
                    }}
                  >
                    <span>
                      {ticket.id} •{" "}
                      {new Date(
                        ticket.createdAt
                      ).toLocaleTimeString()}
                    </span>

                    <span
                      style={{
                        background:
                          "#754d00",
                        color:
                          "#ffd76a",
                        borderRadius:
                          15,
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
                      fontSize: 11,
                      marginTop: 8,
                    }}
                  >
                    {ticket.picks[0]
                      ?.game}{" "}
                    {ticket.picks
                      .length > 1
                      ? `+ ${
                          ticket.picks
                            .length -
                          1
                        } more`
                      : ""}
                    {" • Details ›"}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      marginTop: 8,
                      fontSize: 11,
                    }}
                  >
                    <span>
                      Stake GHS{" "}
                      {ticket.stake}
                    </span>

                    <strong
                      style={{
                        color:
                          "#ffeb3b",
                      }}
                    >
                      Win GHS{" "}
                      {
                        ticket.possibleWin
                      }
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      marginTop: 8,
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        remixTicket(
                          ticket
                        );
                      }}
                      style={{
                        background:
                          "#e00000",
                        color: "#fff",
                        border: "none",
                        padding:
                          "7px 12px",
                        borderRadius: 4,
                        fontSize: 10,
                      }}
                    >
                      Remix Bet
                    </button>

                    <button
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                      style={{
                        background:
                          "#222",
                        color: "#777",
                        border: "none",
                        padding:
                          "7px 12px",
                        borderRadius: 4,
                        fontSize: 10,
                      }}
                    >
                      Cashout
                    </button>
                  </div>
                </div>
              )
            )
          )}
        </div>
      )}

      {/* ME */}

      {tab === "me" && (
        <div
          style={{
            padding: 15,
          }}
        >
          <div
            style={{
              background: "#222",
              padding: 20,
              borderRadius: 12,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 55,
                height: 55,
                background: "#e00000",
                borderRadius: "50%",
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "center",
                fontWeight: "bold",
                fontSize: 20,
              }}
            >
              {String(
                user.name || "P"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div
              style={{
                marginTop: 10,
              }}
            >
              {user.name}
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#888",
                marginTop: 3,
              }}
            >
              {user.phone}
            </div>

            <div
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: "#ffeb3b",
                marginTop: 12,
              }}
            >
              GH₵{" "}
              {Number(
                user.bal
              ).toFixed(2)}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: 10,
                marginTop: 15,
              }}
            >
              <a
                href={`https://wa.me/${CONFIG.WHATSAPP}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background:
                    "#00c853",
                  color: "#fff",
                  padding: 12,
                  borderRadius: 6,
                  textDecoration:
                    "none",
                  textAlign:
                    "center",
                  fontSize: 12,
                }}
              >
                Contact
              </a>

              <button
                onClick={() =>
                  setTab("open")
                }
                style={{
                  background:
                    "#333",
                  color: "#fff",
                  padding: 12,
                  borderRadius: 6,
                  border: "none",
                  fontSize: 12,
                }}
              >
                My Bets
              </button>
            </div>

            <div
              style={{
                marginTop: 15,
                fontSize: 10,
                color: "#888",
                lineHeight: 1.6,
              }}
            >
              BetX Ghana •
              API-Football powered
              football centre
              <br />
              WhatsApp:
              {CONFIG.WHATSAPP}
            </div>
          </div>
        </div>
      )}

      {/* BET SLIP */}

      {bets.length > 0 && (
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
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              fontSize: 11,
            }}
          >
            <strong>
              BET SLIP ({bets.length})
            </strong>

            <button
              onClick={() =>
                setBets([])
              }
              style={{
                background: "none",
                border: "none",
                color: "#ff5555",
              }}
            >
              Clear
            </button>
          </div>

          {/* BET TYPE */}

          <div
            style={{
              display: "flex",
              gap: 5,
              marginTop: 8,
            }}
          >
            {[
              "Single",
              "Multiple",
              "System",
            ].map((type) => (
              <button
                key={type}
                onClick={() =>
                  setBetType(type)
                }
                style={{
                  flex: 1,
                  background:
                    betType === type
                      ? "#e00000"
                      : "#292929",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: 7,
                  fontSize: 10,
                }}
              >
                {type}
              </button>
            ))}
          </div>

          {/* STAKE */}

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
              min="0"
              step="0.01"
              value={paperStake}
              onChange={(e) =>
                setPaperStake(
                  Number(
                    e.target.value
                  )
                )
              }
              style={{
                background:
                  "#050505",
                color: "#fff",
                border:
                  "1px solid #444",
                borderRadius: 5,
                padding: 9,
              }}
            />

            <div
              style={{
                background:
                  "#242424",
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
                  color:
                    "#ffeb3b",
                }}
              >
                {totalOdds.toFixed(
                  2
                )}
              </strong>
            </div>

            <button
              onClick={
                placeTicket
              }
              style={{
                background:
                  "#e00000",
                color: "#fff",
                border: "none",
                borderRadius: 5,
                fontWeight: "bold",
              }}
            >
              Place Bet
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
            Potential Win: GH₵{" "}
            {possibleWin.toFixed(2)}
          </div>
        </div>
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
            "repeat(4,1fr)",
          zIndex: 60,
        }}
      >
        <button
          onClick={() =>
            setTab("home")
          }
          style={{
            border: "none",
            background:
              "transparent",
            color:
              tab === "home"
                ? "#e00000"
                : "#777",
            fontSize: 10,
          }}
        >
          <div
            style={{
              fontSize: 18,
            }}
          >
            ⚽
          </div>
          Home
        </button>

        <button
          onClick={() =>
            setTab("az")
          }
          style={{
            border: "none",
            background:
              "transparent",
            color:
              tab === "az"
                ? "#e00000"
                : "#777",
            fontSize: 10,
          }}
        >
          <div
            style={{
              fontSize: 18,
            }}
          >
            📊
          </div>
          A-Z
        </button>

        <button
          onClick={() =>
            setTab("open")
          }
          style={{
            border: "none",
            background:
              "transparent",
            color:
              tab === "open"
                ? "#e00000"
                : "#777",
            fontSize: 10,
          }}
        >
          <div
            style={{
              fontSize: 18,
            }}
          >
            🧾
          </div>

          Open Bets{" "}
          {tickets.filter(
            (ticket) =>
              ticket.status ===
              "Open"
          ).length > 0 && (
            <span
              style={{
                background:
                  "#e00000",
                color: "#fff",
                padding:
                  "1px 4px",
                borderRadius: 10,
                fontSize: 8,
              }}
            >
              {
                tickets.filter(
                  (ticket) =>
                    ticket.status ===
                    "Open"
                ).length
              }
            </span>
          )}
        </button>

        <button
          onClick={() =>
            setTab("me")
          }
          style={{
            border: "none",
            background:
              "transparent",
            color:
              tab === "me"
                ? "#e00000"
                : "#777",
            fontSize: 10,
          }}
        >
          <div
            style={{
              fontSize: 18,
            }}
          >
            👤
          </div>
          Me
        </button>
      </nav>
    </div>
  );
}
