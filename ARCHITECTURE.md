# Architecture Diagrams — Cog & Cosmos

This document contains visual Mermaid diagrams detailing the architecture, cross-stage interdependencies, prestige hierarchies, and data pipelines of the **Cog & Cosmos** Fortune Engine.

---

## 1. The Compounding Stage Synergy Loop

Each of the eight stages feeds into the next, forming a highly compounding network where bottlenecks in earlier stages directly starve later stages, and buffs from later stages duplicate or speed up earlier production.

```mermaid
graph TD
    %% Stages
    subgraph S1 [Stage 1]
        V[🏡 Village]
    end
    subgraph S2 [Stage 2]
        F[🌾 Farm]
    end
    subgraph S3 [Stage 3]
        M[⛏️ Mine]
    end
    subgraph S4 [Stage 4]
        Fac[🏭 Factory]
    end
    subgraph S5 [Stage 5]
        Mag[🔮 Magic]
    end
    subgraph S6 [Stage 6]
        Sp[🚀 Space]
    end
    subgraph S7 [Stage 7]
        Ti[⏳ Time]
    end
    subgraph S8 [Stage 8]
        Mv[🌌 Multiverse]
    end

    %% Synergy lines
    V -->|Labor /s| F
    V -->|Labor /s| M
    F -->|Grain| M
    F -->|Grain| Fac
    F -->|Grain Familiar Upkeep| Mag
    M -->|Ore Smelting| Sp
    Fac -->|Power Smelting| Sp
    Mag -->|Enchants 3x-12x| V
    Mag -->|Enchants 3x-12x| F
    Mag -->|Enchants 3x-12x| M
    Mag -->|Enchants 3x-12x| Fac
    Sp -->|Alloy Rift Upkeep| Mv
    Ti -->|Warp Ticks 60s-900s| V
    Ti -->|Warp Ticks 60s-900s| F
    Ti -->|Warp Ticks 60s-900s| M
    Ti -->|Warp Ticks 60s-900s| Fac
    Ti -->|Paradox Mirror Feed| Mv
    Mv -->|Branch Duplication| V
    Mv -->|Branch Duplication| F
    Mv -->|Branch Duplication| M
    Mv -->|Branch Duplication| Fac

    %% Global Engine
    FE[★ Fortune Engine]
    V -.->|Stage Surplus| FE
    F -.->|Stage Surplus| FE
    M -.->|Stage Surplus| FE
    Fac -.->|Stage Surplus| FE
    Mag -.->|Stage Surplus| FE
    Sp -.->|Stage Surplus| FE
    Ti -.->|Stage Surplus| FE
    Mv -.->|Stage Surplus| FE

    style V fill:#2b3e24,stroke:#7fae6b,stroke-width:2px,color:#7fae6b
    style F fill:#42371b,stroke:#e0b84a,stroke-width:2px,color:#e0b84a
    style M fill:#2e2340,stroke:#9b7fd4,stroke-width:2px,color:#9b7fd4
    style Fac fill:#3d2719,stroke:#c87f4a,stroke-width:2px,color:#c87f4a
    style Mag fill:#381d42,stroke:#b463d6,stroke-width:2px,color:#b463d6
    style Sp fill:#13373d,stroke:#4ec0d4,stroke-width:2px,color:#4ec0d4
    style Ti fill:#423118,stroke:#e6a93f,stroke-width:2px,color:#e6a93f
    style Mv fill:#3d1b2e,stroke:#d65a9e,stroke-width:2px,color:#d65a9e
    style FE fill:#4f411e,stroke:#d4a843,stroke-width:3px,color:#ffd76b
```

---

## 2. Prestige Hierarchy

The game features three separate prestige resets, moving from local stage cycles to global meta upgrades.

```mermaid
graph TD
    A[Stage Generators & Reserves] -->|Prestige Reset| B[Stage Prestige Currency]
    B -->|Boosts Stage output by +25% per count| A

    B -->|Ascension Reset| C[🜲 Legacy Points - LP]
    C -->|Spent on LP tree nodes| D[Global Ascension Upgrades]
    D -->|Permanent global production mult| A

    C -->|Transcendence Reset| E[Æ Aether]
    E -->|Spent on Aether tree nodes| F[Aether Upgrades]
    E -->|Passive +5% Fortune mint rate per Æ| FE[Fortune Engine]
    F -->|Start Boost, Automation, Output buffs| A

    style A fill:#14111f,stroke:#2c2640,color:#ece3d0
    style B fill:#381d42,stroke:#b463d6,color:#b463d6
    style C fill:#3d1b2e,stroke:#d65a9e,color:#d65a9e
    style D fill:#3d1b2e,stroke:#d65a9e,color:#d65a9e
    style E fill:#2d1b4a,stroke:#9d5fe3,color:#9d5fe3
    style F fill:#2d1b4a,stroke:#9d5fe3,color:#9d5fe3
    style FE fill:#4f411e,stroke:#d4a843,color:#ffd76b
```

---

## 3. Simulation Loop & Save Data Pipeline

The central game store runs a strict decoupled simulation clock and serializes progress using base64 compression.

```mermaid
sequenceDiagram
    autonumber
    participant Loop as Fixed 20Hz Sim Loop
    participant Store as game.svelte.ts (Reactive Store)
    participant LZ as LZ-String Compressor
    participant IDB as IndexedDB (Browser Storage)

    Loop->>Store: stepSim(0.05 seconds)
    Note over Store: 1. Tick Stage Economies<br/>2. Fire Auto-buyers<br/>3. Re-calculate Space/Time/Multiverse<br/>4. Mint ★ Fortune
    Store->>Store: checkUnlocks()
    
    Note over Store: Every 30s: Trigger Auto-save
    Store->>Store: JSON.stringify(gs, replacer)
    Note over Store: Converts Decimals to string representations
    Store->>LZ: Compress UTF16/Base64
    LZ-->>Store: Compressed string
    Store->>IDB: set("cog_cosmos_save", data)
    IDB-->>Store: Success confirmation
```
