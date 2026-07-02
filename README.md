# 🎲 NxN Rubikova Kocka sa Three.js

Interaktivni simulator Rubikove kocke sa 3D vizuelizacijom pomoću Three.js-a. Projekat kombinuje Python backend za logiku kockanja sa React + TypeScript frontend-om za modernu veb aplikaciju.

## 🎯 Mogućnosti

- **3D Vizuelizacija** - Realistična 3D reprezentacija Rubikove kocke pomoću Three.js-a
- **Podrška za NxN Kocke** - Simulator podržava bilo koju veličinu kocke (3x3, 4x4, itd.)
- **Upravljanje Tastaturom** - Jednostavna kontrola potezima korišćenjem tastera
- **Animirani Potezi** - Glatke animacije pri rotaciji strana kocke
- **Python Backend** - Složena logika za manipulaciju stanjem kocke
- **GUI Komponente** - Radix UI komponente sa Tailwind CSS stilom

## 🛠 Tehnologije

### Frontend
- **React 19** - Moderan React sa hook-ovima
- **TypeScript** - Bezbedna tipizacija u JavaScript-u
- **Vite** - Brz build alat sa brzim osvežavanjem (HMR)
- **Three.js** - 3D grafička biblioteka
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Pristupačne UI komponente
- **ESLint** - Alat za analizu koda i linting

### Backend
- **Python** - Logika Rubikove kocke
  - `cube.py` - Osnovna implementacija kocke
  - `cube_gui.py` - GUI komponente za prikaz

## 🚀 Instalacija i Pokretanje

### Preduslovi
- Node.js (verzija 18+)
- npm ili yarn
- Python 3.x (za Python skripte)

### Setup

1. **Kloniranje repozitorijuma**
```bash
git clone https://github.com/username/nxn-rubics-cube-three-js.git
cd nxn-rubics-cube-three-js
```

2. **Instalacija zavisnosti**
```bash
npm install
```

3. **Pokretanje razvojnog servera**
```bash
npm run dev
```
Server će biti dostupan na `http://localhost:5173`

### Pravljenje za produkciju
```bash
npm run build
```

Rezultat će biti u `dist/` direktorijumu.

### Pregled produkcijskog builda
```bash
npm run preview
```

## 📁 Struktura Projekta

```
├── src/
│   ├── App.tsx              # Glavna React komponenta
│   ├── main.tsx             # Ulazna točka
│   ├── index.css            # Globalni stilovi
│   ├── lib/
│   │   ├── Cube.ts          # Logika Rubikove kocke
│   │   ├── CubeGui.ts       # 3D prikaz sa Three.js
│   │   ├── SceneInit.ts     # Inicijalizacija Three.js scene
│   │   └── utils.ts         # Pomoćne funkcije
│   ├── components/
│   │   └── ui/              # Radix UI komponente
│   └── assets/              # Slike i teksture (cubemap, cm2)
├── public/                   # Javni resursi
├── cube.py                  # Python implementacija kocke
├── cube_gui.py              # Python GUI komponente
├── test_gui.py              # Testovi za GUI
├── test_gui_4x4.py          # Testovi za 4x4 kocku
├── package.json             # NPM zavisnosti
├── tsconfig.json            # TypeScript konfiguracija
├── vite.config.ts           # Vite konfiguracija
└── eslint.config.js         # ESLint konfiguracija
```

## ⌨️ Kontrole

Kocka se upravlja korišćenjem tastature:

| Taster | Potez | Shift + Taster | Obrnuti potez |
|--------|-------|----------------|---------------|
| **F** | Front | Shift+F | Front' |
| **R** | Right | Shift+R | Right' |
| **U** | Up    | Shift+U | Up' |
| **L** | Left  | Shift+L | Left' |
| **D** | Down  | Shift+D | Down' |
| **B** | Back  | Shift+B | Back' |

## 🎓 Kako Radi

### Cube klasa (cube.py & Cube.ts)
- Upravlja stanjem Rubikove kocke
- Podržava proizvoljan broj slojeva (N x N)
- Prati boje na svakom kvadratiću
- Implementira sve standardne poteze (F, R, U, L, D, B)
- Podrška za obrnute poteze sa prime notacijom (')

### CubeGui3D (CubeGui.ts)
- Kreira 3D reprezentaciju kocke u Three.js
- Animira rotacije prilikom izvršavanja poteza
- Mapira stanje kocke na Three.js geometriju
- Ažurira boje nakon svakog poteza

### SceneInit (SceneInit.ts)
- Inicijalizuje Three.js scenu
- Postavlja kameru, svetla i renderer
- Omogućava 3D prikaz
