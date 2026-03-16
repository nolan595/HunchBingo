# Connect 3 – Bingo Simulation Platform

## Purpose

This platform is an **internal simulation tool** used to test a Connect-3 style bingo game against real sportsbook events.

The goal is to allow Hunch admins to:

- Create bingo sheet templates
- Attach them to real sports events
- Pull sportsbook results from the Superbet Offer API
- Simulate sheet outcomes
- Measure how often sheets achieve **Connect 3**

This system is **not intended for real players**.  
It exists purely for **game design testing and analysis**.

---

# Game Overview

Connect-3 is a **3x3 bingo style game**.

Each bingo sheet contains **9 squares** arranged in a grid.

Each square references:

- a sportsbook **Market ID**
- an **Odds Difficulty Tier**

Example sheet:

| Square | Market ID | Difficulty |
|------|------|------|
| 1 | 547 | Near Certain |
| 2 | 236220 | Easy |
| 3 | 112 | Medium |
| 4 | 781 | Hard |
| 5 | 999 | Easy |
| 6 | 120 | Medium |
| 7 | 220 | Hard |
| 8 | 341 | Easy |
| 9 | 887 | Extreme |

When the event finishes, each square becomes:

- **WON**
- **LOST**

If a sheet achieves **3 WON squares in a line**, the sheet wins.

Valid lines:

- Horizontal rows
- Vertical columns

Diagonal lines **do NOT count**.

---

# Core Concepts

## Odds Difficulty

Admins define difficulty tiers based on **odds ranges**.

Example configuration:

| Name | Odds Min | Odds Max |
|-----|-----|-----|
| Near Certain | 1.01 | 1.25 |
| Easy | 1.26 | 1.50 |
| Medium | 1.51 | 2.00 |
| Hard | 2.01 | 3.00 |
| Extreme | 3.01 | 10.00 |

These tiers allow admins to balance bingo sheets.

---

# Bingo Sheet Templates

Admins create **reusable bingo sheet templates**.

Each template contains:

- exactly **9 squares**
- arranged in a **3x3 grid**
- each square references:
  - Market ID
  - Difficulty Tier

Example layout:


[ 547 ] [ 112 ] [ 304 ]
[ 781 ] [ 999 ] [ 120 ]
[ 220 ] [ 341 ] [ 887 ]


Rules:

- A market **cannot appear twice** in the same sheet
- Sheets act as **templates**
- Templates can be reused across many games

Each new game recreates the sheet structure for simulation.

---

# External Events

Admins register sports events that will be used for simulations.

Stored fields:


name
externalEventId
createdAt


Example:


Real Madrid vs Barcelona
externalEventId: 93847474


These events are later linked to a game.

---

# Game

A **Game** represents a simulation tied to an external event.

Admins define:


name
eventId
openTime
closeTime
createdAt


The game represents the time window in which the event occurs.

During simulation:

- bingo sheets are used
- markets are checked
- results are calculated

---

# Square Result Logic

Each square references a sportsbook **Market ID**.

When the event finishes:

1. The system queries the **Superbet Offer API**
2. The relevant market is located
3. The market outcome status is read

Square result is determined as:


won → square = WON
lost → square = LOST


Only two states exist.


WON
LOST


---

# Connect 3 Detection

After all squares are settled, evaluate the grid.

Example grid:


WON LOST WON
WON WON LOST
LOST WON LOST


Check the following:

## Horizontal

Row 1  
Row 2  
Row 3  

## Vertical

Column 1  
Column 2  
Column 3  

If any row or column contains **3 WON squares**, the sheet wins.

---

# Admin Panel

This system only requires an **Admin Interface**.

No authentication is required.

Admin pages:


/games
/bingo-sheets
/events
/difficulties


---

# Admin Page Details

## Odds Difficulties

Create and manage difficulty tiers.

Fields:


name
oddsMin
oddsMax


Example entry:


Near Certain
1.01
1.25


---

## Bingo Sheets

Create bingo sheet templates.

UI concept:


[ square ][ square ][ square ]
[ square ][ square ][ square ]
[ square ][ square ][ square ]


Each square requires:


marketId
difficultyId


Validation rules:

- Markets cannot repeat in the same sheet
- Exactly 9 squares must exist

Positions map as:


1 2 3
4 5 6
7 8 9


---

## External Events

Create events pulled from Superbet.

Fields:


name
externalEventId


---

## Games

Create simulation games.

Fields:


name
eventId
openTime
closeTime


Each game is tied to one event.

---

# Simulation Logic

Simulation runs after the event finishes.

Steps:

1. Fetch event markets from Offer API
2. For each bingo sheet
3. Check all squares
4. Determine WON / LOST
5. Evaluate Connect 3 condition

Example output:


Sheet Result

WON LOST WON
WON WON LOST
LOST WON LOST

Connect3: TRUE
Score: 4


Score = number of WON squares.

---

# Database Schema

## odds_difficulties


id
name
odds_min
odds_max
created_at


---

## bingo_sheets


id
name
created_at


---

## bingo_sheet_squares


id
sheet_id
position
market_id
difficulty_id


Position values:


1-9


Grid mapping:


1 2 3
4 5 6
7 8 9


---

## external_events


id
name
external_event_id
created_at


---

## games


id
name
event_id
open_time
close_time
created_at


---

# Tech Stack

Recommended stack:


Next.js (App Router)
TypeScript
Prisma ORM
PostgreSQL (Railway)
TailwindCSS


---

# API Routes

## Create Difficulty


POST /api/difficulties


---

## Create Bingo Sheet


POST /api/bingo-sheets


---

## Create Event


POST /api/events


---

## Create Game


POST /api/games


---

## Run Simulation


POST /api/simulate-game


Simulation flow:


fetch event markets
evaluate sheet squares
calculate grid results
check connect3 condition
return simulation result


---

# Project Structure

Example project layout:


/app
/games
/bingo-sheets
/events
/difficulties

/api
/games
/simulate

/lib
connect3-evaluator.ts
offer-api-client.ts

/prisma
schema.prisma


---

# Core Logic

File:


connect3-evaluator.ts


Function:


evaluateConnect3(grid)


Example input:


[
"WON","LOST","WON",
"WON","WON","LOST",
"LOST","WON","LOST"
]


Logic:


check rows
check columns


Return:


{
connect3: true,
score: 4
}


---

# Future Expansion

Possible future improvements:

- Diagonal Connect 3 wins
- Real player participation
- Prize pools
- Probability analysis for bingo sheets
- Odds balancing algorithms
- Multi-event simulations
- Automated sheet generation