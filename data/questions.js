// BUET Student Verification Challenge Questions
// Sourced directly from evalution.txt and authentic BUET campus lore

window.BUET_VERIFICATION_QUESTIONS = [
  {
    id: 'ece-lifts',
    question: 'How many lifts are in the ECE / EEE wing of the ECE building?',
    hint: 'Think of the passenger lift bank on the main lobby.',
    acceptKeywords: ['4', 'four'],
    validate: function(input) {
      const clean = input.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      return clean === '4' || clean.includes('four') || clean === '4lifts';
    }
  },
  {
    id: 'bme-floors',
    question: 'Which floors house the BME department in the ECE building?',
    hint: 'The top two floors of the ECE complex.',
    acceptKeywords: ['10-11', '10th-11th', '10 and 11'],
    validate: function(input) {
      const clean = input.toLowerCase().trim();
      return /10.*11/.test(clean) || clean.includes('10-11') || clean.includes('10 to 11') || clean.includes('10th') || clean.includes('11th');
    }
  },
  {
    id: 'ce-lifts',
    question: 'How many lifts are in the Civil Engineering (CE) building?',
    hint: 'Count the elevators in the main CE building lobby.',
    acceptKeywords: ['2', 'two'],
    validate: function(input) {
      const clean = input.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      return clean === '2' || clean.includes('two') || clean === '2lifts';
    }
  },
  {
    id: 'nce-location',
    question: 'Where is the NCE (Nanomaterials and Ceramic Engineering) department located?',
    hint: 'The historic academic building acronym (3 letters).',
    acceptKeywords: ['in OBE', 'OBE', 'OAB', 'Old Academic Building'],
    validate: function(input) {
      const clean = input.toLowerCase().trim();
      return clean.includes('obe') || clean.includes('oab') || clean.includes('old academic') || clean.includes('old building');
    }
  },
  {
    id: 'me-hydraulic',
    question: 'Where is the Hydraulic Lab located in the ME (Mechanical) department?',
    hint: 'Think of the floor level where heavy water pumps and flumes are situated.',
    acceptKeywords: ['ground floor', 'ground', 'in ground floor'],
    validate: function(input) {
      const clean = input.toLowerCase().trim();
      return clean.includes('ground') || clean === 'gf' || clean.includes('ground floor');
    }
  },
  {
    id: 'polashi-gate',
    question: 'Which iconic gate connects BUET with the Palashi / Azimpur intersection?',
    hint: 'Named after the famous battle & intersection nearby.',
    acceptKeywords: ['Palashi gate', 'Polashi gate'],
    validate: function(input) {
      const clean = input.toLowerCase().trim();
      return clean.includes('palashi') || clean.includes('polashi');
    }
  },
  {
    id: 'central-auditorium',
    question: 'What is the standard 2-letter abbreviation for the BUET Central Auditorium?',
    hint: 'Two letters: C...',
    acceptKeywords: ['CA', 'Central Auditorium'],
    validate: function(input) {
      const clean = input.toLowerCase().trim().replace(/[^a-z]/g, '');
      return clean === 'ca' || clean.includes('centralauditorium');
    }
  }
];

window.ANONYMOUS_NAME_PREFIXES = [
  'Wizard', 'Link', 'Sooho', 'Quantum', 'Neon', 'Binary', 'Cyber', 'Matrix',
  'Pixel', 'Shadow', 'Circuit', 'Algo', 'Turbo', 'Cosmic', 'Delta', 'Glitch',
  'Logic', 'Byte', 'Vector', 'Zero', 'Hex', 'Solar', 'Aero', 'Chrono'
];

window.ANONYMOUS_NAME_SUFFIXES = [
  'Fox', 'Bash', 'Text', 'Titan', 'Falcon', 'Badger', 'Otter', 'Wolf',
  'Sage', 'Echo', 'Phantom', 'Dragon', 'Cheetah', 'Hawk', 'Viper', 'Panda',
  'Raven', 'Stalker', 'Knight', 'Prowler', 'Rider', 'Spark', 'Coder', 'Sentinel'
];

window.getRandomAnonymousName = function() {
  const p = window.ANONYMOUS_NAME_PREFIXES[Math.floor(Math.random() * window.ANONYMOUS_NAME_PREFIXES.length)];
  const s = window.ANONYMOUS_NAME_SUFFIXES[Math.floor(Math.random() * window.ANONYMOUS_NAME_SUFFIXES.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${p}${s}_${num}`;
};
