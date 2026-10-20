# USMNT Pitch & Stadium Surface Intelligence Hub (Raw Stadia)

An interactive **React + TypeScript + Tailwind CSS** analytics platform built for **Integrated Performance Support (IPS)** to evaluate, compare, and simulate **Raw Stadia** surface intelligence across training pitches and match-day stadiums on both **Desktop Pro** and **Mobile Fieldside** views.

---

## 1. Dual Experience: Desktop Pro + Mobile Fieldside View

- **Mobile Fieldside View (`< 768px` auto-detected, or toggleable via the header `Mobile Fieldside` button on desktop):**
  - **Portrait Goal-to-Goal 18-Zone Pitch Map:** Rotates the 3×6 Raw Stadia grid into a vertical Goal-to-Goal layout (`3 columns wide × 6 rows long`) with 56px thumb-friendly zone targets.
  - **Stacked `0–10` `REF` Gauges & Instant Cleat Callout:** Displays the recommended boot soleplate (`SG`, `Mixed`, `FG-L`, `FG-S`, `AG`), Stud Penetration Depth (`mm`), Surface Hardness (`Gm`), and purple `REF` benchmark lines with collapsible 18-zone mini-maps.
  - **One-Handed Bottom Navigation Bar:** Instant switching between `Fieldside`, `18-Zone`, `Radar/Sim`, `Camp Log`, and `Guide`.
- **Desktop Pro Dashboard View:**
  - Full 3-column signature `IMPACT` | `ENERGY` | `GRIP` `0–10` `REF` gauges with 18-zone pitch maps, side-by-side Pitch A vs. Pitch B biomechanical comparison, 6-axis Training Goal Radar, Interactive Formula Simulator, Longitudinal Camp Timeline, and the Raw Stadia × US Soccer Surface Intelligence Encyclopedia.

---

## 2. Raw Stadia Mathematical Engine (Verified to $< 10^{-9}$)

By combining the **Raw Stadia × US Soccer Indexes** reference guide with regression analysis across all 3,712 CSV zone records, the exact closed-form equations used by Raw Stadia to compute the **6 Training Goal Indexes** from **Impact ($I$)**, **Energy ($E$)**, and **Grip ($G$)** were verified to $< 10^{-9}$ precision:

| Training Goal Index | Exact Closed-Form Equation | Biomechanical & Tactical Interpretation |
| :--- | :--- | :--- |
| **Speed** | $\text{Speed} = \frac{I + E}{2} + 0.75$ | High Impact (firm) + High Energy (rebounding) minimizes ground contact time and maximizes sprint velocity. |
| **Endurance** | $\text{Endurance} = 11.25 - \frac{I + E}{2} = 12 - \text{Speed}$ | Softer, energy-dissipating turf increases physiological/cardiovascular cost while limiting joint shock. |
| **Recovery** | $\text{Recovery} = 5.75 + \frac{E - I}{2}$ | Low Impact (compliant/cushioned) + High Energy (springy, non-fatiguing) provides optimal regeneration. |
| **Power** | $\text{Power} = \frac{I + G}{2} + 0.50$ | High Impact + High Grip maximizes ground reaction force transfer during acceleration and jumping. |
| **Reaction** | $\text{Reaction} = \frac{I + E + G}{3} + 0.50$ | Holistic 1/3-weighted composite of firmness, rebound, and multi-directional bite for SSG, 1v1, and set pieces. |
| **Metabolic** | $\text{Metabolic} = 11.50 - \frac{I + E + G}{3} = 12 - \text{Reaction}$ | Lower-impact, energy-absorbing surfaces elevate internal metabolic workload per meter covered. |

---

## 3. Running Locally

```bash
npm install
npm run dev
```
