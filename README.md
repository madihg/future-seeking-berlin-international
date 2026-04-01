# Planting Secrets: Psychic Ingestion

**A collective digital ritual for the lecture-performance by Halim Madi**

---

**BI Talk — Berlin International University of Applied Sciences**  
📅 January 6, 2026 · 18:00  
📍 Studio 1, Salzufer 6, 10587 Berlin

---

## About the Performance

_Planting Secrets: Poetics of Migration and Machine_ explores the deep resonance between migrant consciousness and cyborg consciousness. Drawing on Bernard Stiegler's theory of epiphylogenesis and André Leroi-Gourhan's evolutionary anthropology, this lecture-performance reflects on how humans have always externalized memory—from stone tools and language to servers and large language models.

The migrant, always anticipating rupture, becomes a prototype for the future: compelled to carry as little as possible, and thus to inscribe their soul elsewhere.

This web application serves as a **psychic go-bag**—a shared vessel where audience members can deposit fragments of thought, memory, and response in real-time. Together, we build a collective externalization: a temporary monument to what we carry, and what we leave behind.

## How to Participate

1. **Visit the live site** on your phone or laptop
2. **Submit a fragment**: a memory, a word, something you carry, something you've lost
3. **Watch the collective mind emerge** as others' submissions appear in real-time
4. **Witness** as these fragments become part of the performance

_What would you pack if you had to leave in ten minutes?_  
_What have you already lost that you still carry?_

---

## About the Artist

**Halim Madi** is a Lebanese artist and researcher working at the intersection of artificial intelligence, migration, and poetic technologies. With a background in data science and a practice rooted in performance and electronic literature, his work explores how memory, identity, and language are encoded, displaced, and remixed through machines.

Currently a resident artist at Counterpulse (San Francisco), Halim creates installations, lectures, and digital rituals that investigate the aesthetics of displacement and the psychotechnics of survival. His recent projects examine AI not as a tool, but as a mirror of diasporic consciousness—a site of both exteriorization and communion.

---

## Technical Notes

This application is built for ephemeral, session-based collective writing. Submissions exist only in memory and dissolve when the session ends—a digital enactment of impermanence.

### Local Development

```bash
npm install
npm run dev
```

### Deployment

Deployed on Vercel's serverless architecture. The polling-based real-time system ensures all participants see submissions as they arrive.

### Project Structure

```
├── api/
│   ├── index.js          # Express server
│   ├── submit.js         # Submission endpoint
│   └── heartbeat.js      # Presence tracking
├── public/
│   ├── index.html        # Interface
│   └── client.js         # Client-side logic
├── package.json
├── vercel.json
└── README.md
```

---

## License

MIT License

---

_"AI is not an alien other, but a kind of go-bag—a tool born of exile, storing the fragments of selves we can no longer carry."_

— Halim Madi
