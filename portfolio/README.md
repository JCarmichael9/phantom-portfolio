# PHANTOM PORTFOLIO — Senior Capstone Project
**Web Design Pathway Program | Class of 2026**

> A Persona 5-inspired interactive portfolio experience showcasing three years of growth in web design.

---

## FILE STRUCTURE

```
portfolio/
├── index.html              ← Main entry point (all screens live here)
├── README.md               ← This file
│
├── css/
│   └── main.css            ← All styles (variables, screens, components, responsive)
│
├── js/
│   └── app.js              ← All JS: GSAP animations, Vue apps, screen logic, cursor
│
├── data/
│   └── projects.json       ← All portfolio content (edit this to add your real projects)
│
├── images/
│   ├── project-placeholder.svg   ← Replace with real project screenshots
│   └── gallery-placeholder.svg   ← Replace with real gallery images
│
├── audio/                  ← Add your audio files here (see app.js audio section)
│   ├── background.mp3      ← Background music (looping)
│   ├── hover.wav           ← Hover sound effect
│   └── click.wav           ← Click sound effect
│
└── pages/                  ← Reserved for future standalone pages if needed
```

---

## QUICK START

### Local Development
```bash
# Option 1: Python (recommended)
python3 -m http.server 8000
# Then open: http://localhost:8000

# Option 2: Node.js
npx serve .
# Then open: http://localhost:3000

# Option 3: VS Code
# Install "Live Server" extension → right-click index.html → Open with Live Server
```

> ⚠️ You MUST run a local server. Opening index.html directly as a file:// will block the fetch() call that loads projects.json.

---

## CUSTOMIZATION GUIDE

### 1. Update Your Info (projects.json)
Everything renders dynamically from `data/projects.json`. Edit:
- `developer.name` — Your full name
- `developer.bio` — Your personal bio
- `developer.stats` — Update project count, hours, etc.
- `developer.skills` — Your actual skill levels (0–100)
- `developer.social` — Your real GitHub, LinkedIn, email
- `projects[]` — Add all your real projects
- `reflection` — Write your actual reflection text
- `futurePlans` — Your real future goals

### 2. Add Real Project Screenshots
Replace `images/project-placeholder.svg` references in `projects.json`:
```json
"image": "images/your-project-screenshot.png"
```
Recommended image size: **400×250px** (project cards) or **800×500px** (featured)

### 3. Add Gallery Images
Add real images to the `images/` folder and update `gallery[]` in projects.json.

### 4. Enable Audio
1. Add MP3/WAV files to `audio/` folder
2. Uncomment the `<audio>` tags at the bottom of `index.html`
3. In `app.js`, find `APP.audioEnabled = true` and add:
```javascript
if (APP.audioEnabled) {
  document.getElementById('bgm').play().catch(() => {});
}
```

### 5. Change Your Name in the Cinematic
In `index.html`, find the intro panels and update:
```html
<span class="panel-word">YOUR NAME</span>
```
Also update the `data-text` attribute on `.startup-title`.

---

## TECHNOLOGY STACK

| Technology | Version | Purpose |
|---|---|---|
| HTML5 | — | Semantic structure |
| CSS3 | — | Custom design system, animations |
| JavaScript | ES2020+ | App logic, screen transitions |
| Vue.js | 3 (CDN) | Dynamic data rendering |
| GSAP | 3.12.5 | High-performance animations |
| Bootstrap | 5.3.2 | Base utilities (heavily overridden) |
| Google Fonts | — | Bebas Neue, Black Ops One, Rajdhani, Share Tech Mono, Orbitron |

---

## HOW THE SCREEN SYSTEM WORKS

All screens are `position: fixed` and layered by z-index. Visibility is toggled by the `.active` class:

```
z-index layering (highest = front):
  100 → #screen-startup
   95 → #screen-exit
   90 → #screen-intro
   80 → #screen-menu
   75 → #screen-unknown
   70 → #screen-saves
   60 → #screen-content (scrollable)
  800 → #modal-overlay (above content)
 9000 → .glitch-overlay
99999 → #cursor
```

The `showScreen(id)` function removes `.active` from all screens, then adds it to the target.

---

## HOW VUE.JS IS USED

Each major section has its own Vue app mounted to a dedicated `<div id="vue-*">`:

| Mount Point | App | Data Source |
|---|---|---|
| `#vue-portfolio` | Full portfolio by year | `APP.data.projects` |
| `#vue-featured` | Featured project gallery | `APP.data.projects.filter(featured)` |
| `#vue-stats` | Stat counters + skill bars | `APP.data.developer` |
| `#vue-about` | Character profile | `APP.data.developer` |
| `#vue-reflection` | Reflection blocks | `APP.data.reflection` |
| `#vue-future` | Future plans | `APP.data.futurePlans` |
| `#vue-gallery` | Filterable gallery | `APP.data.gallery` |
| `#vue-unknown` | Unknown route goals | `APP.data.futurePlans` |

All apps are initialized after `fetch('data/projects.json')` resolves in `init()`.

---

## GSAP ANIMATIONS GUIDE

Key animations and where they live (all in `js/app.js`):

```javascript
// Startup screen entrance
gsap.fromTo('.startup-title', { opacity:0, y:30 }, { opacity:1, y:0, ... })

// Menu entrance (stagger)
gsap.fromTo('.menu-item', { opacity:0, x:-40 }, { opacity:1, x:0, stagger:0.08, ... })

// Intro cinematic panels (timeline)
const tl = gsap.timeline()
tl.fromTo('.panel-word', { opacity:0, x:-60, skewX:-15 }, { opacity:1, ... })

// Save card entrance
gsap.fromTo('.save-card', { opacity:0, y:30 }, { opacity:1, stagger:0.1, ... })

// Scroll-triggered card reveals (IntersectionObserver + GSAP)
gsap.fromTo(entry.target, { opacity:0, y:30 }, { opacity:1, y:0, ... })
```

---

## RESPONSIVE BREAKPOINTS

| Breakpoint | Layout Changes |
|---|---|
| `> 1024px` | Full desktop — cinematic layouts, large text |
| `≤ 1024px` | About section stacks; save grid stays 2-col |
| `≤ 768px` | Mobile — cursor hidden, menus simplified, all grids go 1-col |
| `≤ 480px` | Small mobile — font sizes reduce, corners shrink |

---

## DEPLOYMENT TO GITHUB PAGES

### Step 1: Create Repository
```bash
git init
git add .
git commit -m "Initial commit — Phantom Portfolio"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/portfolio.git
git push -u origin main
```

### Step 2: Enable GitHub Pages
1. Go to your repo on GitHub
2. Settings → Pages
3. Source: **Deploy from a branch**
4. Branch: `main` / `/ (root)`
5. Click Save

### Step 3: Access Your Site
```
https://YOUR-USERNAME.github.io/portfolio/
```
> Note: GitHub Pages serves files statically, which is perfect — no backend needed.

### Step 4: Custom Domain (Optional)
Add a `CNAME` file to your repo root:
```
yourname.com
```
Then configure your DNS to point to GitHub Pages.

---

## RUBRIC COMPLIANCE CHECKLIST

| Requirement | Status | Location |
|---|---|---|
| Full Portfolio (all 3 years) | ✅ | `#section-portfolio` + Vue |
| Featured Projects | ✅ | `#section-featured` + Vue |
| Reflection | ✅ | `#section-reflection` + Vue |
| Future Plans | ✅ | `#section-future` + Vue |
| About Me | ✅ | `#section-about` + Vue |
| Dynamic JSON rendering | ✅ | `fetch('data/projects.json')` |
| Vue.js implementation | ✅ | 8 separate Vue apps |
| Responsive design | ✅ | 3 breakpoints in CSS |
| GSAP animations | ✅ | Throughout `app.js` |
| Bootstrap | ✅ | Included + overridden |
| GitHub Pages compatible | ✅ | Static files only |
| Semantic HTML | ✅ | `<section>`, `<article>`, `<nav>`, `<header>` |
| Accessible | ✅ | `aria-label`, `role`, keyboard nav |
| Clean/commented code | ✅ | All files fully commented |

---

## FONTS USED

- **Black Ops One** — Display, startup title (heavy, blocky)
- **Bebas Neue** — Menu items, section titles (condensed, editorial)
- **Rajdhani** — Body copy (technical, clean)
- **Share Tech Mono** — UI labels, tags, metadata (terminal feel)
- **Orbitron** — Nav, buttons, counters (futuristic, geometric)

---

## SUGGESTED SOUND DESIGN

| Sound | Trigger | Style |
|---|---|---|
| Background music | After YES click | Lo-fi jazz / jazz fusion, 90–110 BPM |
| UI hover | Menu item hover | Short 50ms blip, high frequency |
| UI confirm | Menu item click | Sharp stab, medium frequency |
| Glitch | Screen transition | Static burst, 100–200ms |
| Save select | Save card click | RPG "select" chime |
| Unknown route | Save 4 click | Eerie ambient tone |
| Exit reality | Exit Reality click | System error buzz |

Free sound resources: **freesound.org**, **zapsplat.com**, **pixabay.com/music**

---

## AI DOCUMENTATION NOTES

This project was built with the following AI assistance:
- **Planning**: Project structure and component architecture
- **Code generation**: Base HTML/CSS/JS scaffolding
- **Iteration**: Refined through multiple prompting cycles

All content (projects, reflection, bio, future plans) should be replaced with authentic personal data before submission.

---

*Built with ❤️ and way too much caffeine.*
*Web Design Pathway Program — Class of 2026*
