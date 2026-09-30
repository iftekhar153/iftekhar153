// BUET Student Verification Challenge Questions
// Sourced directly from QuestionForVerify.txt and evalution.txt

window.DEPARTMENT_QUESTIONS = {
  EEE: [
    {
      id: 'eee-1',
      question: 'How many lifts are on the ground of EEE side?',
      options: [
        { key: 'a', text: '1' },
        { key: 'b', text: '5' },
        { key: 'c', text: '4' },
        { key: 'd', text: '3' },
        { key: 'e', text: '2' }
      ],
      correctKey: 'c' // 4
    },
    {
      id: 'eee-2',
      question: 'Which floor has the library in EEE side?',
      options: [
        { key: 'a', text: '2nd' },
        { key: 'b', text: '9th' },
        { key: 'c', text: '5th' },
        { key: 'd', text: '4th' },
        { key: 'e', text: '6th' }
      ],
      correctKey: 'c' // 5th
    },
    {
      id: 'eee-3',
      question: 'What is the ending roll of B1?',
      options: [
        { key: 'a', text: '99' },
        { key: 'b', text: '98' },
        { key: 'c', text: '90' },
        { key: 'd', text: '102' },
        { key: 'e', text: '95' }
      ],
      correctKey: 'b' // 98
    },
    {
      id: 'eee-4',
      question: 'How many depts in ECE?',
      options: [
        { key: 'a', text: '1' },
        { key: 'b', text: '4' },
        { key: 'c', text: '3' },
        { key: 'd', text: '2' },
        { key: 'e', text: '0' }
      ],
      correctKey: 'c' // 3
    },
    {
      id: 'eee-5',
      question: 'What is the gate no of ECE?',
      options: [
        { key: 'a', text: '01' },
        { key: 'b', text: '02' },
        { key: 'c', text: '03' },
        { key: 'd', text: '04' },
        { key: 'e', text: '05' }
      ],
      correctKey: 'b' // 02
    },
    {
      id: 'eee-6',
      question: 'Which course is offered to L1T1 student?',
      options: [
        { key: 'a', text: 'EE201' },
        { key: 'b', text: 'MATH 157' },
        { key: 'c', text: 'PHY165' },
        { key: 'd', text: 'EEE105' },
        { key: 'e', text: 'HUM279' }
      ],
      correctKey: 'b' // MATH 157
    },
    {
      id: 'eee-7',
      question: 'Which floor has the office room in EEE?',
      options: [
        { key: 'a', text: '2nd' },
        { key: 'b', text: '3rd' },
        { key: 'c', text: '1st' },
        { key: 'd', text: '4th' },
        { key: 'e', text: '6th' }
      ],
      correctKey: 'b' // 3rd
    },
    {
      id: 'eee-8',
      question: 'When a car enters by the ECE gate, which turn does it take first to get to the plinth? (respect to the driver)',
      options: [
        { key: 'a', text: 'left' },
        { key: 'b', text: 'right' },
        { key: 'c', text: 'straight' },
        { key: 'd', text: 'no turn' },
        { key: 'e', text: 'backward' }
      ],
      correctKey: 'a' // left
    },
    {
      id: 'eee-9',
      question: 'Which side of ECE has EEE dept? (from the ECE entrance plinth view)',
      options: [
        { key: 'a', text: 'left' },
        { key: 'b', text: 'right' },
        { key: 'c', text: 'up floors' },
        { key: 'd', text: 'basement' },
        { key: 'e', text: 'whole ECE' }
      ],
      correctKey: 'b' // right
    },
    {
      id: 'eee-10',
      question: 'Currently who is the juniormost lecturer? (jan26+july26)',
      options: [
        { key: 'a', text: '19 batch' },
        { key: 'b', text: '20 batch' },
        { key: 'c', text: '21 batch' },
        { key: 'd', text: '18 batch' },
        { key: 'e', text: '22 batch' }
      ],
      correctKey: 'b' // 20 batch
    }
  ],

  CSE: [
    {
      id: 'cse-1',
      question: 'Which side of ECE has EEE dept? (from the ECE entrance plinth view)',
      options: [
        { key: 'a', text: 'left' },
        { key: 'b', text: 'right' },
        { key: 'c', text: 'up floors' },
        { key: 'd', text: 'basement' },
        { key: 'e', text: 'whole ECE' }
      ],
      correctKey: 'a' // left (as defined in QuestionForVerify.txt for CSE)
    },
    {
      id: 'cse-2',
      question: 'Which one is a CSE teacher?',
      options: [
        { key: 'a', text: 'Dr. Md. Shamsul Hoque' },
        { key: 'b', text: 'Dr. Pran Kanai Saha' },
        { key: 'c', text: 'Dr. Mohammad Kaykobad' },
        { key: 'd', text: 'Dr. Celia Shahnaz' },
        { key: 'e', text: 'Dr. Khan Mahmud Amanat' }
      ],
      correctKey: 'c' // Dr. Mohammad Kaykobad
    },
    {
      id: 'cse-3',
      question: 'How many depts in ECE?',
      options: [
        { key: 'a', text: '1' },
        { key: 'b', text: '4' },
        { key: 'c', text: '3' },
        { key: 'd', text: '2' },
        { key: 'e', text: '0' }
      ],
      correctKey: 'c' // 3
    },
    {
      id: 'cse-4',
      question: 'What is the gate no of ECE?',
      options: [
        { key: 'a', text: '01' },
        { key: 'b', text: '02' },
        { key: 'c', text: '03' },
        { key: 'd', text: '04' },
        { key: 'e', text: '05' }
      ],
      correctKey: 'b' // 02
    },
    {
      id: 'cse-5',
      question: 'When a car enters by the ECE gate, which turn does it take first to get to the plinth? (respect to the driver)',
      options: [
        { key: 'a', text: 'left' },
        { key: 'b', text: 'right' },
        { key: 'c', text: 'straight' },
        { key: 'd', text: 'no turn' },
        { key: 'e', text: 'backward' }
      ],
      correctKey: 'a' // left
    },
    {
      id: 'cse-6',
      question: 'Currently who is the juniormost lecturer? (jan26+july26)',
      options: [
        { key: 'a', text: '19 batch' },
        { key: 'b', text: '20 batch' },
        { key: 'c', text: '21 batch' },
        { key: 'd', text: '18 batch' },
        { key: 'e', text: '22 batch' }
      ],
      correctKey: 'b' // 20 batch
    },
    {
      id: 'cse-7',
      question: 'Which floors house the BME department in the ECE building?',
      options: [
        { key: 'a', text: '2nd-3rd' },
        { key: 'b', text: '5th-6th' },
        { key: 'c', text: '10th-11th' },
        { key: 'd', text: '8th-9th' },
        { key: 'e', text: 'Ground floor' }
      ],
      correctKey: 'c' // 10th-11th
    }
  ],

  CE: [
    {
      id: 'ce-1',
      question: 'How many lifts are on the ground of CE building?',
      options: [
        { key: 'a', text: '1' },
        { key: 'b', text: '5' },
        { key: 'c', text: '4' },
        { key: 'd', text: '3' },
        { key: 'e', text: '2' }
      ],
      correctKey: 'e' // 2
    },
    {
      id: 'ce-2',
      question: 'Where is the Hydraulic Lab on CE?',
      options: [
        { key: 'a', text: 'ground' },
        { key: 'b', text: 'basement' },
        { key: 'c', text: '1st floor' },
        { key: 'd', text: '5th' },
        { key: 'e', text: '2nd' }
      ],
      correctKey: 'a' // ground
    },
    {
      id: 'ce-3',
      question: 'What software is used for drawing in CE?',
      options: [
        { key: 'a', text: 'AutoCAD' },
        { key: 'b', text: 'MATLAB' },
        { key: 'c', text: 'KiCad' },
        { key: 'd', text: 'Pen paper' },
        { key: 'e', text: 'Python' }
      ],
      correctKey: 'a' // AutoCAD
    },
    {
      id: 'ce-4',
      question: 'Where is the NCE department located?',
      options: [
        { key: 'a', text: 'in OBE' },
        { key: 'b', text: 'ECE building' },
        { key: 'c', text: 'CE building' },
        { key: 'd', text: 'Auditorium' },
        { key: 'e', text: 'Central Library' }
      ],
      correctKey: 'a' // in OBE
    },
    {
      id: 'ce-5',
      question: 'Currently who is the juniormost lecturer? (jan26+july26)',
      options: [
        { key: 'a', text: '19 batch' },
        { key: 'b', text: '20 batch' },
        { key: 'c', text: '21 batch' },
        { key: 'd', text: '18 batch' },
        { key: 'e', text: '22 batch' }
      ],
      correctKey: 'b' // 20 batch
    },
    {
      id: 'ce-6',
      question: 'What is the standard 2-letter abbreviation for the BUET Central Auditorium?',
      options: [
        { key: 'a', text: 'CA' },
        { key: 'b', text: 'BA' },
        { key: 'c', text: 'AU' },
        { key: 'd', text: 'CT' },
        { key: 'e', text: 'AD' }
      ],
      correctKey: 'a' // CA
    }
  ]
};

window.ANONYMOUS_NAME_PREFIXES = [
  'Wizard', 'Link', 'Sooho', 'Quantum', 'Neon', 'Binary', 'Cyber', 'Matrix',
  'Pixel', 'Shadow', 'Circuit', 'Algo', 'Turbo', 'Cosmic', 'Delta', 'Glitch',
  'Logic', 'Byte', 'Vector', 'Zero', 'Hex', 'Solar', 'Aero', 'Chrono', 'Hyper'
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

// Returns exactly 5 questions for the given department
window.getQuestionsForDept = function(dept) {
  const pool = window.DEPARTMENT_QUESTIONS[dept] || window.DEPARTMENT_QUESTIONS['CSE'] || [];
  // Shuffle shallow copy
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 5);
};
