// Full 24-key Camelot Wheel map.
// Numbers 1–12 run counter-clockwise on the wheel; B = major, A = minor.
// Compatibility: same number (A↔B), number±1 (same letter).

const KEYS = [
  { code: "1A", label: "A♭ Minor",  type: "minor", number: 1,  letter: "A", root: "Ab", notes: ["Ab","Bb","Cb","Db","Eb","Fb","Gb"], relativeCode: "1B",  cwCode: "2A",  ccwCode: "12A" },
  { code: "1B", label: "B Major",   type: "major", number: 1,  letter: "B", root: "B",  notes: ["B","C#","D#","E","F#","G#","A#"],  relativeCode: "1A",  cwCode: "2B",  ccwCode: "12B" },
  { code: "2A", label: "E♭ Minor",  type: "minor", number: 2,  letter: "A", root: "Eb", notes: ["Eb","F","Gb","Ab","Bb","Cb","Db"], relativeCode: "2B",  cwCode: "3A",  ccwCode: "1A"  },
  { code: "2B", label: "F# Major",  type: "major", number: 2,  letter: "B", root: "F#", notes: ["F#","G#","A#","B","C#","D#","E#"], relativeCode: "2A",  cwCode: "3B",  ccwCode: "1B"  },
  { code: "3A", label: "B♭ Minor",  type: "minor", number: 3,  letter: "A", root: "Bb", notes: ["Bb","C","Db","Eb","F","Gb","Ab"],  relativeCode: "3B",  cwCode: "4A",  ccwCode: "2A"  },
  { code: "3B", label: "D♭ Major",  type: "major", number: 3,  letter: "B", root: "Db", notes: ["Db","Eb","F","Gb","Ab","Bb","C"],  relativeCode: "3A",  cwCode: "4B",  ccwCode: "2B"  },
  { code: "4A", label: "F Minor",   type: "minor", number: 4,  letter: "A", root: "F",  notes: ["F","G","Ab","Bb","C","Db","Eb"],  relativeCode: "4B",  cwCode: "5A",  ccwCode: "3A"  },
  { code: "4B", label: "A♭ Major",  type: "major", number: 4,  letter: "B", root: "Ab", notes: ["Ab","Bb","C","Db","Eb","F","G"],  relativeCode: "4A",  cwCode: "5B",  ccwCode: "3B"  },
  { code: "5A", label: "C Minor",   type: "minor", number: 5,  letter: "A", root: "C",  notes: ["C","D","Eb","F","G","Ab","Bb"],  relativeCode: "5B",  cwCode: "6A",  ccwCode: "4A"  },
  { code: "5B", label: "E♭ Major",  type: "major", number: 5,  letter: "B", root: "Eb", notes: ["Eb","F","G","Ab","Bb","C","D"],  relativeCode: "5A",  cwCode: "6B",  ccwCode: "4B"  },
  { code: "6A", label: "G Minor",   type: "minor", number: 6,  letter: "A", root: "G",  notes: ["G","A","Bb","C","D","Eb","F"],  relativeCode: "6B",  cwCode: "7A",  ccwCode: "5A"  },
  { code: "6B", label: "B♭ Major",  type: "major", number: 6,  letter: "B", root: "Bb", notes: ["Bb","C","D","Eb","F","G","A"],  relativeCode: "6A",  cwCode: "7B",  ccwCode: "5B"  },
  { code: "7A", label: "D Minor",   type: "minor", number: 7,  letter: "A", root: "D",  notes: ["D","E","F","G","A","Bb","C"],  relativeCode: "7B",  cwCode: "8A",  ccwCode: "6A"  },
  { code: "7B", label: "F Major",   type: "major", number: 7,  letter: "B", root: "F",  notes: ["F","G","A","Bb","C","D","E"],  relativeCode: "7A",  cwCode: "8B",  ccwCode: "6B"  },
  { code: "8A", label: "A Minor",   type: "minor", number: 8,  letter: "A", root: "A",  notes: ["A","B","C","D","E","F","G"],  relativeCode: "8B",  cwCode: "9A",  ccwCode: "7A"  },
  { code: "8B", label: "C Major",   type: "major", number: 8,  letter: "B", root: "C",  notes: ["C","D","E","F","G","A","B"],  relativeCode: "8A",  cwCode: "9B",  ccwCode: "7B"  },
  { code: "9A", label: "E Minor",   type: "minor", number: 9,  letter: "A", root: "E",  notes: ["E","F#","G","A","B","C","D"],  relativeCode: "9B",  cwCode: "10A", ccwCode: "8A"  },
  { code: "9B", label: "G Major",   type: "major", number: 9,  letter: "B", root: "G",  notes: ["G","A","B","C","D","E","F#"], relativeCode: "9A",  cwCode: "10B", ccwCode: "8B"  },
  { code: "10A", label: "B Minor",  type: "minor", number: 10, letter: "A", root: "B",  notes: ["B","C#","D","E","F#","G","A"],  relativeCode: "10B", cwCode: "11A", ccwCode: "9A"  },
  { code: "10B", label: "D Major",  type: "major", number: 10, letter: "B", root: "D",  notes: ["D","E","F#","G","A","B","C#"], relativeCode: "10A", cwCode: "11B", ccwCode: "9B"  },
  { code: "11A", label: "F# Minor", type: "minor", number: 11, letter: "A", root: "F#", notes: ["F#","G#","A","B","C#","D","E"],  relativeCode: "11B", cwCode: "12A", ccwCode: "10A" },
  { code: "11B", label: "A Major",  type: "major", number: 11, letter: "B", root: "A",  notes: ["A","B","C#","D","E","F#","G#"], relativeCode: "11A", cwCode: "12B", ccwCode: "10B" },
  { code: "12A", label: "C# Minor", type: "minor", number: 12, letter: "A", root: "C#", notes: ["C#","D#","E","F#","G#","A","B"],  relativeCode: "12B", cwCode: "1A",  ccwCode: "11A" },
  { code: "12B", label: "E Major",  type: "major", number: 12, letter: "B", root: "E",  notes: ["E","F#","G#","A","B","C#","D#"], relativeCode: "12A", cwCode: "1B",  ccwCode: "11B" },
]

const _byCode = new Map(KEYS.map(k => [k.code, k]))

export class CamelotEngine {
  constructor() {
    this._activeCode = null
  }

  getAllKeys() { return KEYS }

  getKey(code) { return _byCode.get(code) ?? null }

  getKeyByRoot(root, type) {
    return KEYS.find(k => k.root === root && k.type === type) ?? null
  }

  getCompatibleKeys(code) {
    const key = this.getKey(code)
    if (!key) return []
    const codes = new Set([key.relativeCode, key.cwCode, key.ccwCode])
    return [...codes].map(c => this.getKey(c)).filter(Boolean)
  }

  get activeCode() { return this._activeCode }

  setActiveKey(code) {
    const prev = this._activeCode
    if (prev === code) return
    this._activeCode = code
    return { from: prev, to: code }
  }
}
