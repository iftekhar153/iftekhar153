# 🏛️ BUET TEACHER EVALUATION — Anonymous Student Evaluation Portal

A modern, high-aesthetic web application designed specifically for **Bangladesh University of Engineering and Technology (BUET)** students to anonymously evaluate and review faculty members.

Built strictly according to [`website page model.docx`](file:///d:/Downloads_From_Surrounding/teacherEvaluation_Project/website%20page%20model.docx) with pure **HTML5, CSS3, and JavaScript**, featuring:
- **4-Page Workflow** (Welcome & Dept Selector &rarr; 5-Question Department Verification &rarr; Teacher Directory &rarr; Teacher Review Page)
- **Dual Star Rating Scale (+5 to -5)**:
  - **Yellow Stars (+1 to +5)** for good reviews & commendations
  - **Neutral Star (0)** for neutral/average feedback
  - **Red Stars (-1 to -5)** for strictness, tough quizzes, & heavy scrutiny
- **Day / Night Mode Toggle** (Light & Dark themes persisted in `localStorage`)
- **Anonymous Identity System** (Random or custom anonymous handles + avatar mascots)
- **271 Authentic BUET Faculty Directory Records** (Across CSE, EEE, CE, ME, and more)
- **Google Firebase Firestore** integration (`megamindratings` project) with resilient offline `localStorage` fallback.

---

## 🧭 The 4-Page Workflow

### Page 1: Welcome & Department Selection
- Header: *"Welcome to the BUET Teacher Evaluation portal"*
- Subtitle: *"Ans some simple question to verify you are a BUET-ian (you will be treated as an anonymous person)"*
- Department selector dropdown: currently configured for **CSE**, **EEE**, and **CE**.
- *"Continue to Verification"* button.

### Page 2: Campus Trivia Verification Challenge
- Sourced directly from [`QuestionForVerify.txt`](file:///d:/Downloads_From_Surrounding/teacherEvaluation_Project/QuestionForVerify.txt).
- Presents 5 randomized campus trivia questions based on the chosen department.
- Multiple-choice options (A, B, C, D, E).
- **Silent Quiz**: Does not reveal correct or wrong answers during answering.
- Upon clicking *"Submit Answers for Verification"*:
  - If **&ge; 4 out of 5** correct: **Verified BUET-ian!** Prompts student to set or randomize their anonymous handle (e.g. `WizardFox_42`, `LinkBash_89`) and choose an avatar mascot (🦊, 🐺, 🦅, 🦉, 🐉, etc.), then proceed to Page 3.
  - If **< 4 out of 5**: Shows score and offers a *"Try Again"* button with 5 fresh questions.

### Page 3: BUET TEACHER EVALUATION Directory
- Title: *"BUET TEACHER EVALUATION"*
- Subtitle: *"List of the teachers (from highest star to lowest)"*
- Real-time search: *"Search teacher by name..."*
- Department filter tabs (All, CSE, EEE, CE, etc.).
- Sort selector: **Highest Star to Lowest (+5 to -5)**, Most Reviews, Lowest Star, Name (A-Z).
- Teacher Cards: Displays rating score badge (`★ +4.5` in gold or `★ -2.0` in red), designation, department, and reviews count.
- Clicking any teacher transitions to **Page 4**.

### Page 4: Teacher Review & Evaluation Page
- Header: *"Comment your review for [Teacher Name]"*
- Interactive **11-step Star Rating Scale**:
  `+5  +4  +3  +2  +1    0    -1  -2  -3  -4  -5`
  - Click to select and click again to deselect.
  - Mutually exclusive between Yellow (+1 to +5), Neutral (0), and Red (-1 to -5).
- Course Code input (e.g. `CSE 101`, `EEE 205`).
- Comment Box with character counter.
- *"Submit"* button saves review to Firebase Firestore & updates stats in real-time.
- Below the comment box: **Reviews of Others** displays past student reviews with author handle, mascot, date, rating pill, and comment.

---

## 🚀 How to Make the Page Live on GitHub

Your repository is `https://github.com/iftekhar153/iftekhar153`.

### Option A: Using Git Command Line (Recommended)

1. Open PowerShell or Command Prompt in this folder:
   ```bash
   cd d:\Downloads_From_Surrounding\teacherEvaluation_Project
   ```

2. Initialize Git and commit the files:
   ```bash
   git init
   git add .
   git commit -m "Implement 4-page BUET Teacher Evaluation with Day/Night mode and +5 to -5 rating"
   git branch -M main
   ```

3. Connect to your GitHub repository and push:
   ```bash
   git remote add origin https://github.com/iftekhar153/iftekhar153.git
   git push -u origin main --force
   ```

---

### Option B: Upload via GitHub Web Interface

1. Open your repository in your browser: [https://github.com/iftekhar153/iftekhar153](https://github.com/iftekhar153/iftekhar153)
2. Click **Add file** &rarr; **Upload files**.
3. Drag and drop the updated files:
   - [`index.html`](file:///d:/Downloads_From_Surrounding/teacherEvaluation_Project/index.html)
   - [`.nojekyll`](file:///d:/Downloads_From_Surrounding/teacherEvaluation_Project/.nojekyll)
   - [`css/style.css`](file:///d:/Downloads_From_Surrounding/teacherEvaluation_Project/css/style.css)
   - [`js/app.js`](file:///d:/Downloads_From_Surrounding/teacherEvaluation_Project/js/app.js)
   - [`js/firebase-config.js`](file:///d:/Downloads_From_Surrounding/teacherEvaluation_Project/js/firebase-config.js)
   - [`js/verification.js`](file:///d:/Downloads_From_Surrounding/teacherEvaluation_Project/js/verification.js)
   - [`data/questions.js`](file:///d:/Downloads_From_Surrounding/teacherEvaluation_Project/data/questions.js)
   - [`data/teachers.js`](file:///d:/Downloads_From_Surrounding/teacherEvaluation_Project/data/teachers.js)
4. Commit the changes.

---

### Verifying GitHub Pages Settings

1. In your GitHub repository, go to **Settings** &rarr; **Pages** (in the left sidebar).
2. Under **Build and deployment** &rarr; **Source**, verify:
   - Branch: `main`
   - Folder: `/ (root)`
3. Click **Save**.
4. GitHub Pages will build and deploy your site within 1–2 minutes!
5. Your live website URL will be:
   - `https://iftekhar153.github.io/` or
   - `https://iftekhar153.github.io/iftekhar153/`

---

## 🔥 Firebase Firestore Setup (`megamindratings`)

In your Firebase Console (tab `megaMindRatings`):
1. Navigate to **Firestore Database** &rarr; **Rules**.
2. Set the rules to allow public student reviews:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /reviews/{reviewId} {
         allow read, write: if true;
       }
       match /teachers/{teacherId} {
         allow read, write: if true;
       }
     }
   }
   ```
3. Click **Publish**. Now any student visiting your live site on GitHub Pages can read and submit genuine reviews in real-time!
